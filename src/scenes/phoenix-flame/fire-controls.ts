import GUI from "lil-gui";
import type { FireFilter } from "./fire-filter";

// Helper: convert Float32Array [r,g,b] (0–1) to hex string for lil-gui color picker
function toHex(arr: Float32Array) {
  const r = Math.round(arr[0] * 255);
  const g = Math.round(arr[1] * 255);
  const b = Math.round(arr[2] * 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function fromHex(hex: string, target: Float32Array) {
  const n = Number.parseInt(hex.slice(1), 16);
  target[0] = ((n >> 16) & 0xff) / 255;
  target[1] = ((n >> 8) & 0xff) / 255;
  target[2] = (n & 0xff) / 255;
}

function addColor(folder: GUI, uniforms: Record<string, unknown>, name: string, label: string) {
  const arr = uniforms[name] as Float32Array;
  const proxy = { [label]: toHex(arr) };
  folder.addColor(proxy, label).onChange((hex: string) => fromHex(hex, arr));
}

function addFloat(
  folder: GUI,
  uniforms: Record<string, unknown>,
  name: string,
  label: string,
  min: number,
  max: number,
  step: number,
) {
  const proxy = { [label]: uniforms[name] as number };
  folder.add(proxy, label, min, max, step).onChange((v: number) => {
    uniforms[name] = v;
  });
}

function addVec2(
  folder: GUI,
  uniforms: Record<string, unknown>,
  name: string,
  labels: [string, string],
  min: number,
  max: number,
  step: number,
) {
  const arr = uniforms[name] as Float32Array;
  const proxy = { [labels[0]]: arr[0], [labels[1]]: arr[1] };
  folder.add(proxy, labels[0], min, max, step).onChange((v: number) => {
    arr[0] = v;
  });
  folder.add(proxy, labels[1], min, max, step).onChange((v: number) => {
    arr[1] = v;
  });
}

function addVec3Sliders(
  folder: GUI,
  uniforms: Record<string, unknown>,
  name: string,
  labels: [string, string, string],
  min: number,
  max: number,
  step: number,
) {
  const arr = uniforms[name] as Float32Array;
  const proxy = { [labels[0]]: arr[0], [labels[1]]: arr[1], [labels[2]]: arr[2] };
  folder.add(proxy, labels[0], min, max, step).onChange((v: number) => {
    arr[0] = v;
  });
  folder.add(proxy, labels[1], min, max, step).onChange((v: number) => {
    arr[1] = v;
  });
  folder.add(proxy, labels[2], min, max, step).onChange((v: number) => {
    arr[2] = v;
  });
}

export class FireControls {
  private readonly gui: GUI;

  constructor(private readonly filter: FireFilter) {
    const u = filter.resources.fireUniforms.uniforms;
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.gui = new GUI({ title: "Fire Controls", closeFolders: true });
    this.gui.close();
    this.gui.domElement.style.marginTop = "60px";
    this.gui.domElement.style.maxHeight = "calc(100vh - 70px)";
    this.gui.domElement.style.overflowY = "auto";
    if (isMobile) this.gui.domElement.style.display = "none";

    // Noise
    const noise = this.gui.addFolder("Noise");
    addVec2(noise, u, "uNoiseScale", ["Scale X", "Scale Y"], 1, 30, 0.5);
    addFloat(noise, u, "uScrollSpeed", "Scroll Speed", 0, 30, 0.5);

    // Falloff
    const falloff = this.gui.addFolder("Falloff");
    addVec2(falloff, u, "uCenter", ["Center X", "Center Y"], 0, 1, 0.01);
    addFloat(falloff, u, "uXTightness", "X Tightness", 1, 100, 1);
    addFloat(falloff, u, "uYTightness", "Y Tightness", 0.1, 20, 0.1);

    // Alpha
    const alpha = this.gui.addFolder("Alpha");
    addFloat(alpha, u, "uNoiseMix", "Noise Mix", 0, 1, 0.01);
    addFloat(alpha, u, "uAlphaOffset", "Offset", 0, 1, 0.01);
    addFloat(alpha, u, "uAlphaMul", "Multiply", 0.5, 5, 0.1);
    addFloat(alpha, u, "uAlphaPow", "Power", 0.5, 6, 0.1);
    addFloat(alpha, u, "uYCutPow", "Y Cut Power", 1, 40, 1);

    // Circle highlight
    const circle = this.gui.addFolder("Circle Highlight");
    addVec2(circle, u, "uCircleOffset", ["Offset X", "Offset Y"], -1, 1, 0.01);
    addFloat(circle, u, "uCircleMul", "Multiply", 0, 2, 0.05);
    addFloat(circle, u, "uCirclePow", "Power", 1, 12, 0.5);
    addFloat(circle, u, "uCircleDiv", "Divisor", 0.5, 10, 0.5);

    // Steps
    const steps = this.gui.addFolder("Quantize Steps");
    addVec3Sliders(steps, u, "uStepThresholds", ["Thresh 1", "Thresh 2", "Thresh 3"], 0, 1, 0.01);
    addVec3Sliders(steps, u, "uStepValues", ["Value 1", "Value 2", "Value 3"], 0, 1, 0.01);

    // Colors
    const colors = this.gui.addFolder("Colors");
    addColor(colors, u, "uTopHigh", "Top High");
    addColor(colors, u, "uTopLow", "Top Low");
    addColor(colors, u, "uBotHigh", "Bot High");
    addColor(colors, u, "uBotLow", "Bot Low");

    // Glow
    const glow = this.gui.addFolder("Glow");
    addColor(glow, u, "uGlowTop", "Glow Top");
    addColor(glow, u, "uGlowBot", "Glow Bot");
    addFloat(glow, u, "uGlowStrength", "Strength", 0, 4, 0.05);
    addVec2(glow, u, "uGradientRange", ["Grad From", "Grad To"], 0, 1, 0.01);

    // Pulse
    const pulse = this.gui.addFolder("Pulse");
    addFloat(pulse, u, "uPulseSpeed", "Speed", 0, 5, 0.1);
    addFloat(pulse, u, "uPulseAmount", "Amount", 0, 1, 0.01);

    // Log
    this.gui.add({ log: () => this.logValues() }, "log").name("Log to console");
  }

  destroy() {
    this.gui.destroy();
  }

  private logValues() {
    const u = this.filter.resources.fireUniforms.uniforms;
    const f = (v: Float32Array) => Array.from(v).map((x) => Math.round(x * 1000) / 1000);
    console.log(
      JSON.stringify(
        {
          noiseScale: f(u.uNoiseScale as Float32Array),
          scrollSpeed: u.uScrollSpeed,
          center: f(u.uCenter as Float32Array),
          xTightness: u.uXTightness,
          yTightness: u.uYTightness,
          noiseMix: u.uNoiseMix,
          alphaOffset: u.uAlphaOffset,
          alphaMul: u.uAlphaMul,
          alphaPow: u.uAlphaPow,
          yCutPow: u.uYCutPow,
          circleOffset: f(u.uCircleOffset as Float32Array),
          circleMul: u.uCircleMul,
          circlePow: u.uCirclePow,
          circleDiv: u.uCircleDiv,
          stepThresholds: f(u.uStepThresholds as Float32Array),
          stepValues: f(u.uStepValues as Float32Array),
          topHigh: f(u.uTopHigh as Float32Array),
          topLow: f(u.uTopLow as Float32Array),
          botHigh: f(u.uBotHigh as Float32Array),
          botLow: f(u.uBotLow as Float32Array),
          glowTop: f(u.uGlowTop as Float32Array),
          glowBot: f(u.uGlowBot as Float32Array),
          glowStrength: u.uGlowStrength,
          gradientRange: f(u.uGradientRange as Float32Array),
          pulseSpeed: u.uPulseSpeed,
          pulseAmount: u.uPulseAmount,
        },
        null,
        2,
      ),
    );
  }
}
