<div align="center">
<picture>
    <img src="resources/icons/icon.png" width="128px">
</picture>
</div>
<h1 align="center">
Cider Reborn
</h1>

> **Cider Reborn** è un fork non ufficiale del progetto legacy **Cider v1.x**, originariamente archiviato. 
> Lo scopo di questa versione è correggere i bug critici che impedivano il funzionamento del client a causa dei recenti aggiornamenti delle API di Apple Music (MusicKit v3), ripristinando la stabilità e la possibilità di effettuare il login.

---

## 🛠 Modifiche e Fix Applicati (Fork)

Questo fork introduce correzioni fondamentali a livello di logica e di stabilità dell'applicazione Electron originale, che era diventata inutilizzabile. Nello specifico:

1. **Risoluzione Crash del Login & Autenticazione (OOBE)**
   - Abbandonato il sistema `ipcRenderer` per la comunicazione dei cookie di autenticazione, in favore di un **polling diretto nel processo principale** (`browserwindow.ts`).
   - Questo garantisce che il token (`music.ampwebplay.media-user-token`) venga sempre catturato correttamente al momento del login senza rimanere incastrato in schermate di caricamento.
   - Corretta la transizione dalla schermata di benvenuto (OOBE) al player sostituendo i riferimenti errati a `app.appMode` con il corretto `$root.appMode`.

2. **Prevenzione Crash Fatali (Unhandled Promise Rejections)**
   - Apple Music ha modificato o rimosso alcune API interne (es. `MusicKit.PlaybackBitrate`). Il codice originale andava in crash tentando di leggerle all'avvio.
   - Tutte le chiamate critiche e interne di `MusicKit` in `vueapp.js` (come `overrideRestrictEnabled`, configurazioni API e bitrate) sono state messe in sicurezza tramite costrutti `try/catch`. 

3. **Fix Integrazione Discord & WebNowPlaying**
   - L'applicazione andava costantemente in crash (e si chiudeva del tutto) ~13 secondi dopo l'avvio quando il plugin di Discord tentava di leggere lo stato di riproduzione.
   - Risolto un bug critico in `wsapi_interop.js` dove veniva richiamata una funzione inesistente (`MusicKitInterop.getAttributes()` invece della corretta `wsapi.getAttributes()`).
   - Aggiunta una gestione globale degli errori (`.catch()`) a tutte le chiamate `executeJavaScript` inviate dal processo principale (`wsapi.ts` e `app.ts`) verso il renderer, impedendo definitivamente i crash dell'intero processo Electron.

4. **Stabilità Generale e Debug**
   - Esteso il timeout per il blocco app (hang timer) in `events.js` da 10 a 60 secondi per evitare la fastidiosa finestra di falso positivo "Cider is not responding" sui PC più lenti.
   - Inseriti strumenti di debug visivi (`app.notyf.success`) nel processo di inizializzazione per tracciare con facilità i caricamenti, inclusa l'apertura automatica del pannello DevTools durante la fase di login ad Apple Music per isolare eventuali errori lato server di Apple.

---

## 🚀 Come Eseguire il Codice

Questa applicazione richiede **Node.js** e il gestore di pacchetti **pnpm**.

### 1. Installazione delle Dipendenze
Non sono state introdotte nuove dipendenze esterne o librerie di terze parti rispetto all'originale, i fix sono stati effettuati a livello logico sul codice nativo. Tuttavia, è necessario installare i pacchetti originali:

```bash
# Apri il terminale nella cartella del progetto e installa i pacchetti
pnpm install
```

### 2. Avvio dell'Applicazione
Per avviare Cider in ambiente di sviluppo (assicurandoti che Node e pnpm siano visibili nel percorso di sistema):

```bash
# Da PowerShell (Windows):
$env:PATH = "C:\Program Files\nodejs;$env:LOCALAPPDATA\pnpm;$env:PATH"; pnpm start

# In alternativa, puoi lanciare direttamente Electron sul codice compilato:
$env:PATH = "C:\Program Files\nodejs;$env:LOCALAPPDATA\pnpm;$env:PATH"; pnpm exec electron ./build/index.js
```

### 3. Ripristino / Logout Forzato
Se incontri problemi di login o account rimasti incastrati nella cache, assicurati che i processi in background siano chiusi ed elimina i dati salvati eseguendo:
```powershell
taskkill /F /IM electron.exe /T
Remove-Item -Path "$env:APPDATA\sh.cider.classic.dev" -Recurse -Force
```
Questo obbligherà l'applicazione a presentare la schermata iniziale pulita al prossimo avvio.

---

*Cider-reborn was developed using [Electron.js](https://electronjs.org), [Vue.js 2](https://vuejs.org), and [Webpack](https://webpack.js.org).*
