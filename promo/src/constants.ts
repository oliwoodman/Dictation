// Colors
export const ACCENT = "#c15f3c";
export const BG_DARK = "#1c1c1e";
export const SECONDARY = "#b1ada1";
export const LABEL_DARK = "rgba(220, 218, 213, 1)";

// Panel
export const PANEL_WIDTH = 320;
export const PANEL_HEIGHT = 96;
export const PANEL_RADIUS = 20;
export const PANEL_SCALE = 1.8; // Scale up for video visibility

// Waveform
export const BAR_COUNT = 20;
export const BAR_WIDTH = 4;
export const BAR_SPACING = 3;
export const BAR_MAX_HEIGHT = 48;
export const BAR_MIN_HEIGHT = 4;

// Video
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 451;

// Setup Wizard Video
export const WIZARD_DURATION = 760;
export const WIZARD_WINDOW_W = 480;
export const WIZARD_WINDOW_H = 540;
export const WIZARD_SCALE = 1.5;

export const WIZ = {
  FADE_IN: 0,
  WELCOME_START: 20,
  WELCOME_CLICK: 110,
  T01: 120,            // transition welcome → permissions
  PERM_START: 135,
  PERM_MIC_CLICK: 170,
  PERM_MIC_DIALOG: 176,     // macOS dialog appears
  PERM_MIC_ALLOW: 222,      // "Allow" clicked (+1s viewing)
  PERM_MIC_GRANTED: 228,    // checkmark on card
  PERM_AX_CLICK: 248,
  PERM_AX_DIALOG: 254,
  PERM_AX_ALLOW: 300,       // "Allow" clicked (+1s viewing)
  PERM_AX_GRANTED: 306,
  PERM_CONTINUE_SHOW: 316,
  PERM_CONTINUE_CLICK: 330,
  T12: 340,                  // transition permissions → api key
  API_START: 355,
  GROQ_CUT_IN: 425,
  GROQ_CREATE_CLICK: 450,
  GROQ_COPY_CLICK: 510,     // extra time to view created key
  GROQ_CUT_OUT: 535,
  API_PASTE_START: 545,
  API_CONTINUE_CLICK: 590,
  T23: 595,                  // transition api key → complete
  COMPLETE_START: 610,
  COMPLETE_KEY_PRESS: 650,
  COMPLETE_CLICK: 670,
  WIZARD_CLOSE: 680,
  LOGO_IN: 695,              // Dictate logo appears
  FADE_OUT: 745,
} as const;

// Scene timing (frame numbers)
export const SCENE = {
  DESKTOP_IN: 0,
  HOTKEY_IN: 46,
  HOTKEY_PRESS: 61,
  HOTKEY_OUT: 90,
  PANEL_IN: 91,
  RECORDING_START: 101,
  TRANSCRIBING_START: 211,
  PANEL_OUT: 250,
  TEXT_START: 256,
  TEXT_END: 301,
  SETTLE_END: 331,
  OUTRO_START: 332,
} as const;
