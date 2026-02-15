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
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vPosition;

    // FBM cloud noise scrolling upward
    vec2 nUV = uv * vec2(13.0, 10.0);
    nUV.y += uTime * 2.0;
    float n = fbm(nUV + vec2(0.0, uTime * 0.3));

    // Exponential falloff: strong at bottom center, fading to sides and top
    float dx = (uv.x - 0.5);
    float dy = (uv.y - 0.95);
    float xFalloff = exp(-dx * dx * 30.0);
    float yFalloff = exp(-dy * dy * 2.0);
    float falloff = xFalloff * yFalloff;

    // Combine noise with falloff, but keep a lit core
    float alpha = falloff * (0.5 - pow(uv.y, 20.0));
    // float alpha = falloff;
    float p = 0.6;
    alpha = alpha * (n * p + (1.0 - p) * 2.0);
    alpha = pow(alpha * 2.0, 2.0);
    alpha = clamp(alpha, 0.0, 1.0);

    // Quantize to 3 steps
    float stepped;
    if (alpha > 0.8) stepped = 1.0;
    else if (alpha > 0.5) stepped = 0.5;
    else if (alpha > 0.3) stepped = 0.1;
    else stepped = 0.0;

    // Interpolate from yellowish-light (high) to red (low)
    vec3 yellowLight = vec3(1.0, 0.92, 0.6);
    vec3 red = vec3(0.9, 0.1, 0.0);
    vec3 color = mix(red, yellowLight, stepped);

    finalColor = vec4(color * stepped, stepped);
    // finalColor = vec4(n, n, n, 1.0);
    // finalColor = vec4(alpha, alpha, alpha, 1.0);
}
`;

export class FireFilter extends Filter {
  constructor() {
    const glProgram = GlProgram.from({ vertex, fragment, name: "fire-filter" });
    super({
      glProgram,
      resources: {
        fireUniforms: {
          uTime: { value: 0, type: "f32" },
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
