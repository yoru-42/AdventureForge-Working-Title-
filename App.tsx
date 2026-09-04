
import React, { useState, useEffect } from 'react';
import { Adventure, GameViewMode, UserProfile } from './types';
import AdventureEditor from './components/AdventureEditor';
import GameView from './components/GameView';
import UserProfileEditor from './components/UserProfileEditor';
import { BodySilhouette } from './components/BodySilhouette';
import { GeminiService } from './services/geminiService';
import { StorageService } from './lib/storageService';
import { syncCharacterAndHoldingRoles } from './lib/economySync';

const USER_ID = "local-user-123";

export function isClothingPlaceholder(title?: string): boolean {
  if (!title) return true;
  const lower = title.trim().toLowerCase();
  if (!lower || lower === '-' || lower === 'none' || lower === 'empty' || lower === 'leer' || lower === 'nichts') return true;

  const placeholders = [
    'barfuß', 'barfuss', 'barefoot',
    'keine kopfbedeckung', 'ohne kopfbedeckung', 'keine mütze', 'kein helm', 'kein hut',
    'keine kleidung', 'nackt', 'unbekleidet',
    'kein', 'keine', 'keines', 'ohne',
    'kein schmuck', 'ohne schmuck', 'kein schuhwerk', 'ohne schuhe',
    'keine oberbekleidung', 'keine hose', 'ohne hemd', 'ohne rüstung', 'ohne rustung'
  ];
  return placeholders.some(p => lower === p || lower.startsWith(p + ' ') || lower.endsWith(' ' + p));
}

export function isClothingItemTitle(title?: string, itemType?: string): boolean {
  if (!title) return false;
  const lowerTitle = title.trim().toLowerCase();
  const lowerType = (itemType || '').trim().toLowerCase();

  if (isClothingPlaceholder(lowerTitle)) return false;

  if (lowerType.includes('rüstung') || lowerType.includes('kleidung') || lowerType.includes('outfit')) {
    return true;
  }

  // Exclude weapons
  const weaponKeywords = ['schwert', 'bogen', 'dolch', 'klinge', 'degen', 'gewehr', 'pistole', 'lanze', 'speer', 'axt', 'tsuki no wa', 'säbel', 'katana', 'waffe', 'weapon', 'messer', 'schild', 'hammer'];
  if (weaponKeywords.some(kw => lowerTitle.includes(kw))) {
    return false;
  }

  const clothingKeywords = [
    'hemd', 'stiefel', 'schürze', 'schuerze', 'nachthemd', 'hose', 'mantel', 'robe', 'gewand',
    'kleid', 'schuhe', 'mütze', 'muetze', 'hut', 'oberteil', 'unterteil', 'kleidung', 'outfit',
    'sandalen', 'wams', 'tunik', 'tunika', 'rock', 'lederkluft', 'kochkluft', 'arbeitsbekleidung',
    'rüstung', 'panzer', 'beinschienen'
  ];
  return clothingKeywords.some(kw => lowerTitle.includes(kw));
}

export function consolidateLoreOutfits(loreList: any[], playerName?: string): { cleanedLore: any[]; changed: boolean } {
  if (!loreList || !Array.isArray(loreList)) return { cleanedLore: [], changed: false };

  let changed = false;
  const nonPlaceholderLore: any[] = [];

  // 1. Filter out placeholders
  for (const entry of loreList) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.category === 'Gegenstände' && isClothingPlaceholder(entry.title)) {
      changed = true;
      continue;
    }
    nonPlaceholderLore.push(entry);
  }

  // 2. Identify individual clothing items by owner
  const clothingByOwner = new Map<string, any[]>();
  const otherLore: any[] = [];

  for (const entry of nonPlaceholderLore) {
    if (entry.category === 'Gegenstände' && isClothingItemTitle(entry.title, entry.details?.itemType)) {
      const owner = (entry.details?.owner || playerName || 'Spieler').trim();
      const ownerKey = owner.toLowerCase();
      if (!clothingByOwner.has(ownerKey)) {
        clothingByOwner.set(ownerKey, []);
      }
      clothingByOwner.get(ownerKey)!.push(entry);
    } else {
      otherLore.push(entry);
    }
  }

  const finalLore = [...otherLore];

  // 3. Consolidate clothing items into single Outfit entry per owner
  clothingByOwner.forEach((items, ownerKey) => {
    if (items.length === 0) return;

    const existingOutfit = items.find(i => {
      const t = (i.title || '').toLowerCase();
      return t.includes('outfit') || t.includes('kluft') || t.includes('garderobe') || t.startsWith('kleidung');
    });

    if (items.length === 1 && existingOutfit) {
      finalLore.push(items[0]);
    } else {
      changed = true;
      const ownerName = items[0]?.details?.owner || playerName || 'Spieler';
      const allItemTitles = Array.from(new Set(items.map(i => i.title.trim()).filter(Boolean)));

      const outfitTitle = existingOutfit?.title || (allItemTitles.length === 1 ? `Outfit: ${allItemTitles[0]}` : `Outfit (${ownerName})`);
      const outfitDesc = `Vollständiges Outfit bestehend aus: ${allItemTitles.join(', ')}.`;

      const consolidatedEntry = existingOutfit ? {
        ...existingOutfit,
        title: outfitTitle,
        description: outfitDesc,
        details: {
          ...(existingOutfit.details || {}),
          owner: ownerName,
          itemType: 'Rüstung / Kleidung',
          rarity: existingOutfit.details?.rarity || 'Gewöhnlich'
        }
      } : {
        id: 'dyn-itm-outfit-' + Math.random().toString(36).substr(2, 9),
        category: 'Gegenstände',
        title: outfitTitle,
        description: outfitDesc,
        isUnlocked: true,
        details: {
          owner: ownerName,
          itemType: 'Rüstung / Kleidung',
          rarity: 'Gewöhnlich'
        }
      };

      finalLore.push(consolidatedEntry);
    }
  });

  return { cleanedLore: finalLore, changed };
}

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<GameViewMode>(GameViewMode.HOME);
  const [currentAdventure, setCurrentAdventure] = useState<Adventure | null>(null);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = StorageService.getItemSync<UserProfile>('userProfile');
      return saved ? saved : {
        name: '',
        bio: '',
        preferredRole: '',
        appearance: {
          gender: 'Weiblich',
          age: '20',
          build: 'Schlank',
          hairColor: '',
          eyeColor: '',
          cupSize: '-'
        }
      };
    } catch (e) {
      console.error("Failed to parse user profile", e);
      return {
        name: '',
        bio: '',
        preferredRole: '',
        appearance: {
          gender: 'Weiblich',
          age: '20',
          build: 'Schlank',
          hairColor: '',
          eyeColor: '',
          cupSize: '-'
        }
      };
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adventureToDelete, setAdventureToDelete] = useState<string | null>(null);
  const [activeLogbookTab, setActiveLogbookTab] = useState<'character' | 'stats' | 'abilities' | 'inventory' | 'chronicle' | 'codex'>('character');
  const [statsSubTab, setStatsSubTab] = useState<'resources' | 'radar'>('resources');
  const [codexSubTab, setCodexSubTab] = useState<'rules' | 'timeline'>('rules');
  const [newWeaponName, setNewWeaponName] = useState("");
  const [newItemName, setNewItemName] = useState("");

  // Initiales Laden
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const savedAdventures = await StorageService.getItem<Adventure[]>('adventures');
        if (savedAdventures && savedAdventures.length > 0 && isMounted) {
          setAdventures(savedAdventures);

          // Async background optimization to shrink large images (e.g., length > 120,000)
          setTimeout(async () => {
            let hasOptimized = false;
            const optimized = await Promise.all(savedAdventures.map(async (adv) => {
              let advChanged = false;
              
              // Compress player portrait
              if (adv.player?.image && adv.player.image.startsWith('data:') && adv.player.image.length > 120000) {
                try {
                  const compressed = await GeminiService.compressImageBase64(adv.player.image, 512, 0.65);
                  if (compressed !== adv.player.image) {
                    adv.player.image = compressed;
                    advChanged = true;
                  }
                } catch (e) {
                  console.error("Failed to compress player image", e);
                }
              }

              // Compress initial player portrait
              if (adv.initialPlayer?.image && adv.initialPlayer.image.startsWith('data:') && adv.initialPlayer.image.length > 120000) {
                try {
                  const compressed = await GeminiService.compressImageBase64(adv.initialPlayer.image, 512, 0.65);
                  if (compressed !== adv.initialPlayer.image) {
                    adv.initialPlayer.image = compressed;
                    advChanged = true;
                  }
                } catch (e) {
                  console.error("Failed to compress initial player image", e);
                }
              }

              // Compress NPCs portraits
              if (adv.npcs && adv.npcs.length > 0) {
                const updatedNpcs = await Promise.all(adv.npcs.map(async (npc) => {
                  if (npc.image && npc.image.startsWith('data:') && npc.image.length > 120000) {
                    try {
                      const compressed = await GeminiService.compressImageBase64(npc.image, 512, 0.65);
                      if (compressed !== npc.image) {
                        advChanged = true;
                        return { ...npc, image: compressed };
                      }
                    } catch (e) {
                      console.error("Failed to compress NPC image", e);
                    }
                  }
                  return npc;
                }));
                if (advChanged) {
                  adv.npcs = updatedNpcs;
                }
              }

              // Compress initial NPCs portraits
              if (adv.initialNpcs && adv.initialNpcs.length > 0) {
                const updatedInitialNpcs = await Promise.all(adv.initialNpcs.map(async (npc) => {
                  if (npc.image && npc.image.startsWith('data:') && npc.image.length > 120000) {
                    try {
                      const compressed = await GeminiService.compressImageBase64(npc.image, 512, 0.65);
                      if (compressed !== npc.image) {
                        advChanged = true;
                        return { ...npc, image: compressed };
                      }
                    } catch (e) {
                      console.error("Failed to compress initial NPC image", e);
                    }
                  }
                  return npc;
                }));
                if (advChanged) {
                  adv.initialNpcs = updatedInitialNpcs;
                }
              }

              if (advChanged) {
                hasOptimized = true;
              }
              return adv;
            }));

            if (hasOptimized && isMounted) {
              console.log("StorageService adventures successfully optimized and compressed!");
              setAdventures(optimized);
              await StorageService.setItem('adventures', optimized);
            }
          }, 1500);
        }

        const savedProfile = await StorageService.getItem<UserProfile>('userProfile');
        if (savedProfile && isMounted) {
          setUserProfile(savedProfile);
        }
      } catch (e) {
        console.error("Fehler beim Laden der Abenteuer:", e);
      }
    };
    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Automatisches Speichern bei Änderungen
  useEffect(() => {
    if (adventures.length > 0) {
      StorageService.setItem('adventures', adventures)
        .then(() => setError(null))
        .catch(e => {
          console.warn("Auto-save failed in StorageService:", e);
        });
    }
  }, [adventures]);

  const saveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    StorageService.setItem('userProfile', profile);
    setViewMode(GameViewMode.HOME);
  };

  const saveAdventure = (adventure: Adventure) => {
    const exists = adventures.find(a => a.id === adventure.id);
    let newAdventures;
    if (exists) {
      newAdventures = adventures.map(a => a.id === adventure.id ? adventure : a);
    } else {
      newAdventures = [adventure, ...adventures];
    }
    
    // Set state and navigate to PLAY mode immediately so the user can play and chat!
    setAdventures(newAdventures);
    setCurrentAdventure(adventure);
    setViewMode(GameViewMode.PLAY);
    setError(null);
  };

  const autoSaveAdventure = (adventure: Adventure) => {
    // Check if the current view is still EDIT_WORLD, otherwise don't auto-save over an active game
    if (viewMode !== GameViewMode.EDIT_WORLD) return;
    
    const exists = adventures.find(a => a.id === adventure.id);
    let newAdventures;
    if (exists) {
      newAdventures = adventures.map(a => a.id === adventure.id ? adventure : a);
    } else {
      newAdventures = [adventure, ...adventures];
    }
    
    try {
      setAdventures(newAdventures);
      setCurrentAdventure(adventure);
      
      StorageService.setItem('adventures', newAdventures);
    } catch (e) {
      console.warn("Auto-save failed to write to StorageService:", e);
    }
  };

  /**
   * cleanupCodex: Bereinigt die loreDatabase von verwaisten Geister-Einträgen,
   * unvollständigen Fragmenten und Einträgen, die nicht mit der aktuellen
   * Abenteuer-Session oder dem aktiven Nutzer verknüpft sind.
   */
  const cleanupCodex = (advToClean?: Adventure): Adventure | null => {
    const target = advToClean || currentAdventure;
    if (!target) return null;

    const playerName = (target.player?.name || '').trim().toLowerCase();
    const playerNick = (target.player?.nickname || '').trim().toLowerCase();
    const origPlayerName = (target.player?.originalIdentity?.name || '').trim().toLowerCase();
    const userProfileName = (userProfile?.name || '').trim().toLowerCase();

    const isUserOrPlayerOwner = (owner?: string) => {
      if (!owner) return true; // Globale / neutrale Welteneinträge beibehalten
      const o = owner.trim().toLowerCase();
      if (['spieler', 'player', 'user', 'nutzer', 'alle', 'öffentlich', 'world', 'welt'].includes(o)) return true;
      if (playerName && (o === playerName || o.includes(playerName) || playerName.includes(o))) return true;
      if (playerNick && (o === playerNick || o.includes(playerNick) || playerNick.includes(o))) return true;
      if (origPlayerName && (o === origPlayerName || o.includes(origPlayerName))) return true;
      if (userProfileName && (o === userProfileName || o.includes(userProfileName))) return true;
      return false;
    };

    const activeNpcNames = new Set<string>();
    (target.npcs || []).forEach(n => {
      if (n.name) activeNpcNames.add(n.name.trim().toLowerCase());
      if (n.nickname) activeNpcNames.add(n.nickname.trim().toLowerCase());
    });
    (target.initialNpcs || []).forEach(n => {
      if (n.name) activeNpcNames.add(n.name.trim().toLowerCase());
      if (n.nickname) activeNpcNames.add(n.nickname.trim().toLowerCase());
    });

    const isKnownNpcOwner = (owner?: string) => {
      if (!owner) return false;
      const o = owner.trim().toLowerCase();
      for (const npcName of activeNpcNames) {
        if (o === npcName || o.includes(npcName) || npcName.includes(o)) return true;
      }
      return false;
    };

    const structuredInvItems = new Set<string>();
    if (target.structuredInventory) {
      (target.structuredInventory.weapons || []).forEach(w => w && structuredInvItems.add(w.trim().toLowerCase()));
      (target.structuredInventory.generalItems || []).forEach(i => i && structuredInvItems.add(i.trim().toLowerCase()));
      if (target.structuredInventory.armor) {
        Object.values(target.structuredInventory.armor).forEach(a => typeof a === 'string' && a && structuredInvItems.add(a.trim().toLowerCase()));
      }
      if (target.structuredInventory.accessories) {
        Object.values(target.structuredInventory.accessories).forEach(a => typeof a === 'string' && a && structuredInvItems.add(a.trim().toLowerCase()));
      }
    }
    (target.inventory || []).forEach(i => i && structuredInvItems.add(i.trim().toLowerCase()));

    const currentLore = target.loreDatabase || [];
    const seenSignatures = new Set<string>();
    const cleanedLore: any[] = [];

    currentLore.forEach((entry: any) => {
      if (!entry || typeof entry !== 'object') return;
      const title = (entry.title || '').trim();
      const category = (entry.category || '').trim();
      if (!title || !category) return; // Ungültige Fragmente ohne Titel oder Kategorie entfernen

      // Eindeutige Signatur (Kategorie + bereinigter Name)
      const normKey = `${category.toLowerCase()}_${title.toLowerCase().replace(/[-\s_]/g, '')}`;
      if (seenSignatures.has(normKey)) {
        return; // Duplikate und Geister-Klone verwerfen
      }

      // Spezifische Bereinigungsprüfung nach Kategorie
      if (category === 'Gegenstände') {
        const owner = entry.details?.owner;
        const lowerTitle = title.toLowerCase();
        const isInInventory = structuredInvItems.has(lowerTitle);
        const isPlayerOwned = isUserOrPlayerOwner(owner);
        const isNpcOwned = isKnownNpcOwner(owner);

        // Verwaiste Gegenstände ohne Bezug zum Spieler, den aktiven NPCs oder dem Inventar
        if (owner && !isPlayerOwned && !isNpcOwned && !isInInventory && entry.id?.startsWith('dyn-')) {
          return;
        }
      } else if (category === 'Charaktere') {
        const charNameLower = title.toLowerCase();
        const isPlayer = isUserOrPlayerOwner(charNameLower);
        const isNpc = isKnownNpcOwner(charNameLower);
        const isInitialWorldChar = !(entry.id?.startsWith('dyn-'));

        // Dynamische Geister-Charaktere aus vorherigen Sitzungen eliminieren
        if (!isPlayer && !isNpc && !isInitialWorldChar && (!entry.description || entry.description.trim().length < 5)) {
          return;
        }
      }

      seenSignatures.add(normKey);
      cleanedLore.push(entry);
    });

    const { cleanedLore: consolidatedLore } = consolidateLoreOutfits(cleanedLore, target.player?.name);

    const cleanedAdventure: Adventure = {
      ...target,
      loreDatabase: consolidatedLore,
      ...(target.initialLoreDatabase ? {
        initialLoreDatabase: target.initialLoreDatabase.filter((initEntry: any) =>
          consolidatedLore.some((c: any) => c.id === initEntry.id || c.title === initEntry.title)
        )
      } : {})
    };

    setAdventures(prev => {
      const updated = prev.map(a => a.id === cleanedAdventure.id ? cleanedAdventure : a);
      StorageService.setItem('adventures', updated).catch(e => {
        console.error("Fehler beim Speichern der bereinigten Abenteuer:", e);
      });
      return updated;
    });

    setCurrentAdventure(cleanedAdventure);
    return cleanedAdventure;
  };

  const updateAdventure = (updatedAdv: Adventure) => {
    let finalAdv = updatedAdv;
    if (updatedAdv.structuredInventory) {
      const pName = updatedAdv.player?.name || 'Spieler';
      let updatedLore = [...(updatedAdv.loreDatabase || [])];
      let changed = false;

      const isOwnerMatch = (owner?: string) => {
        if (!owner) return false;
        const o = owner.trim().toLowerCase();
        const p = pName.trim().toLowerCase();
        return o === p || o === 'spieler' || o === 'player' || (updatedAdv.player?.nickname && o === updatedAdv.player.nickname.trim().toLowerCase());
      };

      // Ensure that any item whose owner is NOT the player is removed from the player's structuredInventory
      const notOwnedItemNames = updatedLore
        .filter(entry => 
          entry.category === 'Gegenstände' && 
          (!entry.details?.owner || !isOwnerMatch(entry.details.owner))
        )
        .map(entry => entry.title.trim().toLowerCase());

      // Ensure that any weapon or item whose owner IS the player is added to structuredInventory
      const playerOwnedEntries = updatedLore.filter(entry => 
        entry.category === 'Gegenstände' && isOwnerMatch(entry.details?.owner)
      );

      let invChanged = false;
      let currentInv = { ...updatedAdv.structuredInventory };

      let cleanWeapons = [...(currentInv.weapons || [])].filter(wpn => {
        const isNotOwned = wpn && notOwnedItemNames.includes(wpn.trim().toLowerCase());
        if (isNotOwned) invChanged = true;
        return !isNotOwned;
      });

      let cleanGeneralItems = [...(currentInv.generalItems || [])].filter(itm => {
        const isNotOwned = itm && notOwnedItemNames.includes(itm.trim().toLowerCase());
        if (isNotOwned) invChanged = true;
        return !isNotOwned;
      });

      const cleanArmor = { ...(currentInv.armor || {}) };
      if (currentInv.armor) {
        (Object.keys(currentInv.armor) as Array<keyof typeof cleanArmor>).forEach(slot => {
          const val = cleanArmor[slot];
          if (val && notOwnedItemNames.includes(val.trim().toLowerCase())) {
            cleanArmor[slot] = "";
            invChanged = true;
          }
        });
      }

      const cleanAccessories = { ...(currentInv.accessories || {}) };
      if (currentInv.accessories) {
        (Object.keys(currentInv.accessories) as Array<keyof typeof cleanAccessories>).forEach(slot => {
          const val = cleanAccessories[slot];
          if (val && notOwnedItemNames.includes(val.trim().toLowerCase())) {
            cleanAccessories[slot] = "";
            invChanged = true;
          }
        });
      }

      // Check for weapons and items from the Codex that belong to the player
      const weaponKeywords = ['schwert', 'bogen', 'dolch', 'klinge', 'degen', 'gewehr', 'pistole', 'lanze', 'speer', 'axt', 'tsuki no wa', 'säbel', 'katana', 'waffe', 'weapon', 'messer', 'schild', 'drachenschwert', 'lanze', 'kolben', 'hammer', 'stab'];
      playerOwnedEntries.forEach(entry => {
        const title = entry.title?.trim();
        if (!title) return;
        const titleLower = title.toLowerCase();
        const typeLower = (entry.details?.itemType || '').toLowerCase();
        const descLower = (entry.description || '').toLowerCase();
        const isWeapon = typeLower.includes('waff') || weaponKeywords.some(kw => titleLower.includes(kw) || typeLower.includes(kw) || descLower.includes(kw));

        if (isWeapon) {
          if (!cleanWeapons.some(w => w.trim().toLowerCase() === titleLower)) {
            cleanWeapons.push(title);
            invChanged = true;
          }
        } else {
          // If it's not armor or accessory, add to generalItems if not present
          const inArmor = Object.values(cleanArmor).some(a => typeof a === 'string' && a.trim().toLowerCase() === titleLower);
          const inAcc = Object.values(cleanAccessories).some(a => typeof a === 'string' && a.trim().toLowerCase() === titleLower);
          if (!inArmor && !inAcc && !cleanGeneralItems.some(i => i.trim().toLowerCase() === titleLower)) {
            cleanGeneralItems.push(title);
            invChanged = true;
          }
        }
      });

      if (invChanged) {
        updatedAdv = {
          ...updatedAdv,
          structuredInventory: {
            ...currentInv,
            weapons: cleanWeapons,
            generalItems: cleanGeneralItems,
            armor: cleanArmor,
            accessories: cleanAccessories
          }
        };
        finalAdv = updatedAdv;
      }

      const ensureItemInCodex = (name: string, isWpn: boolean) => {
        if (!name) return;
        const trimmed = name.trim();
        const lower = trimmed.toLowerCase();
        if (!trimmed || isClothingPlaceholder(trimmed)) return;

        const existsIdx = updatedLore.findIndex(e => e.category === 'Gegenstände' && e.title.trim().toLowerCase() === lower);
        if (existsIdx > -1) {
          const existing = updatedLore[existsIdx];
          const currentDetails = existing.details || {};
          if (!existing.isUnlocked || currentDetails.owner?.trim().toLowerCase() !== pName.trim().toLowerCase()) {
            updatedLore[existsIdx] = {
              ...existing,
              isUnlocked: true,
              details: {
                ...currentDetails,
                owner: pName
              }
            };
            changed = true;
          }
        } else {
          const itemType = isWpn ? 'Waffen' : 'Werkzeuge & Alltags-Gegenstände';
          const newEntry = {
            id: 'dyn-itm-' + Math.random().toString(36).substr(2, 9),
            category: 'Gegenstände',
            title: trimmed,
            description: isWpn
              ? `Eine Waffe im Besitz von ${pName}.`
              : `Ein nützlicher Gegenstand in der Tasche von ${pName}.`,
            isUnlocked: true,
            details: {
              owner: pName,
              itemType,
              rarity: 'Gewöhnlich'
            }
          };
          updatedLore.push(newEntry as any);
          changed = true;
        }
      };

      if (Array.isArray(updatedAdv.structuredInventory.weapons)) {
        updatedAdv.structuredInventory.weapons.forEach((wpn: string) => ensureItemInCodex(wpn, true));
      }
      if (Array.isArray(updatedAdv.structuredInventory.generalItems)) {
        updatedAdv.structuredInventory.generalItems.forEach((itm: string) => ensureItemInCodex(itm, false));
      }
      if (updatedAdv.structuredInventory.accessories) {
        Object.values(updatedAdv.structuredInventory.accessories).forEach((itm: any) => {
          if (typeof itm === 'string') ensureItemInCodex(itm, false);
        });
      }

      // Consolidate lore outfits and remove placeholders
      const { cleanedLore: consolidatedLore, changed: outfitChanged } = consolidateLoreOutfits(updatedLore, pName);
      if (outfitChanged || changed) {
        updatedLore = consolidatedLore;
        changed = true;
      }

      if (changed) {
        finalAdv = {
          ...updatedAdv,
          loreDatabase: updatedLore
        };
      }
    }

    // Deduplicate loreDatabase automatically to prevent similar-named duplicates of the same category
    if (finalAdv.loreDatabase && finalAdv.loreDatabase.length > 0) {
      const seenCleanTitles = new Map<string, any>(); // category_cleanTitle -> entry reference
      const cleanLore: any[] = [];
      let isLoreCleaned = false;

      finalAdv.loreDatabase.forEach((entry: any) => {
        if (!entry || !entry.category || !entry.title) return;
        const cleanTitle = `${entry.category}_${entry.title.trim().toLowerCase().replace(/[-\s_]/g, '')}`;
        if (seenCleanTitles.has(cleanTitle)) {
          isLoreCleaned = true;
          // merge details and description of duplicates
          const firstSeen = seenCleanTitles.get(cleanTitle);
          if (firstSeen) {
            firstSeen.description = firstSeen.description || entry.description;
            firstSeen.details = {
              ...(firstSeen.details || {}),
              ...(entry.details || {})
            };
            if (entry.isUnlocked) {
              firstSeen.isUnlocked = true;
            }
          }
        } else {
          const entryCopy = { ...entry };
          seenCleanTitles.set(cleanTitle, entryCopy);
          cleanLore.push(entryCopy);
        }
      });

      if (isLoreCleaned) {
        finalAdv = {
          ...finalAdv,
          loreDatabase: cleanLore
        };
      }
    }

    // Synchronize character professions & holding roles
    if (finalAdv.world?.economyConfig?.holdings || finalAdv.loreDatabase) {
      const holdings = finalAdv.world?.economyConfig?.holdings || [];
      const loreDb = finalAdv.loreDatabase || [];
      const player = finalAdv.player;
      const npcs = finalAdv.npcs;

      const { updatedHoldings, updatedLoreDatabase, updatedPlayer, updatedNpcs, changed: rolesSynced } = 
        syncCharacterAndHoldingRoles(holdings, loreDb, player, npcs);

      if (rolesSynced) {
        finalAdv = {
          ...finalAdv,
          loreDatabase: updatedLoreDatabase,
          player: updatedPlayer || finalAdv.player,
          npcs: updatedNpcs || finalAdv.npcs,
          world: {
            ...finalAdv.world,
            economyConfig: finalAdv.world?.economyConfig ? {
              ...finalAdv.world.economyConfig,
              holdings: updatedHoldings
            } : undefined
          }
        };
      }
    }

    setAdventures(prev => prev.map(a => a.id === finalAdv.id ? finalAdv : a));
    setCurrentAdventure(finalAdv);
  };

  const deleteAdventure = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdventureToDelete(id);
  };

  const confirmDelete = () => {
    if (!adventureToDelete) return;
    const filtered = adventures.filter(a => a.id !== adventureToDelete);
    setAdventures(filtered);
    StorageService.setItem('adventures', filtered);
    if (currentAdventure?.id === adventureToDelete) setCurrentAdventure(null);
    setAdventureToDelete(null);
    setError(null);
  };

  const handleEditWorld = (adv: Adventure, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAdventure(adv);
    setViewMode(GameViewMode.EDIT_WORLD);
  };

  const handleJoinWithCustomChar = (adv: Adventure) => {
    setCurrentAdventure(adv);
    setViewMode(GameViewMode.JOIN_CUSTOM_CHAR);
  };

  // Filter-Logik für die Suche
  const matchesSearch = (adv: Adventure) => {
    const term = searchTerm.toLowerCase();
    return (
      (adv.world?.title || '').toLowerCase().includes(term) ||
      (adv.world?.description || '').toLowerCase().includes(term) ||
      (adv.world?.era || '').toLowerCase().includes(term) ||
      (adv.player?.name || '').toLowerCase().includes(term)
    );
  };

  const myAdventures = adventures.filter(a => a.authorId === USER_ID && matchesSearch(a));
  const publicLibrary = adventures.filter(a => a.isPublic && a.authorId !== USER_ID && matchesSearch(a));

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-slate-950 overflow-x-hidden w-full">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs animate-bounce">
          <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span className="text-xs font-bold">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      )}

      {viewMode === GameViewMode.HOME && (
        <div className="w-full max-w-lg space-y-8 py-10 px-4">
          <header className="text-center space-y-2">
            <h1 className="text-5xl font-fantasy text-amber-500 drop-shadow-lg">AdventureForge</h1>
            <p className="text-slate-400 font-medium italic">Deine Geschichten, deine Helden</p>
          </header>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setCurrentAdventure(null); setViewMode(GameViewMode.CREATE); }}
                className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold shadow-2xl transition-all hover:scale-[1.02]"
              >
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-2xl group-hover:rotate-12 transition-transform"></i>
                  <span className="block text-sm">Neue Welt</span>
                </div>
              </button>
              
              <button 
                onClick={() => setViewMode(GameViewMode.PROFILE)}
                className="group relative overflow-hidden p-6 rounded-3xl bg-slate-800 text-white font-bold shadow-2xl transition-all hover:scale-[1.02] border border-slate-700"
              >
                <div className="relative z-10 flex flex-col items-center justify-center text-center gap-2">
                  <i className="fa-solid fa-user-gear text-2xl text-amber-500"></i>
                  <span className="block text-sm">Mein Profil</span>
                </div>
              </button>
            </div>

            {/* Suchfeld */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <i className={`fa-solid fa-magnifying-glass transition-colors ${searchTerm ? 'text-amber-500' : 'text-slate-500'}`}></i>
              </div>
              <input 
                type="text" 
                placeholder="Suche nach Welten, Helden oder Tags..." 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>

            {/* Meine Abenteuer */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex justify-between">
                <span>Meine Abenteuer</span>
                <span>{myAdventures.length}</span>
              </h2>
              {myAdventures.length === 0 && (
                <p className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-900 rounded-3xl">
                  {searchTerm ? "Keine Treffer in deinen Abenteuern." : "Noch keine eigenen Welten geschmiedet."}
                </p>
              )}
              {myAdventures.map((adv, aIdx) => (
                <div key={adv.id ? `my-adv-${adv.id}-${aIdx}` : `my-adv-${aIdx}`} onClick={() => { setCurrentAdventure(adv); setViewMode(GameViewMode.PLAY); }} className="group p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/20">
                      {adv.player.image ? <img src={adv.player.image} className="w-full h-full object-cover rounded-lg" /> : <i className="fa-solid fa-scroll"></i>}
                    </div>
                    <div>
                      <h3 className="font-fantasy text-slate-200">{adv.world.title}</h3>
                      <div className="flex gap-2 items-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${adv.isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {adv.isPublic ? 'Öffentlich' : 'Privat'}
                        </span>
                        <p className="text-xs text-slate-500">{adv.player.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 relative z-10">
                    <button onClick={(e) => handleEditWorld(adv, e)} className="p-2 text-slate-500 hover:text-amber-500 transition-colors" title="Welt bearbeiten"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={(e) => deleteAdventure(adv.id, e)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Abenteuer löschen"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bibliothek */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Öffentliche Bibliothek</h2>
              {publicLibrary.length === 0 && (
                <p className="text-center py-8 text-slate-600 text-sm italic">
                   {searchTerm ? "Keine Welten gefunden." : "Die Bibliothek ist aktuell leer..."}
                </p>
              )}
              {publicLibrary.map((adv, pIdx) => (
                <div key={adv.id ? `pub-adv-${adv.id}-${pIdx}` : `pub-adv-${pIdx}`} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20"><i className="fa-solid fa-earth-europe"></i></div>
                    <div>
                      <h3 className="font-fantasy text-slate-200">{adv.world.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{adv.world.description}</p>
                    </div>
                  </div>
                  <button onClick={() => handleJoinWithCustomChar(adv)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-2">
                    <i className="fa-solid fa-user-plus"></i> Spielen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === GameViewMode.PROFILE && (
        <UserProfileEditor 
          profile={userProfile} 
          onSave={saveProfile} 
          onCancel={() => setViewMode(GameViewMode.HOME)} 
        />
      )}

      {(viewMode === GameViewMode.CREATE || viewMode === GameViewMode.EDIT_WORLD || viewMode === GameViewMode.JOIN_CUSTOM_CHAR) && (
        <AdventureEditor 
          onSave={saveAdventure} 
          onAutoSave={autoSaveAdventure}
          onCancel={() => setViewMode(GameViewMode.HOME)}
          initialData={currentAdventure || undefined}
          mode={viewMode}
          userId={USER_ID}
          userProfile={userProfile}
        />
      )}

      {viewMode === GameViewMode.PLAY && currentAdventure && (
        <GameView 
          adventure={currentAdventure} 
          onViewChange={setViewMode} 
          onUpdateAdventure={updateAdventure}
          userProfile={userProfile}
        />
      )}

      {viewMode === GameViewMode.STATUS && currentAdventure && (
        <div className="w-full max-w-lg bg-slate-900 h-screen sm:h-auto sm:rounded-3xl p-6 sm:p-8 border-x sm:border border-slate-800 sm:mt-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-fantasy text-amber-500 flex items-center gap-2">
              <i className="fa-solid fa-book text-2xl text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"></i>
              Logbuch
            </h2>
            <button onClick={() => setViewMode(GameViewMode.PLAY)} className="text-slate-400 hover:text-white p-2 transition-colors duration-150"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>

          {/* RPG Tab Navigation */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-6 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveLogbookTab('character')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'character'
                  ? 'bg-gradient-to-b from-amber-500/15 to-amber-600/5 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-user-shield text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Held</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('stats')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'stats'
                  ? 'bg-gradient-to-b from-indigo-500/15 to-indigo-600/5 border-indigo-500/50 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-gem text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Macht</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('abilities')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'abilities'
                  ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-600/5 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-wand-magic-sparkles text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Künste</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('inventory')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'inventory'
                  ? 'bg-gradient-to-b from-sky-500/15 to-sky-600/5 border-sky-500/50 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-briefcase text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Inventar</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('chronicle')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'chronicle'
                  ? 'bg-gradient-to-b from-rose-500/15 to-rose-600/5 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-book-open text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Chronik</span>
            </button>
            <button
              onClick={() => setActiveLogbookTab('codex')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all cursor-pointer ${
                activeLogbookTab === 'codex'
                  ? 'bg-gradient-to-b from-amber-500/15 to-amber-600/5 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)] font-bold'
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <i className="fa-solid fa-scale-balanced text-xs mb-1"></i>
              <span className="text-[10px] tracking-tight uppercase">Codex</span>
            </button>
          </div>

          <div className="space-y-6">
            {activeLogbookTab === 'character' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex gap-4 items-center">
                  {currentAdventure.player.image ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-xl">
                      <img src={currentAdventure.player.image} alt="Portrait" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-amber-600/20 rounded-2xl flex items-center justify-center text-4xl text-amber-500/50">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-bold text-white">{currentAdventure.player.name}</h4>
                    <p className="text-amber-500">{currentAdventure.player.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs p-5 bg-slate-950 rounded-2xl border border-slate-850">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Alter</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.age || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Statur</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.build || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Geschlecht</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.gender || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Körbchengröße</span>
                    <span className="text-pink-400 font-bold text-sm">{currentAdventure.player.appearance.cupSize || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Haare</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.hairColor || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Augen</span>
                    <span className="text-slate-200 text-sm">{currentAdventure.player.appearance.eyeColor || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Größe</span>
                    <span className="text-slate-200 text-sm">{(currentAdventure.player.appearance as any).height || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Maße</span>
                    <span className="text-slate-200 text-sm">{(currentAdventure.player.appearance as any).measurements || '-'}</span>
                  </div>
                </div>

                {/* VISUAL BODY SILHOUETTE SECTION */}
                <div className="space-y-3 pt-4 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                    Körper-Silhouette & Physischer Status
                  </span>
                  <BodySilhouette
                    player={currentAdventure.player}
                    loreDatabase={currentAdventure.loreDatabase}
                    npcs={currentAdventure.npcs}
                    onUpdateLore={(updatedLore) => {
                      updateAdventure({
                        ...currentAdventure,
                        loreDatabase: updatedLore
                      });
                    }}
                    onUpdateNpcs={(updatedNpcs) => {
                      updateAdventure({
                        ...currentAdventure,
                        npcs: updatedNpcs
                      });
                    }}
                    onUpdatePlayer={(updatedPlayer) => {
                      updateAdventure({
                        ...currentAdventure,
                        player: updatedPlayer
                      });
                    }}
                  />
                </div>

                {/* TRANSFORMATIONEN SECTION */}
                {currentAdventure.player.abilities?.some(a => a.category === 'Transformationen') && (
                  <div className="space-y-3 pt-4 border-t border-slate-800/60">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block">
                      🌀 Verfügbare Transformationen
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {currentAdventure.player.abilities
                        .filter(a => a.category === 'Transformationen')
                        .map((ability, abIdx) => {
                          const isActive = currentAdventure.player.appearance?.activeTransformationId === ability.id;
                          return (
                            <div 
                              key={ability.id ? `trans-${ability.id}-${abIdx}` : `trans-${abIdx}`} 
                              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                                isActive 
                                  ? 'bg-purple-950/20 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.15)]' 
                                  : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-200">{ability.name}</span>
                                  {isActive && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold animate-pulse">
                                      AKTIV
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 italic line-clamp-2">{ability.description || 'Keine Beschreibung.'}</p>
                                {ability.cost && (
                                  <span className="text-[9.5px] text-slate-500 font-mono">Kosten: {ability.cost}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPlayer = {
                                    ...currentAdventure.player,
                                    appearance: {
                                      ...currentAdventure.player.appearance,
                                      activeTransformationId: isActive ? 'standard' : (ability.id || '')
                                    }
                                  };
                                  updateAdventure({
                                    ...currentAdventure,
                                    player: updatedPlayer
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all select-none shrink-0 cursor-pointer ${
                                  isActive
                                    ? 'bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 text-rose-300'
                                    : 'bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200'
                                }`}
                              >
                                {isActive ? 'Abbrechen' : 'Verwandeln'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hintergrund</span>
                  <p className="text-sm text-slate-300 leading-relaxed italic whitespace-pre-line">{currentAdventure.player.bio}</p>
                </div>
              </div>
            )}

            {activeLogbookTab === 'stats' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fa-solid fa-gem text-indigo-400"></i> Macht & Werte (Kampagnen-Skala)
                  </span>
                  
                  {/* Subtab navigation */}
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-full sm:w-auto">
                    <button
                      onClick={() => setStatsSubTab('resources')}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        statsSubTab === 'resources'
                          ? 'bg-slate-900 border border-slate-700/60 text-indigo-400 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-bolt text-[10px]"></i> Ressourcen & Zuordnung
                    </button>
                    <button
                      onClick={() => setStatsSubTab('radar')}
                      className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        statsSubTab === 'radar'
                          ? 'bg-slate-900 border border-slate-700/60 text-indigo-400 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-chart-pie text-[10px]"></i> Radar-Werte
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const powerLevels = currentAdventure.player.campaignPowerLevels || {};
                    const campaignPowerSettings = currentAdventure.world.campaignPowerSettings || {};
                    
                    // Helper to resolve power values case-insensitively
                    const getPowerLevelData = (name: string) => {
                      const foundEntry = Object.entries(powerLevels).find(
                        ([k]) => k.toLowerCase().trim() === name.toLowerCase().trim()
                      );
                      if (foundEntry) {
                        return {
                          value: foundEntry[1].value ?? 50,
                          potentialMax: foundEntry[1].potentialMax ?? 100,
                          xp: foundEntry[1].xp ?? 0
                        };
                      }
                      
                      const foundSetting = Object.entries(campaignPowerSettings).find(
                        ([k]) => k.toLowerCase().trim() === name.toLowerCase().trim()
                      );
                      if (foundSetting) {
                        const val = foundSetting[1];
                        if (typeof val === 'number') {
                          return { value: Math.floor(val * 0.4), potentialMax: val, xp: 0 };
                        } else if (val && typeof val === 'object') {
                          return { 
                            value: (val as any).min ?? 10, 
                            potentialMax: (val as any).max ?? 100, 
                            xp: 0 
                          };
                        }
                      }
                      return { value: 50, potentialMax: 100, xp: 0 };
                    };

                    if (statsSubTab === 'resources') {
                      // Render Combat Resources & Zuordnungssystem
                      const healthPowerNames = currentAdventure.world.healthPowerNames || [];
                      const healthLabel = currentAdventure.world.healthLabel || 'Gesundheit';
                      
                      let hpValue = 0;
                      let hpMax = 0;
                      
                      if (healthPowerNames.length > 0) {
                        healthPowerNames.forEach(name => {
                          const data = getPowerLevelData(name);
                          hpValue += data.value;
                          hpMax += data.potentialMax;
                        });
                      } else {
                        const isHero = currentAdventure.world.isHeroic !== false;
                        hpMax = isHero ? 150 : 100;
                        if (currentAdventure.world.dramaLevel === 'Hoch') hpMax = 150;
                        else if (currentAdventure.world.dramaLevel === 'Niedrig') hpMax = 75;
                        hpValue = hpMax;
                      }

                      const healthPercentage = Math.min(100, hpMax > 0 ? (hpValue / hpMax) * 100 : 100);

                      // Get other Combat Resources
                      const costResources = currentAdventure.world.costResources || [];
                      const customStatAllocations = currentAdventure.world.customStatAllocations || [];
                      const customResourceMappings = currentAdventure.world.customResourceMappings || [];

                      const getEffectLabel = (effect: string) => {
                        switch (effect) {
                          case 'regen': return '♻️ Regeneration';
                          case 'shield': return '🛡️ Schildbarriere';
                          case 'dmg_buff': return '🔥 Schadens-Verstärkung';
                          case 'cost_reduction': return '📉 Kosten-Reduktion';
                          case 'rage': return '😡 Wut-Multiplikator';
                          case 'evade': return '💨 Ausweich-Bonus';
                          case 'power_source': return '⚡ Alternative Kraftquelle';
                          default: return '✨ Spezialeffekt';
                        }
                      };

                      return (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          {/* Gesundheit Card */}
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                <span className="text-red-500 text-sm">❤️</span> {healthLabel} (HP)
                              </span>
                              <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                Kapazität: <span className="text-red-400 font-bold">{hpValue}</span> / {hpMax}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                <div 
                                  className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full shadow-[0_0_8px_rgba(239,68,68,0.3)]" 
                                  style={{ width: `${healthPercentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-500">
                                <span>Fortschritt zu absolutem Max</span>
                                <span>{Math.round(healthPercentage)}%</span>
                              </div>
                            </div>
                            
                            {healthPowerNames.length > 0 && (
                              <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                <span className="font-semibold text-slate-500">Zugeordnete Parameter:</span> {healthPowerNames.join(' + ')}
                              </div>
                            )}
                          </div>

                          {/* Cost Resources Cards */}
                          {costResources.map((res, rIdx) => {
                            let resValue = res.baseMax ?? 100;
                            let resPotentialMax = res.baseMax ?? 100;

                            const sources: string[] = [];
                            if (res.radarPowerName) {
                              sources.push(res.radarPowerName);
                              const data = getPowerLevelData(res.radarPowerName);
                              resValue += data.value;
                              resPotentialMax += data.potentialMax;
                            }
                            if (res.sourcePowers && res.sourcePowers.length > 0) {
                              res.sourcePowers.forEach(sp => {
                                sources.push(sp);
                                const data = getPowerLevelData(sp);
                                resValue += data.value;
                                resPotentialMax += data.potentialMax;
                              });
                            }

                            const costPercentage = Math.min(100, resPotentialMax > 0 ? (resValue / resPotentialMax) * 100 : 100);

                            return (
                              <div key={res.id ? `res-${res.id}-${rIdx}` : `res-${rIdx}`} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className="text-cyan-400 text-sm">⚡</span> {res.name}
                                  </span>
                                  <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                    Kapazität: <span className="text-cyan-400 font-bold">{resValue}</span> / {resPotentialMax}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                    <div 
                                      className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full shadow-[0_0_8px_rgba(34,211,238,0.3)]" 
                                      style={{ width: `${costPercentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-500">
                                    <span>Skalierung mit Parametern</span>
                                    <span>{Math.round(costPercentage)}%</span>
                                  </div>
                                </div>
                                
                                {sources.length > 0 && (
                                  <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                    <span className="font-semibold text-slate-500">Gespeist durch:</span> {sources.join(' + ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Custom Resource Mappings Cards (e.g. Qi, Fokus, Wut) */}
                          {customResourceMappings.map((mapping, mIdx) => {
                            let val = mapping.baseMax ?? 100;
                            let max = mapping.baseMax ?? 100;
                            
                            if (mapping.sourcePowers && mapping.sourcePowers.length > 0) {
                              mapping.sourcePowers.forEach(sp => {
                                const data = getPowerLevelData(sp);
                                val += data.value;
                                max += data.potentialMax;
                              });
                            }

                            const percentage = Math.min(100, max > 0 ? (val / max) * 100 : 100);

                            return (
                              <div key={mapping.id ? `resmap-${mapping.id}-${mIdx}` : `resmap-${mIdx}`} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                                <div className="flex justify-between items-center">
                                  <div className="space-y-0.5">
                                    <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                      <span className="text-amber-500 text-sm">{mapping.icon || '✨'}</span> {mapping.name}
                                    </span>
                                    <span className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wide block">
                                      {getEffectLabel(mapping.effect)}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                    Kapazität: <span className="text-amber-400 font-bold">{val}</span> / {max}
                                  </span>
                                </div>
                                
                                {mapping.description && (
                                  <p className="text-xs text-slate-400 leading-normal italic">
                                    {mapping.description}
                                  </p>
                                )}
                                
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                    <div 
                                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {mapping.sourcePowers && mapping.sourcePowers.length > 0 && (
                                  <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                    <span className="font-semibold text-slate-500">Speisende Kraftquellen:</span> {mapping.sourcePowers.join(' + ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Custom Stat Allocations Cards */}
                          {customStatAllocations.map((alloc, aIdx) => {
                            let val = 0;
                            let max = 0;
                            
                            if (alloc.selectedRadarNames && alloc.selectedRadarNames.length > 0) {
                              alloc.selectedRadarNames.forEach(name => {
                                const data = getPowerLevelData(name);
                                val += data.value;
                                max += data.potentialMax;
                              });
                            }

                            const percentage = Math.min(100, max > 0 ? (val / max) * 100 : 100);

                            return (
                              <div key={alloc.id ? `statalloc-${alloc.id}-${aIdx}` : `statalloc-${aIdx}`} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                                    <span className="text-purple-400 text-sm">{alloc.icon || '✊'}</span> {alloc.label}
                                  </span>
                                  <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                    Wert: <span className="text-purple-400 font-bold">{val}</span> / {max}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                                    <div 
                                      className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(147,51,234,0.3)]" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {alloc.selectedRadarNames && alloc.selectedRadarNames.length > 0 && (
                                  <div className="text-[9px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 font-mono">
                                    <span className="font-semibold text-slate-500">Zugeordnete Parameter:</span> {alloc.selectedRadarNames.join(' + ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {costResources.length === 0 && customResourceMappings.length === 0 && customStatAllocations.length === 0 && (
                            <p className="text-[11px] text-slate-500 italic text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                              Keine weiteren Kampf-Ressourcen oder Zuordnungen definiert. Du kannst sie jederzeit in den Welten-Einstellungen (Schritt 2 von 7) konfigurieren!
                            </p>
                          )}
                        </div>
                      );
                    } else {
                      // Render ONLY configured Radar-Diagramm parameters
                      const keys = Object.keys(powerLevels).filter(key => {
                        return Object.keys(campaignPowerSettings).some(
                          k => k.toLowerCase().trim() === key.toLowerCase().trim()
                        );
                      });

                      if (keys.length === 0) {
                        return (
                          <div className="space-y-3 text-center py-6 bg-slate-950/30 rounded-xl border border-dashed border-slate-850">
                            <p className="text-xs text-slate-500 italic">Keine Kampagnen-Parameter im aktuellen Radar-Diagramm definiert.</p>
                            <p className="text-[10px] text-indigo-400 font-semibold">Tipp: Füge im Welten-Editor (Schritt 2 von 7) Parameter hinzu!</p>
                          </div>
                        );
                      }

                      return keys.map(key => {
                        const item = powerLevels[key];
                        const val = item.value ?? 50;
                        const max = item.potentialMax ?? 100;
                        const xp = item.xp ?? 0;
                        
                        const valuePercentage = Math.min(100, (val / max) * 100);
                        const xpPercentage = Math.min(100, xp);
                        
                        return (
                          <div key={key} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-700 transition-all">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-200">{key}</span>
                              <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800/60">
                                Wert: <span className="text-emerald-400 font-bold">{val}</span> / {max}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Aktuelles Potenzial</span>
                                <span>{Math.round(valuePercentage)}%</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div 
                                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
                                  style={{ width: `${valuePercentage}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-[10px] text-slate-400 items-center">
                                <span className="flex items-center gap-1">
                                  <i className="fa-solid fa-circle-play text-indigo-400 text-[8px]"></i> EP Fortschritt (Erfahrung)
                                </span>
                                <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                  {xp} / 100 EP
                                </span>
                              </div>
                              
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                                  style={{ width: `${xpPercentage}%` }}
                                />
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    const updatedPowerLevels = { ...powerLevels };
                                    const nextXp = (updatedPowerLevels[key].xp ?? 0) + 25;
                                    let nextValue = updatedPowerLevels[key].value ?? 50;
                                    let finalXp = nextXp;
                                    if (finalXp >= 100) {
                                      finalXp = finalXp % 100;
                                      nextValue = Math.min(updatedPowerLevels[key].potentialMax || 100, nextValue + 5);
                                    }
                                    updatedPowerLevels[key] = {
                                      ...updatedPowerLevels[key],
                                      xp: finalXp,
                                      value: nextValue
                                    };
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: {
                                        ...currentAdventure.player,
                                        campaignPowerLevels: updatedPowerLevels
                                      }
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-[10px] font-bold text-indigo-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-bolt text-indigo-400"></i> EP sammeln (+25)
                                </button>
                                
                                <button
                                  disabled={xp < 100}
                                  onClick={() => {
                                    const updatedPowerLevels = { ...powerLevels };
                                    const nextValue = Math.min(updatedPowerLevels[key].potentialMax || 100, (updatedPowerLevels[key].value ?? 50) + 5);
                                    updatedPowerLevels[key] = {
                                      ...updatedPowerLevels[key],
                                      xp: Math.max(0, (updatedPowerLevels[key].xp ?? 0) - 100),
                                      value: nextValue
                                    };
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: {
                                        ...currentAdventure.player,
                                        campaignPowerLevels: updatedPowerLevels
                                      }
                                    });
                                  }}
                                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    xp >= 100 
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 hover:brightness-110 border border-emerald-500/30' 
                                      : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  <i className="fa-solid fa-angles-up"></i> Werte steigern (+5)
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    }
                  })()}
                </div>
              </div>
            )}

            {activeLogbookTab === 'abilities' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-500 animate-pulse"></i> Techniken & Fertigkeiten (Progression)
                </span>
                
                <div className="space-y-3">
                  {(() => {
                    const abilities = currentAdventure.player.abilities || [];
                    const techList: any[] = [];
                    abilities.forEach(ability => {
                      if (ability.techniqueList && ability.techniqueList.length > 0) {
                        ability.techniqueList.forEach((t: any) => {
                          techList.push({ ...t, abilityId: ability.id, abilitySource: ability.source });
                        });
                      }
                    });

                    if (techList.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 italic py-4 text-center">Noch keine strukturierten Techniken für diesen Charakter definiert.</p>
                      );
                    }

                    return techList.map((tech, idx) => {
                      const level = tech.level || 1;
                      const maxLevel = tech.maxLevel || 10;
                      const logic = currentAdventure?.world?.techniqueProgressionLogic || tech.progressionLogic || 'ep';
                      
                      return (
                        <div key={tech.id || idx} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3 hover:border-slate-800 transition-all">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">{tech.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold">
                                  Lv. {level} / {maxLevel}
                                </span>
                                <button
                                  onClick={() => {
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, isFavorite: !t.isFavorite } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:text-amber-400 active:scale-95 transition-all text-xs flex items-center justify-center cursor-pointer"
                                  title={tech.isFavorite ? "Aus Favoriten entfernen" : "Als Favorit markieren"}
                                >
                                  <i className={tech.isFavorite ? "fa-solid fa-star text-amber-400" : "fa-regular fa-star"}></i>
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-400 italic leading-relaxed">{tech.description || 'Keine nähere Beschreibung.'}</p>
                              {tech.abilitySource && (
                                <span className="inline-block text-[9px] text-amber-500/80 font-semibold uppercase tracking-wide">
                                  Quelle: {tech.abilitySource}
                                </span>
                              )}
                            </div>
                            
                              <span className="text-[9.5px] px-2 py-0.5 rounded-full font-extrabold uppercase border bg-slate-900 shrink-0 select-none border-slate-800 text-slate-400">
                                {logic === 'ep' && 'EP'}
                                {logic === 'training' && 'Training'}
                                {logic === 'milestone' && 'Meilenstein'}
                                {logic === 'static' && 'Statisch'}
                              </span>
                          </div>

                          {logic === 'ep' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                <span>ERFAHRUNGSPUNKTE (XP)</span>
                                <span className="font-mono text-indigo-400">{tech.xp || 0} / {tech.xpNeeded || 100} XP</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all" 
                                  style={{ width: `${Math.min(100, ((tech.xp || 0) / (tech.xpNeeded || 100)) * 100)}%` }}
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    const gain = tech.xpGainPerUse || 25;
                                    let nextXp = (tech.xp || 0) + gain;
                                    let nextLvl = level;
                                    const needed = tech.xpNeeded || 100;
                                    if (nextXp >= needed) {
                                      nextXp = nextXp % needed;
                                      nextLvl = Math.min(maxLevel, nextLvl + 1);
                                    }
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, xp: nextXp, level: nextLvl } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-indigo-400 hover:border-indigo-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-bolt"></i> Anwenden & Üben (+{tech.xpGainPerUse || 25} XP)
                                </button>
                              </div>
                            </div>
                          )}

                          {logic === 'training' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                <span>TRAININGS-EINHEITEN</span>
                                <span className="font-mono text-cyan-400">{tech.trainingProgress || 0} / {tech.trainingRequired || 3} Übungen</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all" 
                                  style={{ width: `${Math.min(100, ((tech.trainingProgress || 0) / (tech.trainingRequired || 3)) * 100)}%` }}
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    let nextProg = (tech.trainingProgress || 0) + 1;
                                    let nextLvl = level;
                                    const req = tech.trainingRequired || 3;
                                    if (nextProg >= req) {
                                      nextProg = 0;
                                      nextLvl = Math.min(maxLevel, nextLvl + 1);
                                    }
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, trainingProgress: nextProg, level: nextLvl } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-cyan-400 hover:border-cyan-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-dumbbell"></i> Aktiv Trainieren (+1 Einheit)
                                </button>
                              </div>
                            </div>
                          )}

                          {logic === 'milestone' && (
                            <div className="space-y-2 pt-1">
                              <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl text-[10.5px] text-slate-300">
                                <span className="font-extrabold text-amber-500 uppercase tracking-wide mr-1 inline-flex items-center gap-1 mb-0.5">
                                  <i className="fa-solid fa-flag-checkered text-[10px]"></i> Nächste Bedingung:
                                </span>
                                <span className="italic">"{tech.milestoneRequirement || 'Erreiche den nächsten großen Meilenstein in der Story.'}"</span>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, level: Math.min(maxLevel, level + 1) } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-[10px] font-bold text-amber-500 transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                                >
                                  <i className="fa-solid fa-circle-check"></i> Meilenstein erreicht & Level aufsteigen
                                </button>
                              </div>
                            </div>
                          )}

                          {logic === 'static' && (
                            <div className="space-y-2 pt-1">
                              {tech.staticCost && (
                                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl text-[10.5px] text-slate-300">
                                  <span className="font-extrabold text-indigo-400 uppercase tracking-wide mr-1 inline-flex items-center gap-1 mb-0.5">
                                    <i className="fa-solid fa-lock text-[10px]"></i> Upgrade-Voraussetzung:
                                  </span>
                                  <span className="italic">"{tech.staticCost}"</span>
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button
                                  disabled={level >= maxLevel}
                                  onClick={() => {
                                    const updatedAbilities = currentAdventure.player.abilities?.map((a: any) => {
                                      if (a.id === tech.abilityId) {
                                        return {
                                          ...a,
                                          techniqueList: a.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, level: Math.min(maxLevel, level + 1) } : t)
                                        };
                                      }
                                      return a;
                                    });
                                    updateAdventure({
                                      ...currentAdventure,
                                      player: { ...currentAdventure.player, abilities: updatedAbilities }
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-[10px] font-bold text-indigo-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <i className="fa-solid fa-unlock-keyhole"></i> Manuell freischalten / Level aufwerten
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {activeLogbookTab === 'inventory' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-briefcase text-sky-400"></i> Charakter-Inventar & Ausrüstung
                </span>

                {(() => {
                  const structuredInv = currentAdventure.structuredInventory || {};
                  const weapons = structuredInv.weapons || [];
                  const generalItems = structuredInv.generalItems || [];
                  const armor = structuredInv.armor || {};
                  const accessories = structuredInv.accessories || {};
                  const defaultCurrency = currentAdventure.world.title.toLowerCase().includes('one piece') ? 'Berry' : 'Goldstücke';
                  const currencyLabel = structuredInv.currencyLabel ?? defaultCurrency;
                  const moneyValue = structuredInv.money ?? 100;

                  const playerName = currentAdventure.player?.name || '';
                  const playerCodexItems = (currentAdventure.loreDatabase || []).filter(entry => 
                    entry.category === 'Gegenstände' && 
                    entry.details?.owner &&
                    playerName &&
                    entry.details.owner.trim().toLowerCase() === playerName.trim().toLowerCase()
                  );

                  const codexWeapons = playerCodexItems.filter(entry => {
                    const type = (entry.details?.itemType || '').trim().toLowerCase();
                    return type.includes('waffe') || type.includes('weapon') || type.includes('schwert') || type.includes('bogen') || type.includes('dolch') || type.includes('axt') || type.includes('pistole') || type.includes('gewehr') || type.includes('bewaffnung');
                  });

                  const codexGeneralItems = playerCodexItems.filter(entry => {
                    const type = (entry.details?.itemType || '').trim().toLowerCase();
                    const isWeapon = type.includes('waffe') || type.includes('weapon') || type.includes('schwert') || type.includes('bogen') || type.includes('dolch') || type.includes('axt') || type.includes('pistole') || type.includes('gewehr') || type.includes('bewaffnung');
                    return !isWeapon;
                  });

                  const updateInventoryField = (field: string, value: any) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const newInv = {
                      ...oldInv,
                      [field]: value
                    };

                    let updatedStatus = currentAdventure.statusElements;
                    if (field === 'money' || field === 'currencyLabel') {
                      const newMoney = field === 'money' ? (parseInt(value) || 0) : (oldInv.money ?? 100);
                      const newCurr = field === 'currencyLabel' ? (value || '') : (oldInv.currencyLabel || 'Goldstücke');
                      const moneyStr = `${newMoney} ${newCurr}`.trim();

                      if (updatedStatus && updatedStatus.length > 0) {
                        updatedStatus = updatedStatus.map(el => {
                          const l = (el.label || '').toLowerCase();
                          if (l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('währung') || l.includes('münzen') || l.includes('berry') || l.includes('credits')) {
                            return { ...el, value: moneyStr };
                          }
                          return el;
                        });
                      }
                    }

                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv,
                      statusElements: updatedStatus
                    });
                  };

                  const updateArmorField = (slot: string, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldArmor = oldInv.armor || {};
                    const newInv = {
                      ...oldInv,
                      armor: {
                        ...oldArmor,
                        [slot]: value
                      }
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateAccessoryField = (slot: string, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldAcc = oldInv.accessories || {};
                    const newInv = {
                      ...oldInv,
                      accessories: {
                        ...oldAcc,
                        [slot]: value
                      }
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const addWeapon = (name: string) => {
                    if (!name.trim()) return;
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldWeapons = oldInv.weapons || [];
                    const newInv = {
                      ...oldInv,
                      weapons: [...oldWeapons, name.trim()]
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                    setNewWeaponName("");
                  };

                  const removeWeapon = (index: number) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldWeapons = oldInv.weapons || [];
                    const newInv = {
                      ...oldInv,
                      weapons: oldWeapons.filter((_, i) => i !== index)
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateWeapon = (index: number, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldWeapons = [...(oldInv.weapons || [])];
                    oldWeapons[index] = value;
                    const newInv = {
                      ...oldInv,
                      weapons: oldWeapons
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const addGeneralItem = (name: string) => {
                    if (!name.trim()) return;
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldItems = oldInv.generalItems || [];
                    const newInv = {
                      ...oldInv,
                      generalItems: [...oldItems, name.trim()]
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                    setNewItemName("");
                  };

                  const removeGeneralItem = (index: number) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldItems = oldInv.generalItems || [];
                    const newInv = {
                      ...oldInv,
                      generalItems: oldItems.filter((_, i) => i !== index)
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  const updateGeneralItem = (index: number, value: string) => {
                    const oldInv = currentAdventure.structuredInventory || {};
                    const oldItems = [...(oldInv.generalItems || [])];
                    oldItems[index] = value;
                    const newInv = {
                      ...oldInv,
                      generalItems: oldItems
                    };
                    updateAdventure({
                      ...currentAdventure,
                      structuredInventory: newInv
                    });
                  };

                  return (
                    <div className="space-y-6">
                      {/* Geld & Vermögen Card */}
                      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                            <i className="fa-solid fa-coins text-amber-500"></i> Vermögen & Finanzen
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shadow-sm animate-pulse">
                            {moneyValue} {currencyLabel}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Betrag</label>
                            <input
                              type="number"
                              value={moneyValue}
                              onChange={(e) => updateInventoryField('money', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none transition-all font-mono font-bold"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Währung (z.B. Berry, Gold)</label>
                            <input
                              type="text"
                              placeholder="z.B. Berry, Gold"
                              value={currencyLabel}
                              onChange={(e) => updateInventoryField('currencyLabel', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/50 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none transition-all font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Kleidung / Rüstung & Schmuck/Accessoires side-by-side on md, stacked on mobile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kleidung & Rüstung */}
                        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                          <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                            <i className="fa-solid fa-shirt"></i> Kleidung & Rüstung
                          </h5>
                          
                          {/* Kopf */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-hat-cowboy text-slate-600"></i> Kopf
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.head || 'Keine'}</span>
                          </div>

                          {/* Brust/Torso */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-vest text-slate-600"></i> Brust / Torso
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.chest || 'Keine'}</span>
                          </div>

                          {/* Hände */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-hand text-slate-600"></i> Hände
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.hands || 'Keine'}</span>
                          </div>

                          {/* Beine */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-socks text-slate-600"></i> Beine
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.legs || 'Keine'}</span>
                          </div>

                          {/* Füße */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-shoe-prints text-slate-600"></i> Füße
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{armor.feet || 'Keine'}</span>
                          </div>
                        </div>

                        {/* Schmuck & Accessoires */}
                        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                          <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                            <i className="fa-solid fa-gem"></i> Schmuck & Accessoires
                          </h5>
                          
                          {/* Finger */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-ring text-slate-600"></i> Finger
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.finger || 'Keine'}</span>
                          </div>

                          {/* Hals */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-gem text-slate-600"></i> Hals
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.neck || 'Keine'}</span>
                          </div>

                          {/* Handgelenke */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-clock text-slate-600"></i> Handgelenke
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.wrist || 'Keine'}</span>
                          </div>

                          {/* Taille */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-ring text-slate-600"></i> Taille
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.waist || 'Keine'}</span>
                          </div>

                          {/* Rücken */}
                          <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900/80 p-2.5 rounded-xl">
                            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                              <i className="fa-solid fa-shield text-slate-600"></i> Rücken
                            </span>
                            <span className="text-xs text-slate-200 font-medium">{accessories.back || 'Keine'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Waffen (Weapons) */}
                      <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                        <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <i className="fa-solid fa-hand-fist"></i> Waffen / Bewaffnung
                        </h5>

                        {weapons.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {weapons.map((wpn, idx) => {
                              const codexEntry = (currentAdventure.loreDatabase || []).find(entry => 
                                entry.category === 'Gegenstände' && 
                                entry.title.trim().toLowerCase() === wpn.trim().toLowerCase()
                              );

                              if (codexEntry) {
                                return (
                                  <span 
                                    key={`weapon-codex-${idx}`} 
                                    className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-slate-200 flex items-center gap-2"
                                    title={`${codexEntry.title}: ${codexEntry.description}`}
                                  >
                                    <i className="fa-solid fa-shield-halved text-amber-500 text-[10px]"></i>
                                    {codexEntry.title}
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded uppercase tracking-wider">Codex</span>
                                  </span>
                                );
                              }

                              return (
                                <span key={`weapon-${idx}`} className="px-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                                  <i className="fa-solid fa-shield-halved text-sky-500 text-[10px]"></i>
                                  {wpn}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic py-2 text-center">Keine Waffen ausgerüstet.</p>
                        )}
                      </div>

                      {/* Gegenstände (General Items) */}
                      <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 shadow-inner">
                        <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
                          <i className="fa-solid fa-box-open"></i> Sonstige Gegenstände (Tasche)
                        </h5>

                        {generalItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {generalItems.map((itm, idx) => {
                              const codexEntry = (currentAdventure.loreDatabase || []).find(entry => 
                                entry.category === 'Gegenstände' && 
                                entry.title.trim().toLowerCase() === itm.trim().toLowerCase()
                              );

                              if (codexEntry) {
                                return (
                                  <span 
                                    key={`item-codex-${idx}`} 
                                    className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-slate-200 flex items-center gap-2"
                                    title={`${codexEntry.title}: ${codexEntry.description}`}
                                  >
                                    <i className="fa-solid fa-briefcase text-amber-500 text-[10px]"></i>
                                    {codexEntry.title}
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded uppercase tracking-wider">Codex</span>
                                  </span>
                                );
                              }

                              return (
                                <span key={`item-${idx}`} className="px-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                                  <i className="fa-solid fa-briefcase text-emerald-500 text-[10px]"></i>
                                  {itm}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic py-2 text-center">Tasche ist leer.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeLogbookTab === 'chronicle' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-feather-pointed text-rose-400"></i> Bisherige Chronik (Dynamische Erinnerung)
                </span>
                {currentAdventure.summaryLog ? (
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950 p-5 rounded-2xl border border-slate-850 italic shadow-inner">
                    {currentAdventure.summaryLog}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    Noch keine Chronik aufgezeichnet. Bestreite Abenteuer, damit die KI hier Zusammenfassungen einträgt!
                  </p>
                )}
              </div>
            )}

            {activeLogbookTab === 'codex' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Subtabs for Codex & Cleanup Action */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-850 gap-1.5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setCodexSubTab('rules')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        codexSubTab === 'rules'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <i className="fa-solid fa-scale-balanced"></i>
                      <span>Weltregeln</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodexSubTab('timeline')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        codexSubTab === 'timeline'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <i className="fa-solid fa-timeline"></i>
                      <span>Zeitlinie der Geschichte</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => cleanupCodex()}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-[10px] uppercase font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Bereinigt nicht verknüpfte Geister-Einträge aus der Datenbank"
                  >
                    <i className="fa-solid fa-broom text-slate-500"></i>
                    <span>Codex bereinigen</span>
                  </button>
                </div>

                {codexSubTab === 'rules' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-gavel text-amber-500"></i> Aktive Weltregeln ({
                          (currentAdventure.loreDatabase || []).filter((e: any) => e.category === 'Weltregeln').length
                        })
                      </span>
                    </div>

                    {(() => {
                      const rules = (currentAdventure.loreDatabase || []).filter((e: any) => e.category === 'Weltregeln');
                      if (rules.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-850 p-4">
                            <p className="text-xs text-slate-500 italic">Keine Weltregeln im Codex eingetragen.</p>
                            <p className="text-[10px] text-slate-600 mt-1">Du kannst Weltregeln während der Abenteuererstellung im Codex-Schritt konfigurieren.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {rules.map((rule: any, idx: number) => (
                            <div key={rule.id || `rule-${idx}`} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 shadow-inner flex flex-col gap-2 hover:border-amber-500/20 transition-all animate-in slide-in-from-bottom-2 duration-150">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4 className="text-xs font-black text-amber-500 uppercase tracking-wide">{rule.title}</h4>
                                <div className="flex gap-1.5">
                                  {rule.details?.ruleType && (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase">
                                      {rule.details.ruleType}
                                    </span>
                                  )}
                                  {rule.details?.scope && (
                                    <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-black uppercase">
                                      {rule.details.scope}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed font-sans">{rule.description}</p>
                              {rule.details?.aiInstruction && (
                                <div className="mt-1 bg-slate-900/50 border border-slate-800/40 rounded-xl p-2.5">
                                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                                    <i className="fa-solid fa-brain text-[8px] mr-1"></i> KI-Durchsetzungsanweisung
                                  </span>
                                  <p className="text-[11px] text-slate-400 leading-normal italic font-sans">{rule.details.aiInstruction}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {codexSubTab === 'timeline' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-clock text-rose-400"></i> Historische Zeitlinie der Welt ({
                          (currentAdventure.loreDatabase || []).filter((e: any) => e.category === 'Zeitlinie' && e.isUnlocked).length
                        })
                      </span>
                    </div>

                    {(() => {
                      const timelineEntries = (currentAdventure.loreDatabase || [])
                        .filter((e: any) => e.category === 'Zeitlinie' && e.isUnlocked)
                        .sort((a: any, b: any) => (a.order !== undefined ? a.order : 9999) - (b.order !== undefined ? b.order : 9999));

                      if (timelineEntries.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-850 p-4">
                            <p className="text-xs text-slate-500 italic">Noch keine historischen Ereignisse in der Zeitlinie eingetragen oder freigeschaltet.</p>
                            <p className="text-[10px] text-slate-600 mt-1">Bestreite das Abenteuer, um geschichtliche Ereignisse freizuschalten, oder trage sie im Codex-Editor ein.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 py-2 ml-2">
                          {timelineEntries.map((entry: any, idx: number) => (
                            <div key={entry.id || `timeline-${idx}`} className="relative group">
                              {/* Dot pointer on line */}
                              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-rose-500 shadow-sm flex items-center justify-center transition-all group-hover:scale-110">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                              </div>
                              
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-xs font-black text-rose-400 font-mono tracking-tight bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                                    {entry.details?.timeOfEvent || 'Chronik-Punkt'}
                                  </span>
                                  {entry.details?.location && (
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                      <i className="fa-solid fa-map-pin text-[8px] text-indigo-400"></i>
                                      {entry.details.location}
                                    </span>
                                  )}
                                </div>
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 shadow-inner hover:border-rose-500/20 transition-all">
                                  <h4 className="text-sm font-bold text-slate-100 mb-1">{entry.title}</h4>
                                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{entry.description}</p>
                                  {entry.details?.involvedCharacters && (
                                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] text-slate-500 font-extrabold uppercase">Beteiligte:</span>
                                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-850 font-medium">
                                        {entry.details.involvedCharacters}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bestätigungsmodal für das Löschen von Abenteuern */}
      {adventureToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 mx-auto mb-2 text-xl">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-white font-fantasy">Abenteuer löschen?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Möchtest du dieses Abenteuer wirklich unwiderruflich löschen? Dein Charakterfortschritt und die gesamte Chronik gehen dabei verloren.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setAdventureToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 font-bold transition-all text-xs border border-slate-700/60"
              >
                Nein, behalten
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/20"
              >
                <i className="fa-solid fa-trash-can"></i> Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
