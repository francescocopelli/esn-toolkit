# Installazione di ESN Toolkit

## Download

Scarica l'ultima versione dalla pagina delle release:

👉 **[Scarica ESN Toolkit v2.0.0](https://github.com/francescocopelli/esn-toolkit/releases/latest)**

Clicca su `esn-toolkit-v2.0.0.zip` sotto la sezione **Assets**.

---

## Procedura di installazione

### 1. Estrai lo ZIP

Estrai il file scaricato in una cartella permanente sul tuo computer.

> ⚠️ Non eliminare la cartella dopo l'installazione: Chrome la legge ogni volta che apri il browser.

### 2. Apri la pagina delle estensioni

Nella barra indirizzi di Chrome digita:

```
chrome://extensions
```

### 3. Attiva la Modalità sviluppatore

In alto a destra trovi il toggle **Modalità sviluppatore**. Attivalo.

### 4. Carica l'estensione

Clicca **Carica estensione non pacchettizzata** e seleziona la cartella estratta dallo ZIP.

La cartella deve contenere direttamente `manifest.json` nella radice.

### 5. Verifica l'installazione

Nella barra degli strumenti di Chrome dovresti vedere l'icona di ESN Toolkit.

---

## Prima configurazione

1. Apri **esncard.org** nel browser e accedi con il tuo account.
2. Clicca sull'icona di ESN Toolkit nella barra degli strumenti.
3. Clicca su **Opzioni** per configurare le sezioni da verificare.
4. Inserisci i codici delle sezioni (es. `IT-PISA-ESN`), uno per riga.
5. Salva le impostazioni.

---

## Aggiornamento

Per aggiornare a una nuova versione:

1. Scarica il nuovo ZIP dalla [pagina delle release](https://github.com/francescocopelli/esn-toolkit/releases/latest).
2. Estrai il contenuto **sovrascrivendo** la cartella esistente.
3. Apri `chrome://extensions`.
4. Trova ESN Toolkit e clicca **Aggiorna** (⟳) oppure disabilita e riabilita l'estensione.

---

## Risoluzione problemi

### L'estensione non risponde

Assicurati di avere una scheda di esncard.org aperta e di essere autenticato.

### Errore "Nessuna tab attiva su esncard.org"

Apri esncard.org in una scheda e riprova.

### Le partnership mostrano 0 risultati

- Verifica che la Data PN sia corretta.
- Controlla che le sezioni in Opzioni abbiano il formato corretto (`IT-XXXX-XXX`).
- Verifica di essere autenticato su esncard.org.

### La cartella è stata spostata o eliminata

Ripeti la procedura di installazione dal punto 4 con la nuova posizione della cartella.

---

## Note

- La Modalità sviluppatore deve rimanere attiva.
- Al primo avvio dopo l'installazione Chrome potrebbe mostrare un avviso: clicca **Mantieni** o **Conserva estensione**.
- ESN Toolkit è uno strumento indipendente e non è un prodotto ufficiale di ESN International.
