import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { inject } from "@vercel/analytics";

inject();

// ---- DOM References ----
const videoEl = document.getElementById("webcam");
const canvasEl = document.getElementById("overlay");
const ctx = canvasEl.getContext("2d");

const chordDisplayEl = document.getElementById("chordDisplay");
const qualityDisplayEl = document.getElementById("qualityDisplay");
const volumeBarEls = Array.from(document.querySelectorAll(".vol-bar"));
const startOverlayEl = document.getElementById("startOverlay");
const fpsEl = document.getElementById("val-fps");
const handsEl = document.getElementById("val-hands");
const filterEl = document.getElementById("distortionDisplay");

const helpButton = document.getElementById("helpButton");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
const keySelectEl = document.getElementById("keySelect");
const toneSelectEl = document.getElementById("toneSelect");

// ---- Finger Landmark Map ----
const FINGERS = {
  index:  { pip: 6, tip: 8 },
  middle: { pip: 10, tip: 12 },
  ring:   { pip: 14, tip: 16 },
  pinky:  { pip: 18, tip: 20 },
};

function isFingerExtended(landmarks, name) {
  const { pip, tip } = FINGERS[name];
  return landmarks[tip].y < landmarks[pip].y;
}

function isThumbExtended(landmarks, handedness) {
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  return handedness === "Right" ? thumbTip.x > thumbIp.x : thumbTip.x < thumbIp.x;
}

function getChordQuality(landmarks) {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  return middleMcp.x > wrist.x ? "minor" : "major";
}

function classifyChord(landmarks, handedness) {
  const thumb = isThumbExtended(landmarks, handedness);
  const index = isFingerExtended(landmarks, "index");
  const middle = isFingerExtended(landmarks, "middle");
  const ring = isFingerExtended(landmarks, "ring");
  const pinky = isFingerExtended(landmarks, "pinky");

  const quality = getChordQuality(landmarks);

  if (index && pinky && !middle && !ring && !thumb) {
    return quality === "major" ? "VI" : "vi";
  }
  if (index && pinky && !middle && !ring && thumb) {
    return quality === "major" ? "VII" : "vii";
  }

  const count = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
  const base = ROMAN[count];
  if (!base) return null;

  return quality === "major" ? base : base.toLowerCase();
}

function getHandHorizontalTilt(landmarks, handedness) {
  if (!landmarks || landmarks.length < 18) return 0;
  try {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];

    const minX = Math.min(middleMcp.x, ringMcp.x);
    const maxX = Math.max(middleMcp.x, ringMcp.x);
    let tiltFactor = 0;
    const MAX_TRAVEL = 0.12;

    if (wrist.x < minX) tiltFactor = (wrist.x - minX) / MAX_TRAVEL;
    else if (wrist.x > maxX) tiltFactor = (wrist.x - maxX) / MAX_TRAVEL;

    tiltFactor = Math.max(-1, Math.min(1, tiltFactor));
    return handedness === "Right" ? -tiltFactor : tiltFactor;
  } catch (err) {
    return 0;
  }
}

// ---- Dynamic Canvas Visualizer ----
function drawEnergy(ctx, volume01, qualityIndex, tiltFactor, chordStr) {
  if (!ctx || qualityIndex === 0) return;
  const lineCount = qualityIndex;

  try {
    const centerY = ctx.canvas.height - 70;
    const canvasWidth = ctx.canvas.width;
    const maxThickness = 1 + (volume01 * 8);

    const chaosScale = (tiltFactor + 1) / 2;
    const shakinessAmp = chaosScale * 25;
    const shakinessFreq = 0.05 + (chaosScale * 0.15);

    let baseColorRGB = "0, 243, 255";
    let isChordActive = false;
    let isMajor = false;

    if (chordStr && chordStr !== "--") {
      isChordActive = true;
      const upperStr = chordStr.toUpperCase();
      isMajor = (chordStr === upperStr);

      const SCALE_COLORS = {
        "I":   "232, 161, 61",
        "II":  "210, 50, 120",
        "III": "180, 40, 150",
        "IV":  "240, 210, 40",
        "V":   "245, 120, 30",
        "VI":  "230, 40, 40",
        "VII": "0, 243, 255"
      };
      baseColorRGB = SCALE_COLORS[upperStr] || "0, 243, 255";
    }

    const brightnessAlpha = isChordActive ? (isMajor ? 1 : 0.65) : 0.3;
    ctx.save();
    const time = performance.now() * 0.004;

    const [r, g, b] = baseColorRGB.split(",").map(v => parseInt(v));
    ctx.shadowBlur = 12 + (volume01 * 20);
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${0.5 * brightnessAlpha})`;

    for (let l = 0; l < lineCount; l++) {
      ctx.beginPath();
      const lineYOffset = centerY + (l - (lineCount - 1) / 2) * 12;

      for (let x = 0; x <= canvasWidth; x += 12) {
        const baseSine = Math.sin(x * 0.005 + time + l * 0.5) * 22;
        const jitter = (Math.random() - 0.5) * shakinessAmp * Math.sin(x * shakinessFreq + time);
        const y = lineYOffset + baseSine + jitter;

        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${brightnessAlpha})`;
      ctx.lineWidth = Math.max(1, maxThickness - (l * 0.5));
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.restore();
  } catch (e) {}
}

// ---- Synth Engine ----
class SynthEngine {
  constructor() {
    this.ctx = null;
    this.filter = null;
    this.masterGain = null;
    this.oscillators = [];
    this.currentKey = null;
  }

  ensureContext() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 1200;
    this.filter.Q.value = 0.7;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;

    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  setVolume(volume01) {
    if (!this.ctx) return;
    const clamped = Math.max(0, Math.min(1, volume01));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.03);
  }

  updateFilterSweep(tiltFactor) {
    if (!this.filter || !this.ctx) return;
    let targetFreq = 1200;
    let targetQ = 0.7;

    if (tiltFactor < 0) {
      const intensity = Math.abs(tiltFactor);
      targetFreq = 1200 - (intensity * 950);
      targetQ = 0.7 + (intensity * 1.5);
    } else if (tiltFactor > 0) {
      targetFreq = 1200 + (tiltFactor * 3800);
      targetQ = 0.7 + (tiltFactor * 4.5);
    }

    const now = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.04);
    this.filter.Q.setTargetAtTime(targetQ, now, 0.04);
  }

  playNotes(freqs) {
    if (!this.ctx || freqs.length === 0) return;
    const key = freqs.map((f) => f.toFixed(1)).join(",");
    if (key === this.currentKey) return;

    this.oscillators.forEach((osc) => { try { osc.stop(); } catch {} });
    this.oscillators = freqs.map((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = currentWaveform;
      osc.frequency.value = freq;
      osc.connect(this.filter);
      osc.start();
      return osc;
    });
    this.currentKey = key;
  }
}

const synth = new SynthEngine();

// ---- Music Math Helpers ----
const DEGREE_SEMITONES = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: -1 };
let currentTonicFreq = Number(keySelectEl.value);
let currentKeyName = keySelectEl.selectedOptions[0].dataset.note;
let currentWaveform = toneSelectEl.value;

keySelectEl.addEventListener("change", () => {
  currentTonicFreq = Number(keySelectEl.value);
  currentKeyName = keySelectEl.selectedOptions[0].dataset.note;
});

toneSelectEl.addEventListener("change", () => {
  currentWaveform = toneSelectEl.value;
  synth.currentKey = null;
});

function getDegreeFreq(degree) {
  const semitones = DEGREE_SEMITONES[degree];
  let tonic = currentTonicFreq;
  if (tonic === 369.99 || tonic === 392.00 || tonic === 415.30) tonic /= 2;
  return tonic * Math.pow(2, semitones / 12);
}

const NUMERAL_TO_DEGREE = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const MAJOR_SCALE = {
  A:  ["A","B","C#","D","E","F#","G#"],
  Bb: ["Bb","C","D","Eb","F","G","A"],
  B:  ["B","C#","D#","E","F#","G#","A#"],
  C:  ["C","D","E","F","G","A","B"],
  Db: ["Db","Eb","F","Gb","Ab","Bb","C"],
  D:  ["D","E","F#","G","A","B","C#"],
  Eb: ["Eb","F","G","Ab","Bb","C","D"],
  E:  ["E","F#","G#","A","B","C#","D#"],
  F:  ["F","G","A","Bb","C","D","E"],
  Gb: ["Gb","Ab","Bb","Cb","Db","Eb","F"],
  G:  ["G","A","B","C","D","E","F#"],
  Ab: ["Ab","Bb","C","Db","Eb","F","G"]
};

function getChordName(roman, isMajorMode) {
  if (!roman || roman === "--") return "";
  const degree = NUMERAL_TO_DEGREE[roman.toUpperCase()];
  if (!degree) return "";
  const root = MAJOR_SCALE[currentKeyName][degree - 1];
  return isMajorMode ? root : root + "m";
}

function getChordTones(numeralStr, isMajorMode) {
  if (!numeralStr || numeralStr === "--") return null;
  const degree = NUMERAL_TO_DEGREE[numeralStr.toUpperCase()];
  if (!degree) return null;

  const root = getDegreeFreq(degree);
  const thirdSemitones = isMajorMode ? 4 : 3;

  return {
    root,
    third: root * Math.pow(2, thirdSemitones / 12),
    fifth: root * Math.pow(2, 7 / 12),
    octaveRoot: root * 2,
    octaveThird: (root * Math.pow(2, thirdSemitones / 12)) * 2,
    dom7Tone: root * Math.pow(2, 10 / 12),
    maj7Tone: root * Math.pow(2, 11 / 12),
    dim7Tone: root * Math.pow(2, 9 / 12),
    dim5Tone: root * Math.pow(2, 6 / 12)
  };
}

function getSolidNotes(tones, rightHandCount, isMajorMode) {
  if (!tones) return [];
  const { root, third, fifth, octaveRoot, octaveThird, maj7Tone, dom7Tone, dim7Tone, dim5Tone } = tones;

  if (isMajorMode) {
    switch (rightHandCount) {
      case 1: return [root, fifth, octaveRoot, octaveThird];
      case 2: return [third, fifth, octaveRoot, octaveThird];
      case 3: return [root, third, fifth, maj7Tone];
      case 4: return [root, third, fifth, dom7Tone];
      default: return [root, fifth, octaveRoot, octaveThird];
    }
  } else {
    switch (rightHandCount) {
      case 1: return [root, fifth, octaveRoot, octaveThird];
      case 2: return [third, fifth, octaveRoot, octaveThird];
      case 3: return [root, third, fifth, dom7Tone];
      case 4: return [root, third, dim5Tone, dim7Tone];
      default: return [root, fifth, octaveRoot, octaveThird];
    }
  }
}

// ---- Setup & Loop ----
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }, audio: false
  });
  videoEl.srcObject = stream;
  return new Promise((res) => { videoEl.onloadedmetadata = () => { videoEl.play(); res(); }; });
}

async function setupHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
}

function updateVolumeMeter(volume01) {
  const litCount = Math.round(volume01 * volumeBarEls.length);
  volumeBarEls.forEach((bar) => {
    const index = Number(bar.dataset.index);
    bar.classList.toggle("lit", index >= volumeBarEls.length - litCount);
  });
}

// Event Listeners
startOverlayEl.addEventListener("click", () => {
  synth.ensureContext();
  startOverlayEl.style.display = "none";
  canvasEl.classList.remove("dimmed");
});

helpButton.addEventListener("click", () => helpModal.classList.remove("hidden"));
closeHelp.addEventListener("click", () => helpModal.classList.add("hidden"));

// Frame Rendering Loop
async function main() {
  await setupCamera();
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
  window.addEventListener("resize", () => {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  });

  const landmarker = await setupHandLandmarker();
  let lastVideoTime = -1;
  let frameCount = 0;
  let lastFpsTime = performance.now();

  function loop() {
    const now = performance.now();
    frameCount++;
    if (now - lastFpsTime >= 1000) {
      fpsEl.textContent = frameCount;
      frameCount = 0;
      lastFpsTime = now;
    }

    if (videoEl.currentTime !== lastVideoTime) {
      lastVideoTime = videoEl.currentTime;
      const results = landmarker.detectForVideo(videoEl, now);

      // Mirror Canvas Draw
      ctx.save();
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.translate(canvasEl.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      let leftLandmarks = null;
      let rightLandmarks = null;
      let handCount = results.landmarks ? results.landmarks.length : 0;
      handsEl.textContent = `${handCount} Tracked`;

      results.landmarks.forEach((landmarks, i) => {
        const label = results.handedness[i][0].categoryName;
        if (label === "Left") leftLandmarks = landmarks;
        if (label === "Right") rightLandmarks = landmarks;

        ctx.fillStyle = label === "Left" ? "#00f3ff" : "#e8a13d";
        for (const pt of landmarks) {
          ctx.beginPath();
          ctx.arc(pt.x * canvasEl.width, pt.y * canvasEl.height, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();

      // Audio Logic
      let currentChord = leftLandmarks ? classifyChord(leftLandmarks, "Left") : null;
      let isMajorMode = leftLandmarks ? getHandHorizontalTilt(leftLandmarks, "Left") >= 0 : true;
      let qualityIndex = rightLandmarks ? [
        isFingerExtended(rightLandmarks, "index"),
        isFingerExtended(rightLandmarks, "middle"),
        isFingerExtended(rightLandmarks, "ring"),
        isFingerExtended(rightLandmarks, "pinky")
      ].filter(Boolean).length : 0;

      let thumbDown = rightLandmarks ? isThumbExtended(rightLandmarks, "Right") : false;

      if (currentChord) {
        const chordName = getChordName(currentChord, isMajorMode);
        chordDisplayEl.textContent = `${chordName} (${currentChord})`;
      } else {
        chordDisplayEl.textContent = "--";
      }

      if (rightLandmarks) {
        const wristY = rightLandmarks[0].y;
        const volume = 1 - Math.max(0, Math.min(1, (wristY - 0.05) / 0.9));
        updateVolumeMeter(volume);

        const tilt = getHandHorizontalTilt(rightLandmarks, "Right");
        filterEl.textContent = `Filter: ${Math.round(tilt * 100)}%`;
        synth.updateFilterSweep(tilt);

        if (currentChord && qualityIndex >= 1) {
          const tones = getChordTones(currentChord, isMajorMode);
          let notes = getSolidNotes(tones, qualityIndex, isMajorMode);
          if (thumbDown) notes = notes.map(f => f / 2);

          synth.playNotes(notes);
          synth.setVolume(volume);
        } else {
          synth.setVolume(0);
        }

        drawEnergy(ctx, volume, qualityIndex, tilt, currentChord);
      } else {
        synth.setVolume(0);
        updateVolumeMeter(0);
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
}

main().catch(console.error);
