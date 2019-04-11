"use strict";

import fs from "fs";
import path from "path";
import Mustache from "mustache";
import chokidar from "chokidar";
import axios from "axios";
import cheerio from "cheerio";
import exiftool from "node-exiftool";
import querystring from "querystring";
import moment from "moment";
import { execFile as child } from "child_process";
import { app, protocol, BrowserWindow, ipcMain } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";
import SystemFonts from "system-font-families";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// File system watcher.
let watcher;

// Mediator file
const mediatorFile = path.resolve(path.join(".", "mediator.txt"));

// Mediator variables
let stopKeywording = false;

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
    if (!fs.existsSync(data.processedFolder))
        fs.mkdirSync(data.processedFolder);

    const saveFolder = path.resolve(
        path.join(data.processedFolder, moment().format("DD-MM-YYYY HH-mm-ss"))
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
        path.resolve(path.join(__static, "script.template.js")), // eslint-disable-line no-undef
        "utf8"
    );

    const content = Mustache.render(template, {
        backgroundPath: data.backgroundPath.replace(/\\/g, "\\\\"),
        iconsFolder: data.iconsFolder.replace(/\\/g, "\\\\"),
        iconSize: data.iconSize,
        color: data.color,
        saveFlipped: data.saveFlipped,
        onlyJPEG: data.onlyJPEG,
        textData: JSON.stringify(data.textData),

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

ipcMain.on("startKeywording", async (e, data) => {
    stopKeywording = false;

    const index = /^[0-9]+-(?=[a-zA-Z0-9])/g;
    const extension = /\..+$/g;
    const copyNumber = /(_|\()\d+(_|\))$/g;
    const postIndex = /(-\d+)$/gi;
    const nonLatinOrNumber = /[^a-zA-Z0-9]+/gi;
    const multipleSpaces = /\s+/gi;
    const url = "https://microstockgroup.com/tools/keyword.php";

    let keywords = {};
    let progress = 0;
    let maxProgress = 0;

    for (let file of fs.readdirSync(data.iconsFolder)) {
        if (!file.match(/\.jpe?g$/i)) continue;

        const cleaned = file
            .replace(index, "")
            .replace(extension, "")
            .replace(copyNumber, "")
            .replace(postIndex, "")
            .replace(nonLatinOrNumber, " ")
            .replace(multipleSpaces, " ")
            .trim();

        // Cleaned is empty
        if (cleaned.match(/^\s*$/gi)) continue;

        if (keywords.hasOwnProperty(cleaned)) {
            keywords[cleaned].push(file);
        } else {
            keywords[cleaned] = [file];
        }

        maxProgress++;
    }

    win.send("keyworderProgressChanged", {
        progress: progress,
        maxProgress: maxProgress
    });

    const ep = new exiftool.ExiftoolProcess(getExiftool());

    if (await ep.open()) {
        for (const keyword in keywords) {
            if (stopKeywording) break;

            let keywordArray = [];

            if (!data.titleOnly) {
                // Get pictures
                let res;
                try {
                    res = await axios.post(
                        url,
                        querystring.stringify({
                            search_term: keyword,
                            image_type: "photo",
                            language: "en",
                            num_results: 10,
                            only_models: "on"
                        }),
                        {
                            headers: {
                                "content-type":
                                    "application/x-www-form-urlencoded"
                            }
                        }
                    );
                } catch (error) {
                    win.send("alert", error);
                }

                if (stopKeywording) break;

                // Parse them
                let $ = cheerio.load(res.data);
                const imgIds = [];

                $(".singleCell img").each((i, img) => {
                    imgIds.push($(img).attr("id"));
                });

                try {
                    // Get keywords
                    res = await axios.post(
                        url,
                        querystring.stringify({
                            "imageid[]": imgIds
                        }),
                        {
                            headers: {
                                "content-type":
                                    "application/x-www-form-urlencoded"
                            }
                        }
                    );
                } catch (error) {
                    win.send("alert", error);
                }

                // Parse them
                $ = cheerio.load(res.data);

                $(".keywordDisplay").each((i, el) => {
                    keywordArray.push($(el).attr("id"));
                });

                // Create meta
                keywordArray = data.requireds.concat(
                    keywordArray
                        .filter(
                            (v, i, a) =>
                                a.indexOf(v) === i && //unqiue
                                !data.blacklist.includes(v) && //not in black list
                                !data.requireds.includes(v) //not in requireds
                        )
                        .slice(0, 50 - data.requireds.length)
                );
            }

            if (stopKeywording) break;

            const title = Mustache.render(data.title, {
                i: keyword,
                ic: keyword[0].toUpperCase() + keyword.slice(1)
            });

            // Write it
            for (const index in keywords[keyword]) {
                if (stopKeywording) break;

                const filePath = path.join(
                    data.iconsFolder,
                    keywords[keyword][index]
                );

                let metaObject = {
                    Title: title,
                    Description: title
                };

                if (!data.titleOnly) metaObject.Keywords = keywordArray;

                ep.writeMetadata(filePath, metaObject, ["overwrite_original"]);

                win.send("keyworderProgressChanged", {
                    progress: ++progress,
                    maxProgress: maxProgress
                });
            }
        }
    } else {
        win.send("alert", "Can't open exiftool");
    }

    ep.close();
});

ipcMain.on("stopKeywording", () => {
    stopKeywording = true;
});

ipcMain.on("fonts", () => {
    new SystemFonts().getFontsExtended().then(
        res => {
            win.send("fonts", res);
        },
        err => {
            win.send("alert", err);
        }
    );
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

function getExiftool() {
    return path.join(__dirname, "..", "binaries", "exiftool.exe");
}
