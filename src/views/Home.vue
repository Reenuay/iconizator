<template>
    <div>
        <b-navbar type="dark" variant="dark" sticky>
            <b-navbar-brand>Iconizator</b-navbar-brand>
        </b-navbar>
        <b-container class="my-3" fluid>
            <b-row align-v="center">
                <b-col md="8" offset-md="2">
                    <b-form-group label="Icons Folder Path:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-file placeholder="Choose a folder with icons..."
                            directory>
                        </b-form-file>
                    </b-form-group>
                    <b-form-group label="Background Path:"
                        label-cols="2"
                        breakpoint="md"
                        description="Preferred size 500x500 mm"
                        horizontal>
                        <b-form-file placeholder="Choose a vector file...">
                        </b-form-file>
                    </b-form-group>
                    <b-form-group label="Illustrator Path:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-file placeholder="Path to Illustrator.exe...">
                        </b-form-file>
                    </b-form-group>
                    <b-form-group label="Title:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-input placeholder="Title">
                        </b-form-input>
                    </b-form-group>
                    <b-form-group label="Icon size:"
                        label-cols="2"
                        breakpoint="md"
                        description="Maximum 500 mm"
                        horizontal>
                        <b-form-input placeholder="Icon size in mm"
                            type="number"
                            min="1"
                            max="500">
                        </b-form-input>
                    </b-form-group>
                    <b-form-group label="Icon color:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <div>
                            <swatches :colors="swatches"
                                max-height="80"
                                v-model="selectedColor"
                                shapes="circles"
                                inline>
                            </swatches>
                            <b-btn class="ml-3"
                                id="color-button"
                                :disabled="popoverShow">
                                Pick a color
                            </b-btn>
                        </div>
                    </b-form-group>
                    <b-popover target="color-button"
                               :show.sync="popoverShow">
                        <b-container fluid>
                            <b-row class="my-1">
                                <b-col>
                                    <chrome-picker v-model="color"
                                        class="mx-auto">
                                    </chrome-picker>
                                </b-col>
                            </b-row>
                            <b-row class="my-3">
                                <b-col md="2">
                                    <b-btn @click="onOk"
                                        size="sm"
                                        variant="danger">
                                        Ok
                                    </b-btn>
                                </b-col>
                                <b-col md="2">
                                    <b-btn @click="onAdd"
                                        size="sm"
                                        variant="primary">
                                        Add
                                    </b-btn>
                                </b-col>
                            </b-row>
                        </b-container>
                    </b-popover>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="mb-3 text-center">
                    <hr>
                    <h3>PROGRESS</h3>
                    <b-btn variant="danger">Stop</b-btn>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2">
                    <b-progress :value="45"
                        :max="100"
                        show-progress
                        animated>
                    </b-progress>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import { Chrome } from "vue-color";
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";

export default {
    components: {
        "chrome-picker": Chrome,
        swatches: Swatches
    },
    data() {
        return {
            color: { hex: "#000000" },
            selectedColor: "#000000",
            swatches: ["#FF0000", "#00FF00", "#0000FF", "#000000"],
            popoverShow: false
        };
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
        }
    }
};
</script>
