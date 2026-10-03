# AdventureForge – Reset: STORY & QUESTS nicht mehr verändern

## Ziel

Der Reset soll Runtime-Zustände zurücksetzen, aber **keine aktuell gespeicherten kanonischen Story-/Quest-Daten verändern**.

Aktuell gibt es noch eine Stelle in `services/adventureResetService.ts`, die beim Reset jedes `LoreEntry.details.eventSteps[].status` auf `'pending'` setzt.

Das ist falsch, weil `eventSteps` Teil der gespeicherten STORY-&-QUESTS-Definition sind. Ein Reset darf diese Daten nicht mutieren.

## Datei ändern

`services/adventureResetService.ts`

### Aktueller problematischer Code

```ts
const resetLoreDatabase: LoreEntry[] = deepClone(adventure.loreDatabase || []).map((e: LoreEntry) => {
  if (e.details?.eventSteps) {
    e.details.eventSteps = e.details.eventSteps.map((s: any) => ({
      ...s,
      status: 'pending'
    }));
  }
  return e;
});
```

### Gewünschte Änderung

Durch eine reine Kopie ersetzen:

```ts
const resetLoreDatabase: LoreEntry[] = deepClone(adventure.loreDatabase || []);
```

Keine weitere Änderung an den gespeicherten `LoreEntry`-/`eventSteps`-Daten durchführen.

## Warum

Nach dem Reset müssen insbesondere erhalten bleiben:

- Story-&-Quests-Einträge
- vom Benutzer angelegte Quests
- Änderungen an bestehenden Quests
- Quest-/Story-Beschreibungen
- `eventSteps`
- der gespeicherte Status jedes `eventSteps`
- sonstige Details innerhalb von `LoreEntry.details`

Der Reset darf nur echte Runtime-Daten zurücksetzen.

Wenn später ein Runtime-Fortschritt für Quest-Schritte benötigt wird, muss dieser in einem getrennten Runtime-State gespeichert werden und darf nicht den kanonischen `EventStep.status` überschreiben.

## Test ergänzen

In `tests/adventureResetService.test.ts` einen Regressionstest ergänzen.

Beispiel:

```ts
{
  const adv = deepClone(adventureWithSnapshots);

  const quest: LoreEntry = {
    id: 'quest-eventsteps',
    title: 'Der verlorene Schatz',
    category: 'Story & Quests',
    description: 'Eine Quest mit gespeicherten Story-Schritten.',
    isUnlocked: true,
    details: {
      eventSteps: [
        {
          id: 'step-1',
          title: 'Die Spur beginnt',
          description: 'Der Held findet einen Hinweis.',
          status: 'happened',
          branch: 'main',
          stepType: 'quest'
        },
        {
          id: 'step-2',
          title: 'Die Höhle',
          description: 'Die Höhle wird erreicht.',
          status: 'pending',
          branch: 'main',
          stepType: 'quest'
        }
      ]
    }
  };

  adv.loreDatabase = [quest];

  const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);

  const resetQuest = resetAdv.loreDatabase?.find(e => e.id === 'quest-eventsteps');

  assert(
    resetQuest?.details?.eventSteps?.find((s: any) => s.id === 'step-1')?.status === 'happened',
    'Regression: gespeicherter EventStep-Status happened bleibt nach Reset erhalten'
  );

  assert(
    resetQuest?.details?.eventSteps?.find((s: any) => s.id === 'step-2')?.status === 'pending',
    'Regression: gespeicherter EventStep-Status pending bleibt nach Reset erhalten'
  );
}
```

Falls der konkrete `LoreEntry.details`-Typ im aktuellen Projekt zusätzliche Pflichtfelder verlangt, den Test entsprechend an den vorhandenen Typ anpassen. Keine Typen unnötig verändern.

## Zusätzlich prüfen

Nach der Änderung muss weiterhin gelten:

1. Neue STORY-&-QUESTS-Einträge bleiben nach Reset erhalten.
2. Änderungen an bestehenden STORY-&-QUESTS-Einträgen bleiben erhalten.
3. `eventSteps` bleiben vollständig erhalten.
4. Die Statuswerte der `eventSteps` bleiben unverändert.
5. Chat bleibt vollständig erhalten.
6. NPCs, Welt, Spieler-Editorwerte, Items und Ausrüstung bleiben entsprechend der bestehenden Reset-Regeln erhalten.
7. Runtime-Zustände werden weiterhin zurückgesetzt.
8. Initial-Snapshots werden nicht als aktuelle Editor-Daten verwendet.

## Wichtig

Nur diese letzte Abgrenzung korrigieren. Die bereits funktionierende Trennung zwischen **kanonischen Editor-Daten** und **Runtime-Daten** nicht wieder aufbrechen.