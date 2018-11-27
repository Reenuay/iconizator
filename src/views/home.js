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
            color: { hex: "#000000" },
            selectedColor: undefined,
            iconizatorMaxProgress: 0,
            keyworderMaxProgress: 0,
            illustrator: undefined,
            background: undefined,
            iconizatorProgress: 0,
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
                this.selectedColor !== undefined &&
                this.iconizatorIconsFolder !== undefined
            );
        },
        iconSizeIsCorrect() {
            return this.iconSize > 0 && this.iconSize <= 1000;
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
        startProcessing() {
            if (!this.iconizatorIsProcessing) {
                this.iconizatorIsProcessing = true;

                ipcRenderer.send("startProcessing", {
                    backgroundPath: this.background,
                    iconsFolder: this.iconizatorIconsFolder,
                    illustrator: this.illustrator,
                    iconSize: this.iconSize,
                    color: this.selectedColor
                });
            } else {
                this.iconizatorIsProcessing = false;
                ipcRenderer.send("stopProcessing");
            }
        },
        openDialog(prop, mode, filters = []) {
            const value = dialog.showOpenDialog({
                properties: [mode === "file" ? "openFile" : "openDirectory"],
                filters: filters
            });

            if (value) this[prop] = value[0];
        }
    },
    watch: {
        illustrator(value) {
            storage.set("illustrator", value);
        },

        iconSize(value) {
            storage.set("iconSize", value);
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

        storage.get("swatches", (error, data) => {
            if (typeof data === "object") this.swatches = data;
        });

        storage.get("title", (error, data) => {
            if (typeof data === "string") this.title = data;
        });

        ipcRenderer.on("saveFolderCreated", (event, path) => {
            this.keyworderIconsFolder = path;
        });
    }
};
