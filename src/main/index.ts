// @ts-ignore
await import("v8-compile-cache");

import { app, components, ipcMain } from "electron";
import { join } from "path";
import { Store } from "./base/store.js";
import { AppEvents } from "./base/app.js";
import { Plugins } from "./base/plugins.js";
import { BrowserWindow } from "./base/browserwindow.js";
import { utils } from "./base/utils.js";

const appName = 'sh.cider.classic';

if (!app.isPackaged) {
  app.setPath('userData', join(app.getPath('appData'), `${appName}.dev`));
} else {
  app.setPath('userData', join(app.getPath('appData'), appName));
}

new Store();
const Cider = new AppEvents();
const CiderPlug = new Plugins();

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * App Event Handlers
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
app.on("ready", async () => {
  await utils.initializeTranslations();
  Cider.ready(CiderPlug);

  console.log("[Cider] Application is Ready. Creating Window.");
  if (!app.isPackaged) {
    console.info("[Cider] Running in development mode.");
    // @ts-ignore
    (await import("vue-devtools")).default.install();
  }
  const startWindow = async () => {
    const bw = new BrowserWindow();
    console.log("[Cider] Creating Window.");
    const win = await bw.createWindow();

    app.getGPUInfo("complete").then((gpuInfo) => {
      console.log(gpuInfo);
    });

    try {
      console.log("[Cider][Widevine] Status:", components.status());
    } catch (e) {
      console.warn("[Cider][Widevine] unavailable:", e);
    }
    Cider.bwCreated();
    win.on("ready-to-show", () => {
      console.debug("[Cider] Window is Ready.");
      CiderPlug.callPlugins("onReady", win);
      if (!app.commandLine.hasSwitch("hidden")) {
        win.show();
      }
    });
  };

  try {
    await components.whenReady();
  } catch (e) {
    console.warn("[Cider][Widevine] components.whenReady failed, continuing without DRM:", e);
  }
  await startWindow();
});

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Renderer Event Handlers
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
let rendererInitialized = false;
ipcMain.handle("renderer-ready", (event) => {
  if (rendererInitialized) return;
  CiderPlug.callPlugins("onRendererReady", event);
  rendererInitialized = true;
});

ipcMain.on("playbackStateDidChange", (_event, attributes) => {
  CiderPlug.callPlugins("onPlaybackStateDidChange", attributes);
});

ipcMain.on("nowPlayingItemDidChange", (_event, attributes) => {
  CiderPlug.callPlugins("onNowPlayingItemDidChange", attributes);
});

ipcMain.on("playbackTimeDidChange", (_event, attributes) => {
  CiderPlug.callPlugins("playbackTimeDidChange", attributes);
});

app.on("before-quit", () => {
  CiderPlug.callPlugins("onBeforeQuit");
  console.warn(`${app.getName()} exited.`);
});
