uniform float time;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec3 color = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0.0, 2.0, 4.0));
    gl_FragColor = vec4(color, 1.0);
}
