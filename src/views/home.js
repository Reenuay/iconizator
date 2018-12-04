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
            iconizatorIconsFolder: undefined,
            keyworderIconsFolder: undefined,
            iconizatorIsProcessing: false,
            keyworderIsProcessing: false,
            processedFolder: undefined,
            color: { hex: "#000000" },
            selectedColor: undefined,
            iconizatorMaxProgress: 0,
            keyworderMaxProgress: 0,
            illustrator: undefined,
            keywordingStop: false,
            iconizatorProgress: 0,
            processingStop: false,
            background: undefined,
            keyworderProgress: 0,
            popoverShow: false,
            iconSize: 800,
            swatches: [],
            title: ""
        };
    },
    computed: {
        iconizatorIsReady() {
            return (
                this.iconSizeIsCorrect &&
                this.background !== undefined &&
                this.illustrator !== undefined &&
                this.processedFolder !== undefined &&
                this.selectedColor !== undefined &&
                this.iconizatorIconsFolder !== undefined
            );
        },
        iconSizeIsCorrect() {
            return this.iconSize > 0 && this.iconSize <= 1000;
        },
        keyworderIsReady() {
            return this.keyworderIconsFolder !== undefined && this.title !== "";
        }
    },
    methods: {
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
                    backgroundPath: this.background,
                    iconsFolder: this.iconizatorIconsFolder,
                    processedFolder: this.processedFolder,
                    illustrator: this.illustrator,
                    iconSize: this.iconSize,
                    color: this.selectedColor
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
                    title: this.title
                });
            } else {
                this.keyworderIsProcessing = false;
                this.keyworderProgress = 0;
                this.keyworderMaxProgress = 0;
                this.keywordingStop = false;
                ipcRenderer.send("stopKeywording");
            }
        },
        openDialog(prop, mode, filters = []) {
            const value = dialog.showOpenDialog({
                properties: [mode === "file" ? "openFile" : "openDirectory"],
                filters: filters
            });

            if (value) this[prop] = value[0];
        },
        removeSwatch() {
            if (this.selectedColor !== undefined) {
                var index = this.swatches.indexOf(this.selectedColor);
                if (index > -1) {
                    this.swatches.splice(index);
                    this.selectedColor = undefined;
                }
            }
        }
    },
    watch: {
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
        }
    },
    created() {
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

        ipcRenderer.on("alert", (event, data) => {
            alert(data);
        });
    }
};
