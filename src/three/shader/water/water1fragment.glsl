// varying vec3 vPosition;

// varying vec2 vUv;


// void main() {
//     gl_FragColor = vec4(1.0,1.0,0.0,1.0);

// }

// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
uniform float uelapseTime;
uniform vec3 uHighColor;
uniform vec3 uLowColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}


void main() {
    vec2 st = vUv;
    // st.x *= u_resolution.x/u_resolution.y;
    vec3 color = vec3(0.0);
    vec2 pos = vec2(st*3.);

    float DF = 0.0;

    // Add a random position
    float a = 0.0;
    vec2 vel = vec2(uelapseTime*.1);
    DF += snoise(pos+vel)*.25+.4;

    // Add a random position
    float tensity = 0.4; // 水纹密度系数
    a = snoise(pos*vec2(cos(uelapseTime*0.05),sin(uelapseTime*0.05))*tensity)*3.1415;
    vel = vec2(cos(a),sin(a));
    DF += snoise(pos+vel)*.25+.25;

    vec3 opacity = vec3( smoothstep(.7,.75,fract(DF)) );
    vec3 mixColor = mix(uLowColor, uHighColor, opacity);
    // gl_FragColor = vec4(0.1,0.1,0.8,1.0 - opacity);
    gl_FragColor = vec4(mixColor,0.8);
}