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

<img width="682" height="1049" alt="Screenshot 2026-07-05 203457" src="https://github.com/user-attachments/assets/f02ec4e2-c4f0-4a7b-b524-b7863c6176e2" />
<img width="687" height="1117" alt="Screenshot 2026-07-05 203437" src="https://github.com/user-attachments/assets/7fde78be-3b90-4140-931c-46852d58bb91" />
<img width="616" height="1112" alt="Screenshot 2026-07-05 203401" src="https://github.com/user-attachments/assets/c88885b4-e79e-487a-8ba2-6fcba7015938" />
<img width="723" height="1135" alt="Screenshot 2026-07-05 203335" src="https://github.com/user-attachments/assets/81ab19d0-6418-45e6-8d46-964e7cb5c749" />
<img width="676" height="1123" alt="Screenshot 2026-07-05 203301" src="https://github.com/user-attachments/assets/c2987a68-482b-4432-83b8-fc2528c41026" />
<img width="721" height="1100" alt="Screenshot 2026-07-05 203241" src="https://github.com/user-attachments/assets/c4afd509-43d0-4652-891b-f02ba959c3e5" />
<img width="713" height="1108" alt="Screenshot 2026-07-05 203205" src="https://github.com/user-attachments/assets/2942edd5-3782-4975-a7da-d792891e453e" />
<img width="731" height="1060" alt="Screenshot 2026-07-05 203134" src="https://github.com/user-attachments/assets/e9d839f9-e6f0-4536-aecf-02de0e65c73c" />
<img width="1996" height="1045" alt="Screenshot 2026-07-05 203838" src="https://github.com/user-attachments/assets/a57676b0-062c-4e0f-bde1-1a692a6e4fb3" />
<img width="666" height="1037" alt="Screenshot 2026-07-05 203514" src="https://github.com/user-attachments/assets/a2aec364-0b92-411f-b79a-197f90ef992e" />

