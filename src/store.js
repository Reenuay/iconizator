import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const homeModule = {
    state: {
        count: 16
    },
    mutations: {
        increment(state) {
            state.count++;
        }
    }
};

export default new Vuex.Store({
    strict: process.env.NODE_ENV !== "production",
    modules: {
        home: homeModule
    }
});
