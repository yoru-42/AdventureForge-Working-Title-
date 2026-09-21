// -*- coding: utf-8 -*-

import React from 'react';
import { Character, NPC, LoreEntry, Adventure } from '../types';

export interface CharacterPortraitProps {
  character?: Character | NPC | LoreEntry | any;
  characterId?: string;
  characterName?: string;
  adventure?: Adventure;
  imageUrl?: string;
  expressionKey?: string;
  expressions?: Record<string, string>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isPlayer?: boolean;
  isHostile?: boolean;
  isGroup?: boolean;
  groupCount?: number;
  className?: string;
  showHoverExpression?: boolean;
  title?: string;
  onClick?: () => void;
}

export interface ResolvedCharacterInfo {
  imageUrl?: string;
  displayName: string;
  initials: string;
  isPlayer: boolean;
  isHostile: boolean;
  isGroup: boolean;
  groupCount?: number;
  characterObj?: any;
  expressionKey?: string;
}

/**
 * Resolves character portrait and identity data using the existing character data structures.
 * Single source of truth: Player -> NPCs -> Lore entries -> Combat Opponents.
 */
export function resolveCharacterPortraitData(params: {
  character?: any;
  characterId?: string;
  characterName?: string;
  adventure?: Adventure;
  imageUrl?: string;
  expressionKey?: string;
  expressions?: Record<string, string>;
  isPlayer?: boolean;
  isHostile?: boolean;
  isGroup?: boolean;
  groupCount?: number;
}): ResolvedCharacterInfo {
  const {
    character,
    characterId,
    characterName,
    adventure,
    imageUrl: directImageUrl,
    expressionKey,
    expressions: directExpressions,
    isPlayer: directIsPlayer,
    isHostile: directIsHostile,
    isGroup: directIsGroup,
    groupCount
  } = params;

  let foundChar = character;
  let isPlayer = directIsPlayer ?? false;
  let isHostile = directIsHostile ?? false;
  let isGroup = directIsGroup ?? false;
  let resolvedImageUrl = directImageUrl;
  let expressionsMap = directExpressions;

  const lookupId = (characterId || foundChar?.id || '').trim();
  const lookupName = (characterName || foundChar?.name || foundChar?.title || '').trim();
  const normName = lookupName.toLowerCase();

  // 1. Check Player match if adventure is provided
  if (adventure?.player) {
    const p = adventure.player;
    const pName = (p.name || '').trim().toLowerCase();
    const pNick = (p.nickname || '').trim().toLowerCase();

    if (
      lookupId === 'player' ||
      (lookupId && p.id && lookupId === p.id) ||
      normName === 'spieler' ||
      (normName && (normName === pName || normName === pNick))
    ) {
      isPlayer = true;
      foundChar = foundChar || p;
      if (!expressionsMap && p.expressions) {
        expressionsMap = p.expressions;
      }
      if (!resolvedImageUrl) {
        resolvedImageUrl = p.image || (p as any).portrait || (p as any).avatar || (p.appearance as any)?.image || (p as any).details?.image;
      }
    }
  }

  // 2. Lookup in Adventure NPCs if not yet found
  if (!foundChar && adventure?.npcs && (lookupId || normName)) {
    const npc = adventure.npcs.find(n =>
      (lookupId && n.id === lookupId) ||
      (normName && (
        (n.name && n.name.toLowerCase().trim() === normName) ||
        (n.nickname && n.nickname.toLowerCase().trim() === normName) ||
        (n.rufName && n.rufName.toLowerCase().trim() === normName)
      ))
    );
    if (npc) {
      foundChar = npc;
    }
  }

  // 3. Lookup in Adventure LoreDatabase (Charaktere / Gegner) if not yet found
  if (!foundChar && adventure?.loreDatabase && (lookupId || normName)) {
    const lore = adventure.loreDatabase.find(l =>
      (l.category === 'Charaktere' || (l.category as string) === 'Gegner') && (
        (lookupId && l.id === lookupId) ||
        (normName && (
          (l.title && l.title.toLowerCase().trim() === normName) ||
          (l.details?.nickname && l.details.nickname.toLowerCase().trim() === normName) ||
          (l.details?.rufName && l.details.rufName.toLowerCase().trim() === normName)
        ))
      )
    );
    if (lore) {
      foundChar = lore;
    }
  }

  // 4. Lookup in Adventure combat opponents if still not found
  if (!foundChar && adventure?.combatState?.opponents && (lookupId || normName)) {
    const opp = adventure.combatState.opponents.find(o =>
      (lookupId && o.id === lookupId) ||
      (normName && o.name && o.name.toLowerCase().trim() === normName)
    );
    if (opp) {
      foundChar = opp;
      if (opp.count !== undefined && opp.count > 1) {
        isGroup = true;
      }
    }
  }

  // 5. Extract fields from foundChar
  if (foundChar) {
    if (foundChar.id === 'player' || foundChar === adventure?.player) {
      isPlayer = true;
    }
    if (foundChar.isHostile || foundChar.category === 'Gegner') {
      isHostile = true;
    }
    if (foundChar.type === 'group' || (foundChar.count !== undefined && foundChar.count > 1)) {
      isGroup = true;
    }

    if (!expressionsMap) {
      expressionsMap = foundChar.expressions || foundChar.details?.expressions;
    }

    if (!resolvedImageUrl) {
      resolvedImageUrl =
        foundChar.image ||
        foundChar.portrait ||
        foundChar.avatar ||
        foundChar.appearance?.image ||
        foundChar.details?.image ||
        expressionsMap?.['neutral'];
    }
  }

  // Check specific expression if available
  if (expressionKey && expressionsMap && expressionsMap[expressionKey]) {
    resolvedImageUrl = expressionsMap[expressionKey];
  }

  const displayName =
    foundChar?.nickname ||
    foundChar?.rufName ||
    foundChar?.details?.nickname ||
    foundChar?.details?.rufName ||
    foundChar?.name ||
    foundChar?.title ||
    lookupName ||
    (isPlayer ? 'Spieler' : 'Charakter');

  const initials = (displayName.replace(/[^a-zA-ZäöüÄÖÜ0-9]/g, '').slice(0, 2) || 'CH').toUpperCase();

  return {
    imageUrl: resolvedImageUrl,
    displayName,
    initials,
    isPlayer,
    isHostile,
    isGroup,
    groupCount: groupCount ?? foundChar?.count,
    characterObj: foundChar,
    expressionKey
  };
}

/**
 * Standard reusable character portrait component.
 * Conforms to the single-source-of-truth character visual representation.
 */
export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  character,
  characterId,
  characterName,
  adventure,
  imageUrl,
  expressionKey,
  expressions,
  size = 'md',
  isPlayer,
  isHostile,
  isGroup,
  groupCount,
  className = '',
  showHoverExpression = true,
  title,
  onClick
}) => {
  const info = resolveCharacterPortraitData({
    character,
    characterId,
    characterName,
    adventure,
    imageUrl,
    expressionKey,
    expressions,
    isPlayer,
    isHostile,
    isGroup,
    groupCount
  });

  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px] rounded-lg border',
    sm: 'w-8 h-8 text-[10px] rounded-xl border',
    md: 'w-11 h-11 md:w-12 md:h-12 text-xs rounded-2xl border-2',
    lg: 'w-14 h-14 md:w-16 md:h-16 text-sm rounded-2xl border-2',
    xl: 'w-20 h-20 text-base rounded-2xl border-2'
  }[size];

  const colorClasses = info.isPlayer
    ? 'border-amber-500/60 bg-amber-950/30 text-amber-300 shadow-amber-950/20'
    : info.isHostile
    ? 'border-red-500/60 bg-red-950/30 text-red-300 shadow-red-950/20'
    : info.isGroup
    ? 'border-slate-700 bg-slate-900 text-slate-300'
    : 'border-sky-500/40 bg-slate-900 text-sky-300 shadow-sky-950/10';

  const tooltipTitle = title || info.displayName;

  return (
    <div
      onClick={onClick}
      title={tooltipTitle}
      className={`relative shrink-0 overflow-hidden shadow select-none flex items-center justify-center font-bold uppercase transition-all ${sizeClasses} ${colorClasses} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className} group`}
    >
      {info.imageUrl ? (
        <>
          <img
            src={info.imageUrl}
            alt={info.displayName}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
          {showHoverExpression && info.expressionKey && info.expressionKey !== 'neutral' && (
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[7.5px] text-center text-slate-300 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-extrabold tracking-widest pointer-events-none">
              {info.expressionKey}
            </div>
          )}
        </>
      ) : info.isGroup ? (
        <div className="flex flex-col items-center justify-center leading-none">
          <i className="fa-solid fa-users text-xs"></i>
          {info.groupCount && info.groupCount > 1 && (
            <span className="text-[8px] font-extrabold mt-0.5">{info.groupCount}</span>
          )}
        </div>
      ) : (
        <span className="tracking-wider leading-none font-extrabold">
          {info.initials}
        </span>
      )}
    </div>
  );
};
