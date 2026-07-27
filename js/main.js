/* ==========================================================
   Gesture Synth AI
   main.js
========================================================== */

import App from "./app.js";

let app = null;

window.addEventListener("DOMContentLoaded", async () => {

    try {

        app = new App();

        await app.initialize();

        console.log("🚀 Gesture Synth AI Started");

    } catch (error) {

        console.error(error);

        alert(
            "Failed to start Gesture Synth AI.\nCheck camera permission and browser console."
        );

    }

});

window.addEventListener("beforeunload", () => {

    if (app) {

        app.destroy();

    }

});