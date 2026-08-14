# Changelog

## v2.0.2 — 2026-08-14

### Fix

- Verifica ESNcard: la risposta API è ora gestita correttamente come array
- Verifica ESNcard: lettura dei campi reali dell'API (`code`, `expiration-date`, `section-code`, `activation date`, `tid`)
- Verifica ESNcard: le date vengono formattate in italiano
- Verifica ESNcard: il campo Stato mostra un badge colorato (`ATTIVA` / `INATTIVA` / `DISPONIBILE`)

### Stile

- Palette colori allineata al Visual Identity Manual ESN
  - ESN Dark Blue `#2e3192` per header, bottoni, tab, accenti
  - ESN Cyan `#00aeef` per progress bar e focus ring
  - ESN Green `#7ac143` per badge OK / ATTIVA
  - ESN Orange `#f47b20` per badge PARZIALE / DISPONIBILE
  - ESN Magenta `#ec008c` per badge errori / ZERO / INATTIVA
- Bottone "Verifica sezione" in ESN Magenta
- Colori definiti come CSS custom properties in `:root`
- Aggiunta icona estensione

### Modifiche

- Riferimenti aggiornati da ESN Pisa a ESN Italia
- Delay tra sezioni ridotto a 0.5s (modalità test)
- Placeholder ESNcard aggiornato al formato reale (11 caratteri)
- Label input sezione più chiara
- Codice sezione nella lista risultati linkato all'endpoint esncard.org

---

## v2.0.0 — 2026-08-14

### Novità

- Filtro partnership in base alla Data PN
- Supporto formato `valid until.value` da esncard.org
- Badge visivo `ATTIVA` / `SCADUTA` per ogni partnership
- Esclusione automatica delle partnership scadute prima della PN
- Progress bar per verifiche multiple con ripresa dopo chiusura popup
- Pausa 30 secondi tra le sezioni
- Copia risultati negli appunti
- Verifica ESNcard con risposta strutturata
- Manifest V3
- Pagina Opzioni completa
