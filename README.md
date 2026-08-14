# ESN Toolkit

Chrome extension per la **verifica delle partnership ESN** e il **controllo delle ESNcard**.

Strumento indipendente sviluppato per ESN Pisa. Non è un prodotto ufficiale di ESN International.

---

## Funzionalità

- Verifica partnership per singola sezione o per tutte le sezioni
- Filtro partnership in base alla Data PN
- Esclusione e badge visivo per partnership scadute
- Progress bar con ripresa dopo chiusura del popup
- Pausa configurabile tra le sezioni (30 secondi)
- Verifica codice ESNcard
- Copia risultati negli appunti
- Pagina Opzioni per configurare le sezioni

---

## Installazione

### Da GitHub Releases (consigliato)

1. Vai alla pagina [Releases](https://github.com/francescocopelli/esn-toolkit/releases)
2. Scarica l'ultimo file `esn-toolkit-vX.X.X.zip`
3. Estrai il file ZIP in una cartella
4. Apri Chrome e vai su `chrome://extensions`
5. Attiva **Modalità sviluppatore** (in alto a destra)
6. Clicca **Carica estensione non pacchettizzata**
7. Seleziona la cartella estratta

### Da codice sorgente

```bash
git clone https://github.com/francescocopelli/esn-toolkit.git
```

Poi segui i passi 4-7 precedenti selezionando la cartella `esn-toolkit`.

---

## Utilizzo

1. Apri `esncard.org` nel browser ed effettua il login
2. Apri il popup dell'estensione
3. Inserisci la **Data PN** nel formato `gg/mm/aa, hh:mm`
4. Seleziona il **Tipo controllo**
5. Clicca **Verifica sezione** (singola) o **Verifica tutte** (tutte le sezioni configurate)

---

## Configurazione sezioni

Nella pagina **Opzioni** puoi configurare le sezioni da verificare.
L'elenco delle sezioni italiane è già precaricato di default.

---

## Sviluppato da

[Francesco Copelli](https://github.com/francescocopelli) — ESN Pisa

---

## Licenza

MIT
