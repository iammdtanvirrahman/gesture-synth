/* ==========================================================
   Gesture Synth AI
   main.js
========================================================== */

import App from "./app.js";

let app = null;

/* ==========================================
    Boot
========================================== */

window.addEventListener("DOMContentLoaded", () => {

    try {

        app = new App();

        /*
         * Camera access and Web Audio initialization must begin
         * from the user's Start Experience click. Starting them
         * automatically on DOMContentLoaded can be blocked by the
         * browser's user-gesture policy.
         */
        const startButton = document.getElementById("startExperience");

        if (!startButton) {
            throw new Error("Start Experience button not found.");
        }

        startButton.addEventListener("click", async () => {

            try {

                await app.start();

                console.log("🚀 Gesture Synth AI Started");

            }

            catch (error) {

                console.error("Application Error:", error);

                const loadingStatus =
                    document.getElementById("loadingStatus");

                if (loadingStatus) {
                    loadingStatus.textContent =
                        "Startup failed. Check camera permission and console.";
                }

                alert(
                    "Failed to start Gesture Synth AI.\n\n" +
                    "Check:\n" +
                    "• Camera Permission\n" +
                    "• HTTPS / localhost\n" +
                    "• Browser Console"
                );

            }

        }, { once: true });

    }

    catch (error) {

        console.error("Boot Error:", error);

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