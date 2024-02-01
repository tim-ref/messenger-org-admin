# Abteilung soll via Tim kontaktiert werden können

Dazu muss ein Eintrag im Fhir Verzeichnis erstellt werden.

Parameter:
- name: Name der Abteilung/Name des HCS
- mxId: MxID die kontaktierbar werden soll

Constraints:
- name und mxId müssen _nicht_ eindeutig sein

# Bestehende HCS auflisten

Der Org Admin möchte die bestehenden HCS auflisten.

keine Parameter

Antwort:
Liste von HS [Name, MxID]

# Kontaktdaten für eine Abteilung ändern

Für einen bestehenden HCS Eintrag soll die MxID verändert werden.

Parameter:
- id: ID des HCS
- mxID: neuer MxID Eintrag

Constraints:
- id: muss einen bestehenden HCS referenzieren

# HCS löschen

Der Org Admin möchte einen bestehenden HCS entfernen.

Parameter:
- id: ID des HCS

Constraints:
- id: muss einen bestehenden HCS referenzieren

# Namen eines HCS ändern

Für einen bestehenden HCS Eintrag soll der Name verändert werden.

Parameter:
- id: ID des HCS
- name: neuer HCS Name

Constraints:
- id: muss einen bestehenden HCS referenzieren
