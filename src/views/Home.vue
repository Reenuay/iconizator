<template>
    <div>
        <b-navbar type="dark" variant="dark" sticky>
            <b-navbar-brand>Iconizator</b-navbar-brand>
        </b-navbar>
        <b-container class="my-3" fluid>
            <b-row>
                <b-col md="8" offset-md="2" class="text-center">
                    <h4 class="mb-3">ICONIZATOR</h4>
                </b-col>
            </b-row>
            <b-row align-v="center">
                <b-col md="8" offset-md="2">
                    <b-form-group label="Icons Folder Path:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <div>
                            <span>
                                {{
                                    iconizatorIconsFolder
                                        ? iconizatorIconsFolder
                                        : 'Choose a folder with icons...'
                                }}
                            </span>
                            <b-btn @click="openDialog('iconizatorIconsFolder', 'folder')"
                                class="ml-3 float-right">
                                Browse
                            </b-btn>
                        </div>
                    </b-form-group>
                    <b-form-group label="Background Path:"
                        label-cols="2"
                        breakpoint="md"
                        description="Preferred ratio 1:1"
                        horizontal>
                        <div>
                            <span>
                                {{background ? background : 'Choose a vector file...'}}
                            </span>
                            <b-btn @click="openDialog('background', 'file', [{name: 'vector', extensions:['svg', 'ai', 'eps']}])"
                                class="ml-3 float-right">
                                Browse
                            </b-btn>
                        </div>
                    </b-form-group>
                    <b-form-group label="Save Folder Path:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <div>
                            <span>
                                {{
                                    processedFolder
                                        ? processedFolder
                                        : 'Save to...'
                                }}
                            </span>
                            <b-btn @click="openDialog('processedFolder', 'folder')"
                                class="ml-3 float-right">
                                Browse
                            </b-btn>
                        </div>
                    </b-form-group>
                    <b-form-group label="Illustrator Path:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <div>
                            <span>
                                {{illustrator ? illustrator : 'Path to Illustrator.exe...'}}
                            </span>
                            <b-btn @click="openDialog('illustrator', 'file', [{name: 'exe', extensions:['exe']}])"
                                class="ml-3 float-right">
                                Browse
                            </b-btn>
                        </div>
                    </b-form-group>
                    <b-form-group label="Icon size:"
                        label-cols="2"
                        breakpoint="md"
                        description="Maximum 1000"
                        horizontal>
                        <b-form-input placeholder="Icon size"
                            type="number"
                            min="1"
                            max="1000"
                            :state="iconSizeIsCorrect"
                            v-model="iconSize">
                        </b-form-input>
                    </b-form-group>
                    <b-form-group label="Icon color:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <div>
                            <swatches :colors="swatches"
                                @input="switchSwatch"
                                max-height="80"
                                shapes="circles"
                                :value="selectedColor"
                                inline>
                            </swatches>
                            <b-btn class="ml-3"
                                id="color-button"
                                :disabled="popoverShow">
                                Pick a color
                            </b-btn>
                            <b-btn class="ml-1"
                                variant="danger"
                                :disabled="!Boolean(selectedColor)"
                                @click="removeSwatch()">
                                Remove
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
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-form-checkbox v-model="startKeywordingAfterProcessing"
                     :value="true"
                     :unchecked-value="false">
                        Start keywording after processing
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-btn :disabled="!iconizatorIsReady"
                        :variant="iconizatorIsProcessing ? 'danger' : 'primary'"
                        @click="switchProcessing(true)"
                        class="float-right">
                        {{iconizatorIsProcessing ? 'Stop' : 'Start'}}
                    </b-btn>
                </b-col>
            </b-row>
            <b-row v-if="iconizatorIsProcessing">
                <b-col md="8" offset-md="2">
                    <b-progress :max="iconizatorMaxProgress"
                        animated
                        striped>
                        <b-progress-bar :value="iconizatorProgress"
                            :label="
                                iconizatorMaxProgress > 0 && iconizatorProgress > 0
                                    ? iconizatorProgress + '/' + iconizatorMaxProgress
                                    : ''
                            ">
                        </b-progress-bar>
                    </b-progress>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="text-center">
                    <hr>
                    <h4 class="mb-3">KEYWORDER</h4>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2">
                    <b-form-group label="Icons Folder Path:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <div>
                            <span>
                                {{
                                    keyworderIconsFolder
                                        ? keyworderIconsFolder
                                        : 'Choose a folder with icons...'
                                }}
                            </span>
                            <b-btn @click="openDialog('keyworderIconsFolder', 'folder')"
                                class="ml-3 float-right">
                                Browse
                            </b-btn>
                        </div>
                    </b-form-group>
                    <b-form-group label="Title:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-input v-model="title" placeholder="Title">
                        </b-form-input>
                    </b-form-group>
                    <b-form-group label="Blacklist:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-textarea placeholder="Blacklist"
                            v-model="blacklist"
                            @input="blacklistChanged()"
                            rows="6"
                            max-rows="6">
                        </b-form-textarea>
                    </b-form-group>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="text-center mb-3">
                    <b-btn :disabled="!keyworderIsReady"
                        :variant="keyworderIsProcessing ? 'danger' : 'primary'"
                        @click="switchKeywording()"
                        class="float-right">
                        {{keyworderIsProcessing ? 'Stop' : 'Start'}}
                    </b-btn>
                </b-col>
            </b-row>
            <b-row v-if="keyworderIsProcessing">
                <b-col md="8" offset-md="2">
                    <b-progress :max="keyworderMaxProgress"
                        animated
                        striped>
                        <b-progress-bar :value="keyworderProgress"
                            variant="success"
                            :label="
                                keyworderMaxProgress > 0 && keyworderProgress > 0
                                    ? keyworderProgress + '/' + keyworderMaxProgress
                                    : ''
                            ">
                        </b-progress-bar>
                    </b-progress>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script src="./home.js">
</script>
