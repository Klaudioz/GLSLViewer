uniform float t;
uniform vec2 r;
uniform float speed;
uniform float hue_shift;
uniform float saturation;
uniform float brightness;
uniform float shape_scale;
#define FC gl_FragCoord

// HSV to RGB conversion function
vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h + hue_shift) + K.xyz) * 6.0 - K.www);
    return v * brightness * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s * saturation);
}

void main() {
    vec4 o = vec4(0.0);
    float i = 0.0;
    float e = 0.0;
    float R = 0.0;
    float s = 0.0;
    vec3 q = vec3(0.0);
    vec3 p;
    vec3 d = vec3(FC.xy/r+vec2(-.5,.4),1);

    for(q.zy = vec2(-1.0); i < 99.0; i++) {
        o.rgb += hsv(e*R,-.6,e/12.);
        s = 1.0;
        p = q += d*e*R*.3;
        p = vec3(log2(R=length(p))-t*speed*.5,exp2(-p.z/R-.01),atan(p.y,p.x)*s+cos(t*speed)*.03);
        for(e = p.y-1.0; s < 900.0; s += s) {
            e += (dot(sin(p.zzy*s*shape_scale)-.53,.5-sin(p.yzx*s*shape_scale)))/s*.2;
        }
    }
    gl_FragColor = o;
}
