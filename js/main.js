/* ==========================================================
   Gesture Synth AI
   main.js
========================================================== */

import App from "./app.js";

let app = null;

/* ==========================================
    Boot
========================================== */

window.addEventListener("DOMContentLoaded", async () => {

    try {

        app = new App();

        await app.initialize();

        console.log("🚀 Gesture Synth AI Started");

    }

    catch (error) {

        console.error("Application Error:", error);

        alert(
            "Failed to start Gesture Synth AI.\n\nCheck:\n• Camera Permission\n• HTTPS\n• Browser Console"
        );

    }

});

/* ==========================================
    Cleanup
========================================== */

window.addEventListener("beforeunload", () => {

    try {

        app?.destroy();

    }

    catch (error) {

        console.error("Destroy Error:", error);

    }

});

/* ==========================================
    Visibility
========================================== */

document.addEventListener("visibilitychange", () => {

    if (!app) return;

    try {

        if (document.hidden) {

            app.synth?.suspend?.();

        }

        else {

            app.synth?.resume?.();

        }

    }

    catch (error) {

        console.warn(error);

    }

});

/* ==========================================
    Global Error Handler
========================================== */

window.addEventListener("error", (event) => {

    console.error("Global Error:", event.error);

});

window.addEventListener("unhandledrejection", (event) => {

    console.error("Unhandled Promise:", event.reason);

});