import type { TextureShader } from "pixi.js";
import { GlProgram, Mesh, PlaneGeometry, Shader } from "pixi.js";

interface FireShader {
  resources: {
    fireUniforms: {
      uniforms: {
        uTime: number;
      };
    };
  };
}

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

// Constants
const vec2 noiseScale = vec2(13.0, 10.0);
const float scrollSpeed = 10.0;
const vec2 center = vec2(0.5, 0.95);
const float xTightness = 40.0;
const float yTightness = 2.0;
const float noiseMix = 0.7;
const float alphaOffset = 0.1;
const float alphaMul = 2.0;
const float alphaPow = 2.0;
const float yCutPow = 20.0;
const vec2 circleOffset = vec2(0.0, 0.4);
const float circleMul = 0.8;
const float circlePow = 6.0;
const float circleDiv = 2.0;
const vec3 stepThresholds = vec3(0.99, 0.5, 0.3);
const vec3 stepValues = vec3(1.0, 0.5, 0.1);
const vec3 topHigh = vec3(1.0, 0.92, 0.6);
const vec3 topLow = vec3(0.9, 0.1, 0.0);
const vec3 botHigh = vec3(0.55, 0.4, 1.0);
const vec3 botLow = vec3(0.35, 0.0, 0.9);
const vec3 glowTop = vec3(1.0, 0.4, 0.05);
const vec3 glowBot = vec3(0.3, 0.05, 0.9);
const float glowStrength = 2.0;
const vec2 gradientRange = vec2(0.6, 1.0);
const float pulseSpeed = 0.8;
const float pulseAmount = 0.15;

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
    vec2 nUV = uv * noiseScale;
    nUV.y += uTime * scrollSpeed;
    float n = fbm(nUV);

    float pulse = noise1D(uTime * pulseSpeed) * pulseAmount + (1.0 - pulseAmount);

    float dx = uv.x - center.x;
    float dy = uv.y - center.y;
    float falloff = exp(-dx * dx * xTightness - dy * dy * yTightness) * pulse;

    float alpha = falloff * (0.5 - pow(uv.y, yCutPow));
    float c = circle(circleOffset.x, circleOffset.y, uv);
    alpha += pow(c * circleMul, circlePow) / circleDiv;
    alpha *= (n * noiseMix + (1.0 - noiseMix) * 2.0) + alphaOffset;
    alpha = pow(alpha * alphaMul, alphaPow);
    alpha = clamp(alpha, 0.0, 1.0);

    float stepped;
    if (alpha > stepThresholds.x) stepped = stepValues.x;
    else if (alpha > stepThresholds.y) stepped = stepValues.y;
    else if (alpha > stepThresholds.z) stepped = stepValues.z;
    else stepped = 0.0;

    float yGrad = smoothstep(gradientRange.x, gradientRange.y, uv.y);
    vec3 colorHigh = mix(topHigh, botHigh, yGrad);
    vec3 colorLow = mix(topLow, botLow, yGrad);
    vec3 color = mix(colorLow, colorHigh, stepped);

    float glow = alpha * glowStrength;
    vec3 glowColor = mix(glowTop, glowBot, yGrad) * glow;
    vec3 result = glowColor + color * stepped;
    float resultAlpha = max(glow, stepped);

    finalColor = vec4(result, resultAlpha);
}
`;

export class Fire extends Mesh {
  constructor(width: number, height: number) {
    const geometry = new PlaneGeometry({ width, height });
    const glProgram = GlProgram.from({ vertex, fragment, name: "fire" });
    const shader = new Shader({
      glProgram,
      resources: { fireUniforms: { uTime: { value: 0, type: "f32" } } },
    });

    super({ geometry, shader: shader as unknown as TextureShader });
    this.pivot.set(width / 2, height / 2);
  }

  get time(): number {
    return (this.shader as unknown as FireShader).resources.fireUniforms.uniforms.uTime ?? 0;
  }

  set time(value: number) {
    if (this.shader) (this.shader as unknown as FireShader).resources.fireUniforms.uniforms.uTime = value;
  }
}
