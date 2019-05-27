<template>
    <b-row>
        <b-col md="8" offset-md="2" class="mb-3">
            <b-form-checkbox
                v-model="jpeg"
                :value="true"
                :unchecked-value="false"
                @input="onJpegChanged"
            >
                Jpeg
            </b-form-checkbox>
        </b-col>
        <b-col md="8" offset-md="2" class="mb-3">
            <b-form-checkbox
                v-model="eps"
                :value="true"
                :unchecked-value="false"
                @input="onEpsChanged"
            >
                Eps
            </b-form-checkbox>
        </b-col>
    </b-row>
</template>

<script>
import { isBoolean } from 'util';
"use strict";

export default {
    data() {
        return {
            jpeg: true,
            eps: true,
        };
    },
    props: {
        value: {
            type: Array,
            validator(a) {
                return a.length === 2 && a.every(e => typeof e === "boolean") && (a[0] || a[1]);
            }
        }
    },
    computed: {
        computedValue() {
            return [this.jpeg, this.eps];
        }
    },
    methods: {
        onEpsChanged(checked) {
            if (!checked) this.jpeg = true;
            this.$emit("input", [this.jpeg, this.eps]);
        },
        onJpegChanged(checked) {
            if (!checked) this.eps = true;
            this.$emit("input", [this.jpeg, this.eps]);
        }
    },
    watch: {
        value(v) {
            this.jpeg = v[0];
            this.eps = v[1];
        }
    }
};
</script>
