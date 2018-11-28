"use strict";

import fs from "fs";
import path from "path";
import Mustache from "mustache";
import chokidar from "chokidar";
import { execFile as child } from "child_process";
import { app, protocol, BrowserWindow, ipcMain } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// File system watcher.
let watcher;

// Mediator file
const mediatorFile = path.resolve(path.join(".", "mediator.txt"));

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(["app"], {
    secure: true
});

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600
    });

    win.setMenu(null);

    if (isDevelopment || process.env.IS_TEST) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        win.loadURL("app://./index.html");
    }

    win.on("closed", () => {
        win = null;
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        await installVueDevtools();
    }
    createWindow();
});

ipcMain.on("startProcessing", (e, data) => {
    // Clean mediator
    fs.writeFileSync(mediatorFile, "");

    // Save folder
    const now = new Date(Date.now());
    const processedFolder = path.join(".", "processed");

    if (!fs.existsSync(processedFolder)) fs.mkdirSync(processedFolder);

    const saveFolder = path.resolve(
        path.join(
            processedFolder,
            `${now.getDay()}_${now.getMonth()}_${now.getFullYear()} ${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`
        )
    );

    fs.mkdirSync(saveFolder);

    win.send("saveFolderCreated", saveFolder);

    // Progress file
    const progressFile = path.resolve(path.join(".", "progress.txt"));

    if (!fs.existsSync(progressFile)) fs.writeFile(progressFile, "");

    watcher = chokidar.watch("./progress.txt", {
        awaitWriteFinish: true
    });

    watcher.on("change", path => {
        const progress = fs.readFileSync(path, "utf8");
        if (progress !== "") win.send("iconizatorProgressChanged", progress);
    });

    // Create script
    const template = fs.readFileSync(
        path.join(".", "script.template.js"),
        "utf8"
    );

    const content = Mustache.render(template, {
        backgroundPath: data.backgroundPath.replace(/\\/g, "\\\\"),
        iconsFolder: data.iconsFolder.replace(/\\/g, "\\\\"),
        iconSize: data.iconSize,
        color: data.color,

        saveFolder: saveFolder.replace(/\\/g, "\\\\"),
        progressFile: progressFile.replace(/\\/g, "\\\\"),
        mediatorFile: mediatorFile.replace(/\\/g, "\\\\")
    });

    const scriptPath = path.resolve(path.join(".", "script.js"));

    fs.writeFileSync(scriptPath, content);

    // Start Illustrator
    child(data.illustrator, [scriptPath], function(err, data) {
        console.log(err);
        console.log(data.toString());
    });
});

ipcMain.on("stopProcessing", (e, userInit) => {
    if (userInit) fs.writeFileSync(mediatorFile, "stop");

    if (watcher) {
        watcher.close();
        watcher = undefined;
    }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", data => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}
