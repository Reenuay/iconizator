"use strict";

import { Chrome } from "vue-color";
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";
import storage from "electron-json-storage";
import { ipcRenderer } from "electron";

const { dialog } = require("electron").remote;

export default {
    components: {
        "chrome-picker": Chrome,
        swatches: Swatches
    },
    data() {
        return {
            startKeywordingAfterProcessing: false,
            iconizatorIconsFolder: undefined,
            keyworderIconsFolder: undefined,
            cleanserIconsFolder: undefined,
            iconizatorIsProcessing: false,
            keyworderIsProcessing: false,
            cleanserIsProcessing: false,
            processedFolder: undefined,
            iconizatorIconsFolders: [],
            color: { hex: "#000000" },
            iconizatorMaxProgress: 0,
            selectedColor: undefined,
            keyworderMaxProgress: 0,
            cleanserMaxProgress: 0,
            illustrator: undefined,
            keywordingStop: false,
            processingStop: false,
            iconizatorProgress: 0,
            background: undefined,
            cleansingStop: false,
            keyworderProgress: 0,
            splitterRegex: /;|,/,
            cleanserProgress: 0,
            newTitle: undefined,
            spacesRegex: /\s+/,
            addRequireds: true,
            cleanseTitle: true,
            popoverShow: false,
            documentSize: 1000,
            saveFlipped: false,
            wordsToCleanse: "",
            svgTextOffset: 5,
            titleOnly: false,
            title: undefined,
            svgTextSize: 20,
            svgText: "TEXT",
            svgTextBBox: {},
            onlyJPEG: false,
            backgrounds: [],
            useText: false,
            requireds: "",
            iconSize: 800,
            blacklist: "",
            svgSize: 300,
            swatches: [],
            titles: []
        };
    },
    computed: {
        iconizatorIsReady() {
            return (
                this.iconSizeIsCorrect &&
                this.background !== undefined &&
                this.illustrator !== undefined &&
                this.processedFolder !== undefined &&
                this.iconizatorIconsFolder !== undefined
            );
        },
        iconSizeIsCorrect() {
            return this.iconSize > 0 && this.iconSize <= this.documentSize;
        },
        keyworderIsReady() {
            return this.keyworderIconsFolder !== undefined && this.title !== "";
        },
        cleanserIsReady() {
            return (
                this.cleanserIconsFolder !== undefined &&
                this.wordsToCleanse != ""
            );
        },
        iconSizeOnCanvas() {
            return (this.svgSize * this.iconSize) / this.documentSize;
        },
        iconOffsetOnCanvas() {
            return (this.svgSize * (1 - this.iconSize / this.documentSize)) / 2;
        },
        svgTextXOffset() {
            return this.svgSize / 2;
        },
        svgTextYOffset() {
            return (
                this.iconSizeOnCanvas +
                this.iconOffsetOnCanvas +
                this.svgTextOffset +
                Number.parseFloat(this.svgTextSize)
            );
        },
        svgTextSizeIsCorrect() {
            return this.svgTextSize > 0;
        },
        svgPreviewTransform() {
            return (
                "translate(" +
                (this.iconOffsetOnCanvas +
                    (this.saveFlipped ? this.iconSizeOnCanvas : 0)) +
                ", " +
                this.iconOffsetOnCanvas +
                ") " +
                "scale(" +
                (this.saveFlipped ? -1 : 1) +
                ",1)"
            );
        }
    },
    methods: {
        splitKeywords(keywords) {
            return keywords
                .split(this.splitterRegex)
                .map(v => v.trim().replace(this.spacesRegex, " "))
                .filter(v => v !== "");
        },
        cleanseKeywords(keywords) {
            return keywords
                .split(this.splitterRegex)
                .map(v => v.trim().replace(this.spacesRegex, " "))
                .filter((v, i, a) => v !== "" && a.indexOf(v) === i) //not empty and unique
                .join(";");
        },
        switchSwatch(value) {
            if (value === this.selectedColor) {
                this.selectedColor = undefined;
            } else {
                this.selectedColor = value;
            }
        },
        onOk() {
            this.popoverShow = false;
        },
        onAdd() {
            if (!this.swatches.includes(this.color.hex)) {
                this.swatches.push(this.color.hex);
                this.selectedColor = this.color.hex;
            }
        },
        switchProcessing(userInit = false) {
            if (!this.iconizatorIsProcessing) {
                this.iconizatorIsProcessing = true;

                ipcRenderer.send("startProcessing", {
                    iconsFolder: this.iconizatorIconsFolder,
                    processedFolder: this.processedFolder,
                    backgroundPath: this.background,
                    illustrator: this.illustrator,
                    saveFlipped: this.saveFlipped,
                    color: this.selectedColor,
                    iconSize: this.iconSize,
                    onlyJPEG: this.onlyJPEG
                });
            } else {
                this.iconizatorIsProcessing = false;
                this.iconizatorProgress = 0;
                this.iconizatorMaxProgress = 0;
                this.processingStop = false;
                ipcRenderer.send("stopProcessing", userInit);
            }
        },
        switchKeywording() {
            if (!this.keyworderIsProcessing) {
                this.keyworderIsProcessing = true;

                ipcRenderer.send("startKeywording", {
                    iconsFolder: this.keyworderIconsFolder,
                    blacklist: this.splitKeywords(this.blacklist),
                    titleOnly: this.titleOnly,
                    title: this.title,
                    requireds: this.addRequireds
                        ? this.splitKeywords(this.requireds)
                        : []
                });
            } else {
                this.keyworderIsProcessing = false;
                this.keyworderProgress = 0;
                this.keyworderMaxProgress = 0;
                this.keywordingStop = false;
                ipcRenderer.send("stopKeywording");
            }
        },
        switchCleansing() {
            if (!this.cleanserIsProcessing) {
                this.cleanserIsProcessing = true;

                ipcRenderer.send("startCleansing", {
                    iconsFolder: this.cleanserIconsFolder,
                    wordsToCleanse: this.splitKeywords(this.wordsToCleanse),
                    cleanseTitle: this.cleanseTitle
                });
            } else {
                this.cleanserIsProcessing = false;
                this.cleanserProgress = 0;
                this.cleanserMaxProgress = 0;
                this.cleansingStop = false;
                ipcRenderer.send("stopCleansing");
            }
        },
        openDialog(prop, mode, filters = []) {
            const value = dialog.showOpenDialog({
                properties: [mode === "file" ? "openFile" : "openDirectory"],
                filters: filters
            });

            if (value) {
                this[prop] = value[0];
                if (Array.isArray(this[prop + "s"]))
                    this[prop + "s"].push(value[0]);
            }
        },
        removeSwatch() {
            if (this.selectedColor !== undefined) {
                var index = this.swatches.indexOf(this.selectedColor);
                if (index > -1) {
                    this.swatches.splice(index, 1);
                    this.selectedColor = undefined;
                }
            }
        },
        blacklistChanged() {
            this.blacklist = this.cleanseKeywords(this.blacklist);
            storage.set("blacklist", this.blacklist);
        },
        requiredsChanged() {
            this.requireds = this.cleanseKeywords(this.requireds);
            storage.set("requireds", this.requireds);
        },
        wordsToCleanseChanged() {
            this.wordsToCleanse = this.cleanseKeywords(this.wordsToCleanse);
            storage.set("wordsToCleanse", this.wordsToCleanse);
        },
        removeFromList(list, item) {
            this[list].splice(this[list].indexOf(this[item]), 1);
            this[item] = undefined;
        },
        addTitle() {
            if (this.newTitle) {
                this.titles.push(this.newTitle);
                this.title = this.newTitle;
                this.newTitle = undefined;
            }
        },
        editTitle() {
            if (this.title) this.newTitle = this.title;
        },
        updateTitle() {
            if (!this.titles.includes(this.newTitle)) {
                this.titles[this.titles.indexOf(this.title)] = this.newTitle;
                this.title = this.newTitle;
                this.newTitle = undefined;
            }
        }
    },
    watch: {
        iconizatorIconsFolder(value) {
            storage.set("iconizatorIconsFolder", value);
        },

        iconizatorIconsFolders(value) {
            storage.set("iconizatorIconsFolders", value);
        },

        background(value) {
            storage.set("background", value);
        },

        backgrounds(value) {
            storage.set("backgrounds", value);
        },

        illustrator(value) {
            storage.set("illustrator", value);
        },

        iconSize(value) {
            storage.set("iconSize", value);
        },

        processedFolder(value) {
            storage.set("processedFolder", value);
        },

        swatches(value) {
            storage.set("swatches", value);
        },

        title(value) {
            storage.set("title", value);
        },

        titles(value) {
            storage.set("titles", value);
        }
    },
    created() {
        storage.get("iconizatorIconsFolder", (error, data) => {
            if (typeof data === "string") this.iconizatorIconsFolder = data;
        });

        storage.get("iconizatorIconsFolders", (error, data) => {
            if (Array.isArray(data)) this.iconizatorIconsFolders = data;
        });

        storage.get("background", (error, data) => {
            if (typeof data === "string") this.background = data;
        });

        storage.get("backgrounds", (error, data) => {
            if (Array.isArray(data)) this.backgrounds = data;
        });

        storage.get("illustrator", (error, data) => {
            if (typeof data === "string") this.illustrator = data;
        });

        storage.get("iconSize", (error, data) => {
            this.iconSize = typeof data === "string" ? data : "800";
        });

        storage.get("processedFolder", (error, data) => {
            if (typeof data === "string") this.processedFolder = data;
        });

        storage.get("swatches", (error, data) => {
            if (data instanceof Array) this.swatches = data;
        });

        storage.get("title", (error, data) => {
            if (typeof data === "string") this.title = data;
        });

        storage.get("titles", (error, data) => {
            if (Array.isArray(data)) this.titles = data;
        });

        storage.get("blacklist", (error, data) => {
            if (typeof data === "string") this.blacklist = data;
        });

        storage.get("requireds", (error, data) => {
            if (typeof data === "string") {
                this.requireds = data;
            } else {
                this.requireds = "vector;illustration;pictogramm";
            }
        });

        storage.get("wordsToCleanse", (error, data) => {
            if (typeof data === "string") this.wordsToCleanse = data;
        });

        ipcRenderer.on("saveFolderCreated", (event, path) => {
            this.keyworderIconsFolder = path;
        });

        ipcRenderer.on("iconizatorProgressChanged", (event, progress) => {
            const values = progress.split("-");

            this.iconizatorProgress = parseInt(values[0], 10);
            this.iconizatorMaxProgress = parseInt(values[1], 10);

            if (
                this.iconizatorIsProcessing &&
                !this.processingStop &&
                values[0] === values[1]
            ) {
                this.processingStop = true;
                setTimeout(() => {
                    this.switchProcessing();
                    if (
                        this.startKeywordingAfterProcessing &&
                        !this.keyworderIsProcessing &&
                        this.keyworderIsReady
                    ) {
                        this.switchKeywording();
                    }
                }, 2000);
            }
        });

        ipcRenderer.on("keyworderProgressChanged", (event, data) => {
            this.keyworderProgress = data.progress;
            this.keyworderMaxProgress = data.maxProgress;

            if (
                this.keyworderIsProcessing &&
                !this.keywordingStop &&
                data.progress === data.maxProgress
            ) {
                this.keywordingStop = true;
                setTimeout(() => {
                    this.switchKeywording();
                }, 2000);
            }
        });

        ipcRenderer.on("cleanserProgressChanged", (event, data) => {
            this.cleanserProgress = data.progress;
            this.cleanserMaxProgress = data.maxProgress;

            if (
                this.cleanserIsProcessing &&
                !this.cleansingStop &&
                data.progress === data.maxProgress
            ) {
                this.cleansingStop = true;
                setTimeout(() => {
                    this.switchCleansing();
                }, 2000);
            }
        });

        ipcRenderer.on("alert", (event, data) => {
            console.log(data);
        });
    }
};
