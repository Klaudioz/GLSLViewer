uniform float t;
uniform vec2 r;
#define FC gl_FragCoord

// HSV to RGB conversion function
vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

void main() {
    vec4 o = vec4(0.0);
    float i,e,R,s;
    vec3 q,p,d=vec3(FC.xy/r+vec2(-.5,.4),1);
    for(q.zy--;i++<99.;){
        o.rgb+=hsv(e*R,-.6,e/12.);
        s=1.;
        p=q+=d*e*R*.3;
        p=vec3(log2(R=length(p))-t*.5,exp2(-p.z/R-.01),atan(p.y,p.x)*s+cos(t)*.03);
        for(e=--p.y;s<9e2;s+=s)
            e+=(dot(sin(p.zzy*s)-.53,.5-sin(p.yzx*s)))/s*.2;
    }
    gl_FragColor = o;
}
