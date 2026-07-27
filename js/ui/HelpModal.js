/* ==========================================================
   Gesture Synth AI
   ui/HelpModal.js
========================================================== */

export default class HelpModal {

    constructor() {

        this.modal = document.getElementById("helpModal");
        this.openBtn = document.getElementById("helpBtn");
        this.closeBtn = document.getElementById("closeHelp");

        this.bindEvents();

    }

    /* ==========================================
       Events
    ========================================== */

    bindEvents() {

        if (this.openBtn) {

            this.openBtn.addEventListener("click", () => {

                this.open();

            });

        }

        if (this.closeBtn) {

            this.closeBtn.addEventListener("click", () => {

                this.close();

            });

        }

        window.addEventListener("keydown", (e) => {

            if (e.key === "Escape") {

                this.close();

            }

            if (e.key === "F1") {

                e.preventDefault();

                this.toggle();

            }

        });

        window.addEventListener("click", (e) => {

            if (e.target === this.modal) {

                this.close();

            }

        });

    }

    /* ==========================================
       Controls
    ========================================== */

    open() {

        if (!this.modal) return;

        this.modal.classList.add("show");

    }

    close() {

        if (!this.modal) return;

        this.modal.classList.remove("show");

    }

    toggle() {

        if (!this.modal) return;

        this.modal.classList.toggle("show");

    }

    /* ==========================================
       Update Help
    ========================================== */

    setVersion(version) {

        const el = document.getElementById("version");

        if (el) {

            el.textContent = version;

        }

    }

    setGestureList(list = []) {

        const container = document.getElementById("gestureList");

        if (!container) return;

        container.innerHTML = "";

        list.forEach(item => {

            const div = document.createElement("div");

            div.className = "gesture-item";

            div.innerHTML = `

                <strong>${item.name}</strong>

                <span>${item.action}</span>

            `;

            container.appendChild(div);

        });

    }

}