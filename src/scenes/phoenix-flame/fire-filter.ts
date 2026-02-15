import { Filter, GlProgram } from "pixi.js";

const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vPosition;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
    vPosition = aPosition;
}
`;

const fragment = `
in vec2 vTextureCoord;
in vec2 vPosition;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;

// Colors: top and bottom palettes
uniform vec3 uTopHigh;
uniform vec3 uTopLow;
uniform vec3 uBotHigh;
uniform vec3 uBotLow;
uniform vec3 uGlowTop;
uniform vec3 uGlowBot;
uniform float uGlowStrength;
uniform vec2 uGradientRange;

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

float circle(float dx, float dy) {
    vec2 uv = vPosition;

    float cx = (0.5 - uv.x + dx) * 2.0;
    cx = max(0.0, 1.0 - cx * cx);

    float cy = (0.5 - uv.y + dy) * 2.0;
    cy = max(0.0, 1.0 - cy * cy);

    return pow(cx * cy, 2.0);
}

void main() {
    vec2 uv = vPosition;

    // FBM cloud noise scrolling upward
    vec2 nUV = uv * vec2(13.0, 10.0);
    nUV.y += uTime * 10.0;
    float n = fbm(nUV);

    // Exponential falloff: strong at bottom center, fading to sides and top
    float dx = (uv.x - 0.5);
    float dy = (uv.y - 0.95);
    float xFalloff = exp(-dx * dx * 40.0);
    float yFalloff = exp(-dy * dy * 2.0);
    float falloff = xFalloff * yFalloff;

    // Combine noise with falloff, but keep a lit core
    float alpha = falloff * (0.5 - pow(uv.y, 20.0));
    float p = 0.7;

    float c = circle(0.0, 0.4);
    alpha += pow(c * 0.8, 6.0) / 2.0;
    alpha *= (n * p + (1.0 - p) * 2.0) + 0.1;
    alpha = pow(alpha * 2.0, 2.0);
    alpha = clamp(alpha, 0.0, 1.0);

    // Quantize to 3 steps
    float stepped;
    if (alpha > 0.8) stepped = 1.0;
    else if (alpha > 0.5) stepped = 0.5;
    else if (alpha > 0.3) stepped = 0.1;
    else stepped = 0.0;

    // Vertical gradient: bottom palette blends into top palette
    float yGrad = smoothstep(uGradientRange.x, uGradientRange.y, uv.y);

    vec3 colorHigh = mix(uTopHigh, uBotHigh, yGrad);
    vec3 colorLow = mix(uTopLow, uBotLow, yGrad);
    vec3 color = mix(colorLow, colorHigh, stepped);

    // Glow transitions with gradient too
    float glow = alpha * uGlowStrength;
    vec3 glowColor = mix(uGlowTop, uGlowBot, yGrad) * glow;
    vec3 result = glowColor + color * stepped;
    float resultAlpha = max(glow, stepped);

    finalColor = vec4(result, resultAlpha);
    // finalColor = vec4(n, n, n, 1.0);
    // finalColor = vec4(alpha, alpha, alpha, 1.0);
    // finalColor = vec4(stepped, stepped, stepped, 1.0);
}
`;

type Vec3 = [number, number, number];

export interface FireFilterOptions {
  topHigh?: Vec3;
  topLow?: Vec3;
  botHigh?: Vec3;
  botLow?: Vec3;
  glowTop?: Vec3;
  glowBot?: Vec3;
  glowStrength?: number;
  gradientRange?: [number, number];
}

export class FireFilter extends Filter {
  constructor(options: FireFilterOptions = {}) {
    const glProgram = GlProgram.from({ vertex, fragment, name: "fire-filter" });
    super({
      glProgram,
      resources: {
        fireUniforms: {
          uTime: { value: 0, type: "f32" },
          uTopHigh: { value: new Float32Array(options.topHigh ?? [1, 0.92, 0.6]), type: "vec3<f32>" },
          uTopLow: { value: new Float32Array(options.topLow ?? [0.9, 0.1, 0]), type: "vec3<f32>" },
          uBotHigh: { value: new Float32Array(options.botHigh ?? [0.55, 0.4, 1]), type: "vec3<f32>" },
          uBotLow: { value: new Float32Array(options.botLow ?? [0.35, 0.0, 0.9]), type: "vec3<f32>" },
          uGlowTop: { value: new Float32Array(options.glowTop ?? [1, 0.4, 0.05]), type: "vec3<f32>" },
          uGlowBot: { value: new Float32Array(options.glowBot ?? [0.3, 0.05, 0.9]), type: "vec3<f32>" },
          uGlowStrength: { value: options.glowStrength ?? 0.7, type: "f32" },
          uGradientRange: { value: new Float32Array(options.gradientRange ?? [0.6, 1.0]), type: "vec2<f32>" },
        },
      },
    });
  }

  get time() {
    return this.resources.fireUniforms.uniforms.uTime as number;
  }

  set time(value: number) {
    this.resources.fireUniforms.uniforms.uTime = value;
  }
}
