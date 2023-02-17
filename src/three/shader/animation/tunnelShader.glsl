// 科技风建筑外墙

// #ifdef GL_ES
// precision mediump float;
// #endif

// uniform vec2 uResolution;
// uniform float uTime;
// varying vec2 vUv;

// float random (in float x) {
//     return fract(sin(x)*1e4);
// }

// float random (in vec2 st) {
//     return fract(sin(dot(st.xy, vec2(52.9898,18.233)))* 43758.5453123);
// }

// float pattern(vec2 st, vec2 v, float t) {
//     vec2 p = floor(st+v);
//     return step(t, random(50.+p*.00001)+random(p.y)*0.5 );
// }

// void main() {
//     vec2 st = vUv;
//     // st.y *= uResolution.y/uResolution.x;

//     vec2 grid = vec2(15.0,16.0); // x轴的数量和y轴的数量，模型越高时Y轴数量要越多，否则移动速度会过快
//     st *= grid;

//     vec2 ipos = floor(st);  // integer
//     vec2 fpos = fract(st);  // fraction

//     vec2 vel = vec2(uTime*.5*max(grid.y,grid.x)); // time
//     vel *= vec2(1.0,0.0) * random(0.5+ipos.x); // direction

//     // Assign a random value base on the integer coord
//     vec2 offset = vec2(0.0,0.1);

//     vec3 color = vec3(0.);
//     color.r = pattern(st-offset,vel,0.998);
//     color.g = pattern(st,vel,0.998);
//     color.b = pattern(st+offset,vel,0.998);

//     // Margins
//     color *= step(0.2,fpos.x);

//     gl_FragColor = vec4(0.1, vUv.y, 0.8,color);
// }



// varying vec2 vUv; 
// uniform float uelapseTime; 
// void main()
// {
// 	vec2 uv = vUv;
// 	uv.y -= 0.5;
//     float wave1 = 1.0 - pow(abs(sin(uv.y * 1.0 +uelapseTime) *0.3 + uv.x),0.1);
//     float wave2 = 1.0 - pow(abs(sin(uv.y * 4.0 +uelapseTime) *0.15 + uv.x),0.1);
//     float wave3 = 1.0 - pow(abs(sin(uv.y * 2.0 +uelapseTime*1.8) *0.1 + uv.x),0.12);
//     float wave4 = 1.0 - pow(abs(sin(uv.y * 13.0 +uelapseTime*5.1) *0.22 + uv.x),0.12);
//     vec3 color = 
//     vec3(wave1,wave1*0.7,wave1*0.8)
//        + vec3(wave2*0.5,wave2,wave2*0.9)
//        + vec3(wave3*0.2,wave3*0.7,wave3)
//        + vec3(wave4,wave4*.1,wave4*0.85);
//     gl_FragColor = vec4(vec3(color),0.5);
// }

const float PI = 3.14159;
varying vec2 vUv; 
uniform float uelapseTime; 
void main()
{
    vec2 uv = vUv;
    float d = 0.0;
    int n = 18;
    vec3 col = vec3(0.);
    for (int i = 0; i < n; i++) {
        float findex = float(i) / float(n);
        float speed = 1.0 + 1.0 - findex;
        vec2 uv2 = vec2(uv.x, min(1., max(0., uv.x )));
        float offset = findex * PI + 0.3 * uelapseTime * (0.2 + findex * 0.3);
        float f = 0.5 * (1. + sin(offset));
        float d = abs(f - uv2.x);
        float fcol = pow(1. - pow(d, 0.4), 3.5 + 4. * 0.5 * (1. + sin(uelapseTime * (1. + findex) + 4. * findex * PI)));
        float r = 360. * findex * fcol;
        float b = i % 2 == 1 ? fcol * 0.9 : 0.;
        col += vec3(b, fcol * findex, fcol);
    }
    gl_FragColor = vec4( col, 1.0 );
}

//备份
// const float PI = 3.14159;
// varying vec2 vUv; 
// uniform float uelapseTime; 
// void main()
// {
//     vec2 uv = vUv;
//     float d = 0.0;
//     int n = 18;
//     vec3 col = vec3(0.);
//     for (int i = 0; i < n; i++) {
//         float findex = float(i) / float(n);
//         float speed = 1.0 + 1.0 - findex;
//         vec2 uv2 = vec2(uv.x, min(1., max(0., uv.x + 0.1 * sin(uv.y * 2. * PI + uelapseTime * speed + findex * 10.1))));
//         float offset = findex * PI + 0.3 * uelapseTime * (0.2 + findex * 0.3);
//         float f = 0.5 * (1. + sin(offset));
//         float d = abs(f - uv2.x);
//         float fcol = pow(1. - pow(d, 0.4), 3.5 + 4. * 0.5 * (1. + sin(uelapseTime * (1. + findex) + 4. * findex * PI)));
//         float r = 360. * findex * fcol;
//         float b = i % 2 == 1 ? fcol * 0.9 : 0.;
//         col += vec3(b, fcol * findex, fcol);
//     }
//     gl_FragColor = vec4( col, 1.0 );
// }