# ESN Toolkit

Estensione Chrome per la verifica delle partnership ESN e il controllo delle ESNcard.

Sviluppato da [Francesco Copelli](https://github.com/francescocopelli) per ESN Italia.

> ESN Toolkit è uno strumento indipendente e non è un prodotto ufficiale di ESN International.

---

## Funzionalità

- Conteggio partnership per singola sezione o per tutte le sezioni configurate
- Filtro partnership in base alla Data PN
- Esclusione delle partnership scadute prima dell'inizio della PN
- Badge visivo per partnership attive (`ATTIVA`) e scadute (`SCADUTA`)
- Supporto formato `valid until.value` restituito da esncard.org
- Verifica ESNcard con risposta strutturata
- Progress bar per verifiche multiple
- Ripresa del progresso dopo chiusura del popup
- Pausa configurabile tra le sezioni (30 secondi)
- Copia risultati negli appunti
- Pagina Opzioni completa
- Manifest V3

---

## Installazione

Vedi [INSTALL.md](INSTALL.md) per la procedura completa.

---

## Struttura del progetto

```
esn-toolkit/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── options.html
├── options.js
└── icons/
    ├── esn-16.png
    ├── esn-32.png
    ├── esn-48.png
    └── esn-128.png
```

---

## Requisiti

- Google Chrome (o browser basato su Chromium)
- Sessione autenticata attiva su [esncard.org](https://esncard.org)

L'estensione utilizza la sessione autenticata dell'utente su esncard.org per leggere le risposte degli endpoint ESN. Non memorizza né trasmette credenziali.

---

## Permessi

| Permesso | Utilizzo |
|---|---|
| `storage` | Salvataggio impostazioni e stato verifiche in locale |
| `tabs` | Individuazione tab attiva su esncard.org |
| `scripting` | Esecuzione richieste nel contesto della sessione autenticata |
| `clipboardWrite` | Copia risultati negli appunti su richiesta dell'utente |
| `https://esncard.org/*` | Accesso agli endpoint partnership e ESNcard |

---

## Versioni

| Versione | Note |
|---|---|
| 2.0.0 | Prima release pubblica. Manifest V3, filtro scadenze, badge visivi, copia risultati. |

---

## Licenza

Distribuito per uso interno ESN. Non redistribuire senza autorizzazione.
