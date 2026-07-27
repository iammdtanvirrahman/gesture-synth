/* ==========================================================
   Gesture Synth AI
   constants.js
========================================================== */

/* ========= MediaPipe Hand Landmark Index ========= */

export const LANDMARK = {

    WRIST: 0,

    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,

    INDEX_MCP: 5,
    INDEX_PIP: 6,
    INDEX_DIP: 7,
    INDEX_TIP: 8,

    MIDDLE_MCP: 9,
    MIDDLE_PIP: 10,
    MIDDLE_DIP: 11,
    MIDDLE_TIP: 12,

    RING_MCP: 13,
    RING_PIP: 14,
    RING_DIP: 15,
    RING_TIP: 16,

    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20

};

/* ========= Finger Names ========= */

export const FINGERS = [

    "Thumb",

    "Index",

    "Middle",

    "Ring",

    "Pinky"

];

/* ========= Finger Tips ========= */

export const FINGER_TIPS = [

    LANDMARK.THUMB_TIP,

    LANDMARK.INDEX_TIP,

    LANDMARK.MIDDLE_TIP,

    LANDMARK.RING_TIP,

    LANDMARK.PINKY_TIP

];

/* ========= Finger PIP ========= */

export const FINGER_PIPS = [

    LANDMARK.THUMB_IP,

    LANDMARK.INDEX_PIP,

    LANDMARK.MIDDLE_PIP,

    LANDMARK.RING_PIP,

    LANDMARK.PINKY_PIP

];

/* ========= Major Scale ========= */

export const MAJOR_SCALE = [

    "I",

    "ii",

    "iii",

    "IV",

    "V",

    "vi",

    "vii°"

];

/* ========= Chord Quality ========= */

export const CHORD_QUALITY = {

    MAJOR: "Major",

    MINOR: "Minor",

    DIMINISHED: "Dim",

    AUGMENTED: "Aug",

    SUS2: "Sus2",

    SUS4: "Sus4",

    POWER: "5"

};

/* ========= Semitone ========= */

export const INTERVAL = {

    ROOT: 0,

    MINOR_SECOND: 1,

    MAJOR_SECOND: 2,

    MINOR_THIRD: 3,

    MAJOR_THIRD: 4,

    PERFECT_FOURTH: 5,

    TRITONE: 6,

    PERFECT_FIFTH: 7,

    MINOR_SIXTH: 8,

    MAJOR_SIXTH: 9,

    MINOR_SEVENTH: 10,

    MAJOR_SEVENTH: 11,

    OCTAVE: 12

};

/* ========= Note Names ========= */

export const NOTE_NAMES = [

    "C",

    "C#",

    "D",

    "D#",

    "E",

    "F",

    "F#",

    "G",

    "G#",

    "A",

    "A#",

    "B"

];

/* ========= Default Chords ========= */

export const DEFAULT_CHORDS = {

    1: "I",

    2: "ii",

    3: "iii",

    4: "IV",

    5: "V",

    6: "vi",

    7: "vii°"

};

/* ========= Colors ========= */

export const COLORS = {

    CYAN: "#00F3FF",

    GOLD: "#E8A13D",

    RED: "#FF4D5C",

    GREEN: "#3DDC84",

    WHITE: "#FFFFFF"

};

/* ========= FPS ========= */

export const FPS_SAMPLE_SIZE = 60;