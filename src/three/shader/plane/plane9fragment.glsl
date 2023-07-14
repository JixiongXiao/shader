varying vec2 vUv;
uniform float uelapseTime;
uniform sampler2D uTexture;
uniform vec3 uColor;

#define PI 3.1415

void rotate2d(inout vec2 v, float a) {
    mat2 m = mat2(cos(a), -sin(a), sin(a), cos(a));
    v = m * v;
}

float arrow(vec2 av) {
    
    float line1 = length(av - vec2(0., clamp(av.y, -0.2, 0.2)));
    line1 = smoothstep(0.06, 0.05, line1);
    
    vec2 rav = av;
    rav.y += 0.23;
    rotate2d(rav, PI/4.);
    
    float line2 = length(rav - vec2(0., clamp(rav.y, 0., 0.2)));
    line2 = smoothstep(0.06, 0.05, line2);

    rotate2d(rav, -PI/2.);
    float line3 = length(rav - vec2(0., clamp(rav.y, 0., 0.2)));
    line3 = smoothstep(0.06, 0.05, line3);
    
    return clamp(line1 + line2 + line3, 0., 1.);
}


void main()
{

    vec2 uv = (vUv * 2.0)-1.0;

    vec3 col = vec3(0);

    float time = fract(uelapseTime / 1000.) * 600.;
    
    float at = fract(time); // 0..1
    at -= 0.5;
	at *= at * at;
    
    vec2 av = uv;
    av.y += at * 6.;
	float a = arrow(av);
 // float a = arrow(uv); // 不动的箭头
    
    float cir = length(uv);
    cir = smoothstep(0.36, 0.35, cir);
    
    float ca = fract(time); // 0..1
    ca = (ca * 6. - 1.);
    ca *= -ca;
    ca += 1.;
    ca /= 2.;
    ca = clamp(ca, 0., 1.);
    float cir2 = length(uv - vec2(0., .65 + ca/12.));
    cir2 = smoothstep(0.26 + ca/1., 0.15 + ca/4., cir2);
    
    
    float ca2 = fract(time); // 0..1
    ca2 = (ca2 * 6. - 5.);
    ca2 *= -ca2;
    ca2 += 1.;
    ca2 /= 2.;
    ca2 = clamp(ca2, 0., 1.);
    float cir3 = length(uv - vec2(0., -.65 + ca2/12.));
    cir3 = smoothstep(0.26 + ca2/1., 0.15 + ca2/4., cir3);
	    
    // col = vec3(a);
    col = vec3(cir - a - cir2 - cir3);
    
    gl_FragColor = vec4(col,1.0);
}


// varying vec2 vUv;
// uniform float uelapseTime;
// uniform sampler2D uTexture;
// uniform vec3 uColor;

// #define PI 3.1415

// void rotate2d(inout vec2 v, float a) {
//     mat2 m = mat2(cos(a), -sin(a), sin(a), cos(a));
//     v = m * v;
// }

// float arrow(vec2 av) {
    
//     float line1 = length(av - vec2(clamp(av.x, -0.2, 0.2), 0.));
//     line1 = smoothstep(0.06, 0.05, line1);
    
//     vec2 rav = av;
//     rav.x -= 0.23;
//     rotate2d(rav, PI/1.4);
    
//     float line2 = length(rav - vec2(clamp(rav.x, 0., 0.2), 0.));
//     line2 = smoothstep(0.06, 0.05, line2);

//     rotate2d(rav, -PI * 1.4 );
//     float line3 = length(rav - vec2(clamp(rav.x, 0., 0.2),0.));
//     line3 = smoothstep(0.06, 0.05, line3);
    
//     return clamp(line1 + line2 + line3 , 0., 1.);
// }


// void main()
// {

//     vec2 uv = (vUv * 2.0)-1.0;

//     vec3 col = vec3(0);

//     float time = fract(uelapseTime / 1000.) * 600.;
    
//     float at = fract(time); // 0..1
//     at -= 0.5;
// 	at *= at * at;
    
//     vec2 av = uv;
//     av.x -= at * 6.;
// 	// float a = arrow(av);
//  float a = arrow(uv); // 不动的箭头
    
//     float cir = length(uv);
//     cir = smoothstep(0.36, 0.35, cir);
    
//     float ca = fract(time); // 0..1
//     ca = (ca * 6. - 1.);
//     ca *= -ca;
//     ca += 1.;
//     ca /= 2.;
//     ca = clamp(ca, 0., 1.);
//     float cir2 = length(uv - vec2(0., .65 + ca/12.));
//     cir2 = smoothstep(0.26 + ca/1., 0.15 + ca/4., cir2);
    
    
//     float ca2 = fract(time); // 0..1
//     ca2 = (ca2 * 6. - 5.);
//     ca2 *= -ca2;
//     ca2 += 1.;
//     ca2 /= 2.;
//     ca2 = clamp(ca2, 0., 1.);
//     float cir3 = length(uv - vec2(0., -.65 + ca2/12.));
//     cir3 = smoothstep(0.26 + ca2/1., 0.15 + ca2/4., cir3);
	    
//     col = vec3(a);
//     // col = vec3(cir - a - cir2 - cir3);
    
//     gl_FragColor = vec4(col,1.0);
// }


