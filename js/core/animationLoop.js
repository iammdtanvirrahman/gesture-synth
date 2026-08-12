export default class AnimationLoop {
    constructor({ mediapipe, fingerDetector, handTilt, chordClassifier, synth, landmarkRenderer, energyRenderer, hud, volumeMeter }) {
        this.mp = mediapipe;
        this.detector = fingerDetector;
        this.tilt = handTilt;
        this.classifier = chordClassifier;
        this.synth = synth;
        this.landmark = landmarkRenderer;
        this.energy = energyRenderer;
        this.hud = hud;
        this.volume = volumeMeter;
        this.running = false;
        this.frameId = null;
        this.lastTime = performance.now();
        this.fps = 0;
        this.lastChord = null;
        this.lastFilter = null;
        this.lastVolume = null;
        this.lastVibrato = null;
        this.lastHandCount = 0;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.frameId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.running = false;
        if (this.frameId) cancelAnimationFrame(this.frameId);
        this.frameId = null;
    }

    loop = now => {
        if (!this.running) return;
        const delta = Math.max(1, now - this.lastTime);
        this.lastTime = now;
        this.fps = Math.round(1000 / delta);
        this.hud?.updateFPS?.(this.fps);
        try {
            this.landmark?.render?.();
            this.energy?.render?.();
            this.volume?.render?.();
        } catch (error) {
            console.error("Render error:", error);
        }
        this.frameId = requestAnimationFrame(this.loop);
    };

    onResults(results) {
        try {
            this.landmark?.update?.(results);
            const hands = results?.multiHandLandmarks || [];
            const count = hands.length;
            this.hud?.setHands?.(count);
            if (count !== this.lastHandCount) {
                this.lastHandCount = count;
                this.hud?.setStatus?.(count ? "Tracking" : "Live", true);
            }
            if (!count) {
                this.lastChord = null;
                this.synth?.stopChord?.();
                this.energy?.update?.(0);
                this.volume?.update?.(0);
                this.hud?.update?.({ chord:"—", confidence:0, volume:0 });
                return;
            }

            const hand = hands[0];
            const handedness = results?.multiHandedness?.[0]?.label || "Right";
            this.detector.update(hand, handedness);
            this.tilt.update(hand);
            const chord = this.classifier.classify(this.detector);
            const filter = this.tilt.getFilterValue();
            const volume = this.tilt.getVolume();
            const vibrato = this.tilt.getVibratoDepth();

            if (chord.chord !== this.lastChord) {
                this.lastChord = chord.chord;
                this.synth.playChord(chord.chord);
            }
            const filterChanged = this.lastFilter === null || Math.abs(filter - this.lastFilter) > 35;
            const volumeChanged = this.lastVolume === null || Math.abs(volume - this.lastVolume) > .025;
            const vibratoChanged = this.lastVibrato === null || Math.abs(vibrato - this.lastVibrato) > .04;
            if (filterChanged) { this.synth.setFilter(filter); this.lastFilter = filter; }
            if (volumeChanged) { this.synth.setMasterVolume(volume); this.lastVolume = volume; }
            if (vibratoChanged) { this.synth.setVibrato(vibrato); this.lastVibrato = vibrato; }

            this.energy?.update?.(Math.min(1, this.detector.count() / 5));
            this.volume?.update?.(volume);
            this.hud?.update?.({
                chord: chord.chord,
                confidence: chord.confidence,
                filter,
                volume,
                key: this.classifier.root,
                quality: chord.confidence >= .8 ? "Excellent" : chord.confidence >= .6 ? "Good" : "Low"
            });
        } catch (error) {
            console.error("Gesture processing error:", error);
            this.hud?.setStatus?.("Recovering", false);
        }
    }
}
