import { GlProgram, Mesh, PlaneGeometry, Shader } from "pixi.js";

const vertex = `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main(void) {
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    vUV = aUV;
}
`;

const fragment = `
in vec2 vUV;
out vec4 finalColor;

uniform float uTime;

// Noise
uniform vec2 uNoiseScale;
uniform float uScrollSpeed;

// Falloff
uniform vec2 uCenter;
uniform float uXTightness;
uniform float uYTightness;

// Alpha shaping
uniform float uNoiseMix;
uniform float uAlphaOffset;
uniform float uAlphaMul;
uniform float uAlphaPow;
uniform float uYCutPow;

// Circle highlight
uniform vec2 uCircleOffset;
uniform float uCircleMul;
uniform float uCirclePow;
uniform float uCircleDiv;

// Step thresholds and values
uniform vec3 uStepThresholds;
uniform vec3 uStepValues;

// Colors
uniform vec3 uTopHigh;
uniform vec3 uTopLow;
uniform vec3 uBotHigh;
uniform vec3 uBotLow;
uniform vec3 uGlowTop;
uniform vec3 uGlowBot;
uniform float uGlowStrength;
uniform vec2 uGradientRange;

// Pulse
uniform float uPulseSpeed;
uniform float uPulseAmount;

float hash1(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float noise1D(float t) {
    float i = floor(t);
    float f = fract(t);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash1(i), hash1(i + 1.0), u);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 3; i++) {
        v += a * noise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float circle(float dx, float dy, vec2 uv) {
    float cx = (0.5 - uv.x + dx) * 2.0;
    cx = max(0.0, 1.0 - cx * cx);
    float cy = (0.5 - uv.y + dy) * 2.0;
    cy = max(0.0, 1.0 - cy * cy);
    return pow(cx * cy, 2.0);
}

void main() {
    vec2 uv = vUV;
    vec2 nUV = uv * uNoiseScale;
    nUV.y += uTime * uScrollSpeed;
    float n = fbm(nUV);

    float pulse = noise1D(uTime * uPulseSpeed) * uPulseAmount + (1.0 - uPulseAmount);

    float dx = (uv.x - uCenter.x);
    float dy = (uv.y - uCenter.y);
    float falloff = exp(-dx * dx * uXTightness - dy * dy * uYTightness) * pulse;

    float alpha = falloff * (0.5 - pow(uv.y, uYCutPow));
    float c = circle(uCircleOffset.x, uCircleOffset.y, uv);
    alpha += pow(c * uCircleMul, uCirclePow) / uCircleDiv;
    alpha *= (n * uNoiseMix + (1.0 - uNoiseMix) * 2.0) + uAlphaOffset;
    alpha = pow(alpha * uAlphaMul, uAlphaPow);
    alpha = clamp(alpha, 0.0, 1.0);

    float stepped;
    if (alpha > uStepThresholds.x) stepped = uStepValues.x;
    else if (alpha > uStepThresholds.y) stepped = uStepValues.y;
    else if (alpha > uStepThresholds.z) stepped = uStepValues.z;
    else stepped = 0.0;

    float yGrad = smoothstep(uGradientRange.x, uGradientRange.y, uv.y);
    vec3 colorHigh = mix(uTopHigh, uBotHigh, yGrad);
    vec3 colorLow = mix(uTopLow, uBotLow, yGrad);
    vec3 color = mix(colorLow, colorHigh, stepped);

    float glow = alpha * uGlowStrength;
    vec3 glowColor = mix(uGlowTop, uGlowBot, yGrad) * glow;
    vec3 result = glowColor + color * stepped;
    float resultAlpha = max(glow, stepped);

    finalColor = vec4(result, resultAlpha);
}
`;

export interface FireFilterOptions {
  noiseScale?: [number, number];
  scrollSpeed?: number;
  center?: [number, number];
  xTightness?: number;
  yTightness?: number;
  noiseMix?: number;
  alphaOffset?: number;
  alphaMul?: number;
  alphaPow?: number;
  yCutPow?: number;
  circleOffset?: [number, number];
  circleMul?: number;
  circlePow?: number;
  circleDiv?: number;
  stepThresholds?: [number, number, number];
  stepValues?: [number, number, number];
  topHigh?: [number, number, number];
  topLow?: [number, number, number];
  botHigh?: [number, number, number];
  botLow?: [number, number, number];
  glowTop?: [number, number, number];
  glowBot?: [number, number, number];
  glowStrength?: number;
  gradientRange?: [number, number];
  pulseSpeed?: number;
  pulseAmount?: number;
}

const defaults: Required<FireFilterOptions> = {
  noiseScale: [13, 10],
  scrollSpeed: 10,
  center: [0.5, 0.95],
  xTightness: 40,
  yTightness: 2,
  noiseMix: 0.7,
  alphaOffset: 0.1,
  alphaMul: 2,
  alphaPow: 2,
  yCutPow: 20,
  circleOffset: [0, 0.4],
  circleMul: 0.8,
  circlePow: 6,
  circleDiv: 2,
  stepThresholds: [0.99, 0.5, 0.3],
  stepValues: [1, 0.5, 0.1],
  topHigh: [1, 0.92, 0.6],
  topLow: [0.9, 0.1, 0],
  botHigh: [0.55, 0.4, 1],
  botLow: [0.35, 0, 0.9],
  glowTop: [1, 0.4, 0.05],
  glowBot: [0.3, 0.05, 0.9],
  glowStrength: 2,
  gradientRange: [0.6, 1],
  pulseSpeed: 0.8,
  pulseAmount: 0.15,
};

export { defaults as fireFilterDefaults };

export class FireFilter extends Mesh {
  constructor(options: FireFilterOptions = {}) {
    const o = { ...defaults, ...options };
    const geometry = new PlaneGeometry({ width: 100, height: 100 });
    const glProgram = GlProgram.from({ vertex, fragment, name: "fire-filter" });

    const shader = new Shader({
      glProgram,
      resources: {
        fireUniforms: {
          uTime: { value: 0, type: "f32" },
          uNoiseScale: { value: new Float32Array(o.noiseScale), type: "vec2<f32>" },
          uScrollSpeed: { value: o.scrollSpeed, type: "f32" },
          uCenter: { value: new Float32Array(o.center), type: "vec2<f32>" },
          uXTightness: { value: o.xTightness, type: "f32" },
          uYTightness: { value: o.yTightness, type: "f32" },
          uNoiseMix: { value: o.noiseMix, type: "f32" },
          uAlphaOffset: { value: o.alphaOffset, type: "f32" },
          uAlphaMul: { value: o.alphaMul, type: "f32" },
          uAlphaPow: { value: o.alphaPow, type: "f32" },
          uYCutPow: { value: o.yCutPow, type: "f32" },
          uCircleOffset: { value: new Float32Array(o.circleOffset), type: "vec2<f32>" },
          uCircleMul: { value: o.circleMul, type: "f32" },
          uCirclePow: { value: o.circlePow, type: "f32" },
          uCircleDiv: { value: o.circleDiv, type: "f32" },
          uStepThresholds: { value: new Float32Array(o.stepThresholds), type: "vec3<f32>" },
          uStepValues: { value: new Float32Array(o.stepValues), type: "vec3<f32>" },
          uTopHigh: { value: new Float32Array(o.topHigh), type: "vec3<f32>" },
          uTopLow: { value: new Float32Array(o.topLow), type: "vec3<f32>" },
          uBotHigh: { value: new Float32Array(o.botHigh), type: "vec3<f32>" },
          uBotLow: { value: new Float32Array(o.botLow), type: "vec3<f32>" },
          uGlowTop: { value: new Float32Array(o.glowTop), type: "vec3<f32>" },
          uGlowBot: { value: new Float32Array(o.glowBot), type: "vec3<f32>" },
          uGlowStrength: { value: o.glowStrength, type: "f32" },
          uGradientRange: { value: new Float32Array(o.gradientRange), type: "vec2<f32>" },
          uPulseSpeed: { value: o.pulseSpeed, type: "f32" },
          uPulseAmount: { value: o.pulseAmount, type: "f32" },
        },
      },
    });

    // biome-ignore lint/suspicious/noExplicitAny: PixiJS Shader type mismatch with Mesh
    super({ geometry, shader: shader as any });

    // Center the pivot point
    this.pivot.set(50, 50);
  }

  get time(): number {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing shader uniforms
    return ((this.shader as any).resources.fireUniforms.uniforms.uTime as number) ?? 0;
  }

  set time(value: number) {
    // biome-ignore lint/suspicious/noExplicitAny: Accessing shader uniforms
    if (this.shader) (this.shader as any).resources.fireUniforms.uniforms.uTime = value;
  }
}
