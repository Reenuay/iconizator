<template>
    <div>
        <b-navbar type="dark" variant="dark" sticky>
            <b-navbar-brand>Iconizator</b-navbar-brand>
            <b-navbar-nav>
                <b-nav-item right>{{appVersion}}</b-nav-item>
            </b-navbar-nav>
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
                        <b-row align-v="center">
                            <b-col md="9">
                                <b-form-select v-model="iconizatorIconsFolder" md="8">
                                    <option :value="undefined">Choose a folder with icons...</option>
                                    <option v-for="i in iconizatorIconsFolders"
                                        :value="i"
                                        :key="i">
                                        {{i}}
                                    </option>
                                </b-form-select>
                            </b-col>
                            <b-col md="1">
                                <b-btn @click="removeFromList('iconizatorIconsFolders', 'iconizatorIconsFolder')"
                                    class="ml-3 float-right"
                                    variant="danger">
                                    x
                                </b-btn>
                            </b-col>
                            <b-col md="2">
                                <b-btn @click="openDialog('iconizatorIconsFolder', 'folder')"
                                    class="ml-3 float-right">
                                    Browse
                                </b-btn>
                            </b-col>
                        </b-row>
                    </b-form-group>
                    <b-form-group label="Background Path:"
                        label-cols="2"
                        breakpoint="md"
                        description="Preferred ratio 1:1"
                        horizontal>
                        <b-row align-v="center">
                            <b-col md="9">
                                <b-form-select v-model="background" md="8">
                                    <option :value="undefined">Choose a vector file...</option>
                                    <option v-for="i in backgrounds"
                                        :value="i"
                                        :key="i">
                                        {{i}}
                                    </option>
                                </b-form-select>
                            </b-col>
                            <b-col md="1">
                                <b-btn @click="removeFromList('backgrounds', 'background')"
                                    class="ml-3 float-right"
                                    variant="danger">
                                    x
                                </b-btn>
                            </b-col>
                            <b-col md="2">
                                <b-btn @click="openDialog('background', 'file', [{name: 'vector', extensions:['svg', 'ai', 'eps']}])"
                                    class="ml-3 float-right">
                                    Browse
                                </b-btn>
                            </b-col>
                        </b-row>
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
                        :description="'Maximum ' + documentSize "
                        horizontal>
                        <b-form-input placeholder="Icon size"
                            type="number"
                            min="1"
                            :max="documentSize"
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
                    <b-form-checkbox v-model="saveFlipped"
                     :value="true"
                     :unchecked-value="false">
                        Save flipped
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-form-checkbox v-model="onlyJPEG"
                     :value="true"
                     :unchecked-value="false">
                        Only JPEG
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-form-checkbox v-model="useText"
                     :value="true"
                     :unchecked-value="false">
                        Use Text
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row align-v="center" :hidden="!useText">
                <b-col md="8" offset-md="2">
                    <b-form-group label="Text size:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-input placeholder="Text size"
                            type="number"
                            min="1"
                            :state="svgTextSizeIsCorrect"
                            v-model="svgTextSize">
                        </b-form-input>
                    </b-form-group>
                </b-col>
                <b-col md="8" offset-md="2">
                    <b-form-group label="Text offset:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-input placeholder="Text offset"
                            type="number"
                            min="0"
                            :state="svgTextOffsetIsCorrect"
                            v-model="svgTextOffset">
                        </b-form-input>
                    </b-form-group>
                </b-col>
                <b-col md="8" offset-md="2">
                    <b-form-group label="Text color:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <swatches :colors="swatches"
                            @input="switchTextSwatch"
                            max-height="80"
                            shapes="circles"
                            :value="svgTextSelectedColor"
                            inline>
                        </swatches>
                    </b-form-group>
                </b-col>
                <b-col md="8" offset-md="2">
                    <b-form-group label="Text font:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-select v-model="svgTextFont" md="8" @input="fontChanged()">
                            <option :value="undefined">Choose a font...</option>
                            <option v-for="f in fonts"
                                :value="f"
                                :key="f.family">
                                {{f.family}}
                            </option>
                        </b-form-select>
                    </b-form-group>
                </b-col>
                <b-col md="8" offset-md="2">
                    <b-form-group label="Font style:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-select v-model="svgTextFontStyle" md="8">
                            <option v-for="s in (svgTextFont ? svgTextFont.subFamilies : [])"
                                :value="s"
                                :key="s">
                                {{s}}
                            </option>
                        </b-form-select>
                    </b-form-group>
                </b-col>
                <b-col md="8" offset-md="2">
                    <b-form-checkbox v-model="svgTextUpperCase"
                    :value="true"
                    :unchecked-value="false">
                        Upper Case
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row align-v="center">
                <b-col md="8" offset-md="2" class="text-center">
                    <svg :width="svgSize" :height="svgSize">
                        <rect :width="svgSize"
                            :height="svgSize"
                            style="fill:rgb(255,255,255);stroke-width:4;stroke:rgb(162,170,183)">
                        </rect>
                        <svg :viewBox="[0, 0, 344.1, 292.3].join(' ')"
                            style="enable-background:new 0 0 344.1 292.3;"
                            xml:space="preserve"
                            :x="iconOffsetOnCanvas"
                            :y="iconOffsetOnCanvas"
                            :width="iconSizeOnCanvas"
                            :height="iconSizeOnCanvas">
                            <g :transform="saveFlipped ? 'translate(344.1, 0) scale(-1,1)': ''">
                                <path :fill="selectedColor ? selectedColor : '#000'" d="M192.9,7.3c-2.1-4.6-7.6-6.7-12.2-4.6l-6.6,3l22.6,10.2L192.9,7.3z"/>
                                <path :fill="selectedColor ? selectedColor : '#000'" d="M338.6,79.6L163.3,0.8c-4.6-2.1-10.1,0-12.2,4.6l-5.9,13.2L5.4,81.6c-4.6,2.1-6.7,7.6-4.6,12.2l86.9,193.1
                                    c2.1,4.6,7.6,6.7,12.2,4.6l74.2-33.4l-8.1-3.7l78.2,35.2c4.6,2.1,10.1,0,12.2-4.6l86.8-193.2C345.4,87.2,343.3,81.7,338.6,79.6z
                                    M30.7,95l100.5-45.2L67.5,191.6l-39.8-88.5C26.3,100,27.6,96.4,30.7,95z M98.1,244.7c-3.1,1.4-6.7,0-8-3l-12-26.7l43.1,19.4
                                    L98.1,244.7z M316.4,101.1l-62.3,138.6c-1.4,3.1-5,4.4-8,3.1l-143.3-64.4c-3.1-1.4-4.4-5-3.1-8L162,31.8c1.4-3.1,5-4.4,8-3.1
                                    l143.3,64.4C316.4,94.5,317.7,98,316.4,101.1z"/>
                                <path :fill="selectedColor ? selectedColor : '#000'" d="M233.3,136.4c-0.3-3.2-3.9-4.8-6.5-2.9L180,167.2c-2.6,1.9-6.2,0.2-6.5-2.9l-2.5-25.1c-0.3-3.2-3.9-4.8-6.5-2.9l-46.3,33.4
                                    c-2.6,1.9-2.2,5.8,0.7,7.1l29.5,13.2l29.2,13.1l59.2,26.6c2.9,1.3,6.1-1,5.8-4.2L233.3,136.4z"/>
                                <ellipse :fill="selectedColor ? selectedColor : '#000'" transform="matrix(0.4099 -0.9121 0.9121 0.4099 31.2143 212.466)" cx="179.8" cy="82.1" rx="14.7" ry="14.7"/>
                            </g>
                        </svg>
                        <text :x="svgTextXOffset"
                            :y="svgTextYOffset"
                            :fill="svgTextSelectedColor || '#000000'"
                            :font-size="svgTextCanvasSize"
                            :hidden="!useText"
                            text-anchor="middle"
                            :style="svgTextFont ? 'font-family:' + svgTextFont.family : ''">
                            {{svgText}}
                        </text>
                    </svg>
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
                        <b-row align-v="center">
                            <b-col md="9">
                                <b-form-select v-model="title" md="8">
                                    <option :value="undefined">Choose a title</option>
                                    <option v-for="i in titles"
                                        :value="i"
                                        :key="i">
                                        {{i}}
                                    </option>
                                </b-form-select>
                            </b-col>
                            <b-col md="1">
                                <b-btn @click="editTitle()"
                                    class="ml-3 float-right"
                                    variant="primary">
                                    Edit
                                </b-btn>
                            </b-col>
                            <b-col md="2">
                                <b-btn @click="removeFromList('titles', 'title')"
                                    class="ml-3 float-right"
                                    variant="danger">
                                    Delete
                                </b-btn>
                            </b-col>
                        </b-row>
                        <b-row align-v="center" class="mt-3">
                            <b-col md="9">
                                <b-form-input v-model="newTitle" placeholder="Type new title...">
                                </b-form-input>
                            </b-col>
                            <b-col md="1">
                                <b-btn @click="addTitle()"
                                    class="ml-3 float-right"
                                    variant="primary">
                                    Add
                                </b-btn>
                            </b-col>
                            <b-col md="2">
                                <b-btn @click="updateTitle()"
                                    class="ml-3 float-right"
                                    variant="primary">
                                    Update
                                </b-btn>
                            </b-col>
                        </b-row>
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
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-form-checkbox v-model="titleOnly"
                     :value="true"
                     :unchecked-value="false">
                        Title only
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-form-checkbox v-model="addRequireds"
                     :value="true"
                     :unchecked-value="false">
                        Add requireds
                    </b-form-checkbox>
                </b-col>
            </b-row>
            <b-row :hidden="!addRequireds">
                <b-col md="8" offset-md="2">
                    <b-form-group label="Requireds:"
                        label-cols="2"
                        breakpoint="md"
                        horizontal>
                        <b-form-textarea placeholder="Requireds"
                            v-model="requireds"
                            @input="requiredsChanged()"
                            rows="6"
                            max-rows="6">
                        </b-form-textarea>
                    </b-form-group>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="8" offset-md="2" class="mb-3">
                    <b-form-checkbox v-model="useWhiteList"
                     :value="true"
                     :unchecked-value="false">
                        Use white list
                    </b-form-checkbox>
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
