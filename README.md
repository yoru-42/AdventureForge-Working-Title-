# 🌌 Universal KI-RPG & Story-Engine (Sandbox Edition)

Eine hochmodulare, visuelle Sandbox-Engine für textbasierte Rollenspiele (RPGs) und interaktive Romane, angetrieben von **Google Gemini**. 

Dieses Framework löst die größten Probleme herkömmlicher KI-Chatbots (wie Gedächtnisverlust, mangelndes Balancing und willkürliche Kämpfe) und verwandelt reine Text-Chats in ein vollwertiges Videospiel-Erlebnis – **komplett ohne Programmieraufwand für den Welten-Ersteller (Creator).**

---

## 🚀 Kern-Features & Innovationen

### 1. ⚔️ Taktisches Kombinations-Kampfsystem
* **Geladene Kombinationen:** Spieler können Fähigkeiten, Verwandlungen und Haltungen zu einem mächtigen Kombinations-Manöver verketten und mit freiem Text ausführen.
* **Defensive Stellungen:** Ein dediziertes Menü für universelle Abwehraktionen (Blocken, Ausweichen, Parieren, Kontern), das der KI klare erzählerische Leitplanken für die Kampfrunde gibt.
* **Fester mathematischer Unterbau:** Jede Fähigkeit besitzt ein "Tier" (Stufe 1 bis 4). Der Schaden und die Kosten werden im Hintergrund anhand globaler Regel-Matrizen exakt berechnet, bevor die KI die Roman-Szene schreibt.

### 2. 📊 Dynamisches HUD & Ressourcen-Tracking
* Ein anpassbares Interface spiegelt den Live-Zustand der Welt wider.
* Verfolge dynamisch Attribute, Währungen, Orte, Zeiten, Ausdauer-Pools und spezifische Zustände (wie "Brandwunde am Arm") per **Structured JSON Output** direkt im Chat-Fenster.

### 3. 🔒 3-Stufen-Wissenslogik (Geheimnis-Management)
Verhindert das typische KI-Schummeln durch die Trennung von Meta-Wissen und NPC-Wissen:
* **Stufe 1 (Öffentlich):** Was die Welt weiß.
* **Stufe 2 (Indizien & Verdacht):** Wonach NPCs ermitteln dürfen.
* **Stufe 3 (Absolutes Geheimnis):** Eine Blackbox für NPCs (z. B. "Der männliche Hauptcharakter ist heimlich das gesuchte Magical Girl"). NPCs können das Geheimnis erst ansprechen, wenn der Spieler es lüftet oder ein Story-Trigger auslöst.

### 4. 🗂️ Globales Preset- & Progressions-System
* **4 Lern-Kacheln:** Steuere das Wachstum von Fähigkeiten und Radar-Parametern über EP (Kampf), Training & Übung, Meilensteine (Story) oder Statische Werte.
* **Modi-Kopplung:** Kombiniere die Progression mit einem klassischen RPG-Modus (Zahlenbasiert) oder einem Beherrschungs-Modus (Ränge von Ungeübt bis Meisterhaft).
* **Smart Fill (KI-Assistenz):** Der Ersteller wirft Freitext in den Editor (z. B. eine Charakter-Biografie oder eine Schwert-Beschreibung). Die Engine analysiert die Daten, skaliert sie passend zum Genre/Power-Level der Welt und befüllt riesige Formulare vollautomatisch als valides JSON.

---

## 🛠️ Architektur & Funktionsweise

Die Engine trennt **Erzählung** und **Mechanik** strikt voneinander:
1. **Das UI & Code-Backend** übernimmt das harte, mathematische Balancing (Formeln, Leisten-Abzüge, Würfelwürfe, Flag-Trigger).
2. **Google Gemini** agiert als der ultimative Game Master. Sie erhält die exakten mathematischen Ergebnisse im Hintergrund-Prompt und übersetzt sie live in immersive, packende Romantexte, die sich streng an den zeitlichen Kontext und das Lore-Setting halten.

View your app in AI Studio: https://ai.studio/apps/9751ace7-c725-4cb4-9a2b-550876b20f0a
<img width="1996" height="1045" alt="Screenshot 2026-07-05 203838" src="https://github.com/user-attachments/assets/75678d85-606e-4c4c-acb0-0d5f734ee0df" />
<img width="666" height="1037" alt="Screenshot 2026-07-05 203514" src="https://github.com/user-attachments/assets/ebd94508-5fae-41bf-a647-20d46e7ac903" />
<img width="682" height="1049" alt="Screenshot 2026-07-05 203457" src="https://github.com/user-attachments/assets/1e14793f-6d4d-4332-9fe4-432cafce42de" />
<img width="687" height="1117" alt="Screenshot 2026-07-05 203437" src="https://github.com/user-attachments/assets/3430f1fb-e12a-4f12-ada8-cb93eb7bb1cf" />
<img width="616" height="1112" alt="Screenshot 2026-07-05 203401" src="https://github.com/user-attachments/assets/ca0b37a1-5772-4629-95ca-07b6a1dd555e" />
<img width="723" height="1135" alt="Screenshot 2026-07-05 203335" src="https://github.com/user-attachments/assets/ada69b78-d084-4341-92e7-e9049aa85c49" />
<img width="676" height="1123" alt="Screenshot 2026-07-05 203301" src="https://github.com/user-attachments/assets/d635af1b-3456-4b89-b057-e11bef68ca64" />
<img width="721" height="1100" alt="Screenshot 2026-07-05 203241" src="https://github.com/user-attachments/assets/f402d155-c8d9-4b94-9857-dd3ffd1c046f" />
<img width="713" height="1108" alt="Screenshot 2026-07-05 203205" src="https://github.com/user-attachments/assets/09d572c5-4b64-4541-acca-9d4a90c0f75f" />
<img width="731" height="1060" alt="Screenshot 2026-07-05 203134" src="https://github.com/user-attachments/assets/c8929466-eac2-42ee-a3e8-004eaa38d85e" />
