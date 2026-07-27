/* ==========================================================
   Gesture Synth AI
   ui/HelpModal.js
========================================================== */

export default class HelpModal {

    constructor() {

        const find = (...ids) => {

            for (const id of ids) {

                const el = document.getElementById(id);

                if (el) return el;

            }

            return null;

        };

        this.modal = find("helpModal");

        this.openBtn = find(
            "helpBtn",
            "helpButton"
        );

        this.closeBtn = find(
            "closeHelp",
            "helpClose"
        );

        /* -------------------------
            Bind Once
        ------------------------- */

        this.onOpen = () => this.open();

        this.onClose = () => this.close();

        this.onKeyDown = (e) => {

            if (e.key === "Escape") {

                this.close();

            }

            if (e.key === "F1") {

                e.preventDefault();

                this.toggle();

            }

        };

        this.onWindowClick = (e) => {

            if (e.target === this.modal) {

                this.close();

            }

        };

        this.bindEvents();

    }

    /* ==========================================
        Events
    ========================================== */

    bindEvents() {

        this.openBtn?.addEventListener(

            "click",

            this.onOpen

        );

        this.closeBtn?.addEventListener(

            "click",

            this.onClose

        );

        window.addEventListener(

            "keydown",

            this.onKeyDown

        );

        window.addEventListener(

            "click",

            this.onWindowClick

        );

    }

    /* ==========================================
        Controls
    ========================================== */

    open() {

        this.modal?.classList.add("show");

    }

    close() {

        this.modal?.classList.remove("show");

    }

    toggle() {

        this.modal?.classList.toggle("show");

    }

    /* ==========================================
        Version
    ========================================== */

    setVersion(version) {

        const el = document.getElementById("version");

        if (el) {

            el.textContent = version;

        }

    }

    /* ==========================================
        Gesture List
    ========================================== */

    setGestureList(list = []) {

        const container =

            document.getElementById(

                "gestureList"

            );

        if (!container) return;

        container.innerHTML = "";

        for (const item of list) {

            const div =

                document.createElement("div");

            div.className =

                "gesture-item";

            div.innerHTML = `

                <strong>${item.name}</strong>

                <span>${item.action}</span>

            `;

            container.appendChild(div);

        }

    }

    /* ==========================================
        Destroy
    ========================================== */

    destroy() {

        this.openBtn?.removeEventListener(

            "click",

            this.onOpen

        );

        this.closeBtn?.removeEventListener(

            "click",

            this.onClose

        );

        window.removeEventListener(

            "keydown",

            this.onKeyDown

        );

        window.removeEventListener(

            "click",

            this.onWindowClick

        );

    }

}
