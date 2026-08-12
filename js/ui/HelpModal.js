/* ==========================================================
   Gesture Synth AI
   ui/HelpModal.js
========================================================== */

import { findByIds } from '../utils/dom.js';

export default class HelpModal {

    constructor() {
        this.modal = findByIds("helpModal");
        this.openBtn = findByIds("helpBtn", "helpButton");
        this.closeBtn = findByIds("closeHelp", "helpClose");

        this.onOpen = () => this.open();
        this.onClose = () => this.close();

        this.onKeyDown = (e) => {
            if (e.key === "Escape") this.close();
            if (e.key === "F1") {
                e.preventDefault();
                this.toggle();
            }
        };

        this.onWindowClick = (e) => {
            if (e.target === this.modal) this.close();
        };

        this.bindEvents();
    }

    bindEvents() {
        this.openBtn?.addEventListener("click", this.onOpen);
        this.closeBtn?.addEventListener("click", this.onClose);
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("click", this.onWindowClick);
    }

    open() { this.modal?.classList.add("show"); }
    close() { this.modal?.classList.remove("show"); }
    toggle() { this.modal?.classList.toggle("show"); }

    setVersion(version) {
        const el = document.getElementById("version");
        if (el) el.textContent = version;
    }

    setGestureList(list = []) {
        const container = document.getElementById("gestureList");
        if (!container) return;

        container.innerHTML = "";

        for (const item of list) {
            const div = document.createElement("div");
            div.className = "gesture-item";
            div.innerHTML = `
                <strong>${item.name}</strong>
                <span>${item.action}</span>
            `;
            container.appendChild(div);
        }
    }

    destroy() {
        this.openBtn?.removeEventListener("click", this.onOpen);
        this.closeBtn?.removeEventListener("click", this.onClose);
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("click", this.onWindowClick);
    }
}
