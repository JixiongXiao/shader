// 科技风建筑外墙

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uelapseTime;
varying vec2 vUv;

float random (in float x) {
    return fract(sin(x)*1e4);
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(52.9898,18.233)))* 43758.5453123);
}

float pattern(vec2 st, vec2 v, float t) {
    vec2 p = floor(st+v);
    return step(t, random(50.+p*.00001)+random(p.y)*0.5 );
}

void main() {
    vec2 st = vUv;
    // st.y *= uResolution.y/uResolution.x;

    vec2 grid = vec2(50.0,60.0); // x轴的数量和y轴的数量，模型越高时Y轴数量要越多，否则移动速度会过快
    st *= grid;

    vec2 ipos = floor(st);  // integer
    vec2 fpos = fract(st);  // fraction

    vec2 vel = vec2(uelapseTime*.5*max(grid.y,grid.x)); // time
    vel *= vec2(0.0,-1.0) * random(0.5+ipos.x); // direction

    // Assign a random value base on the integer coord
    vec2 offset = vec2(0.0,0.1);

    vec3 color = vec3(0.);
    color.r = pattern(st-offset,vel,0.998);
    color.g = pattern(st,vel,0.998);
    color.b = pattern(st+offset,vel,0.998);

    // Margins
    color *= step(0.2,fpos.x);

    gl_FragColor = vec4(0.1, vUv.y, 0.8,color);
}


// 下面代码为初始备份
// #ifdef GL_ES
// precision mediump float;
// #endif

// uniform vec2 u_resolution;
// uniform vec2 u_mouse;
// uniform float u_time;

// float random (in float x) {
//     return fract(sin(x)*1e4);
// }

// float random (in vec2 st) {
//     return fract(sin(dot(st.xy, vec2(52.9898,18.233)))* 43758.5453123);
// }

// float pattern(vec2 st, vec2 v, float t) {
//     vec2 p = floor(st+v);
//     return step(t, random(100.+p*.000001)+random(p.y)*0.5 );
// }

// void main() {
//     vec2 st = gl_FragCoord.xy/u_resolution.xy;
//     st.y *= u_resolution.x/u_resolution.y;

//     vec2 grid = vec2(50.0,100.);
//     st *= grid;

//     vec2 ipos = floor(st);  // integer
//     vec2 fpos = fract(st);  // fraction

//     vec2 vel = vec2(u_time*.5*max(grid.y,grid.x)); // time
//     vel *= vec2(0.0,-1.0) * random(0.5+ipos.x); // direction

//     // Assign a random value base on the integer coord
//     vec2 offset = vec2(0.0,0.1);

//     vec3 color = vec3(0.);
//     color.r = pattern(st-offset,vel,0.998);
//     color.g = pattern(st,vel,0.998);
//     color.b = pattern(st+offset,vel,0.998);

//     // Margins
//     color *= step(0.2,fpos.x);

//     gl_FragColor = vec4(1.0-color,1.0);
// }