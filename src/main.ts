import { defineCustomElement } from "vue";

import App from "./App.ce.vue";

// console.log(App.styles); // ['/* css content */']

// register
customElements.define("wordle-for-good", defineCustomElement(App));
