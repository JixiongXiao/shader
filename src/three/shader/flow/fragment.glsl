varying vec2 vUv;
uniform float uelapseTime;
uniform sampler2D uTexture;


// 无背景图水纹
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 1.4;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    
    vec2 coords1 = rotate2d( .9*PI ) * uv;
    vec2 coords2 = rotate2d( .06*PI ) * uv;
    
    coords1.y += uelapseTime*0.1;
    coords1.x -= uelapseTime*0.3;
    
    coords2.y += uelapseTime*0.1;
    coords2.x -= uelapseTime*0.2;
    
    float wave1 = fbm(vec2(coords1.x*30.0,coords1.y*3.0));
	float wave2 = fbm(vec2(coords2.x*30.0,coords2.y*3.0));
    
    float combinedWaves = mix(wave1,wave2,0.5);
    
    combinedWaves = pow(combinedWaves,2.0);
    
    gl_FragColor = vec4(combinedWaves);
}
