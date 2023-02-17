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
        vec2 uv2 = vec2(uv.x, min(1., max(0.0, uv.y)));
        float offset = 3. * findex * (PI/2.0) + 0.3 * uelapseTime * (0.2 + findex * 0.3);
        float f = 0.5 * (1. + sin(offset));
        float d = abs(f - uv2.y);
        float fcol = pow(1. - pow(d, 0.4), 3.5 + 4. * 0.5 * (1. + sin(uelapseTime * (1. + findex) + 4. * findex * PI)));
        float r = 360. * findex * fcol;
        float b = i % 2 == 1 ? fcol * 0.9 : 0.;
        col += vec3(b, fcol * findex, fcol);
    }
    gl_FragColor = vec4( col, 1.0 );
}
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
//         vec2 uv2 = vec2(uv.x, min(1., max(0., uv.y + 0.1 * sin(uv.x * 2. * PI + uelapseTime * speed + findex * 10.1))));
//         float offset = 3. * findex * PI + 0.3 * uelapseTime * (0.2 + findex * 0.3);
//         float f = 0.5 * (1. + sin(offset));
//         float d = abs(f - uv2.y);
//         float fcol = pow(1. - pow(d, 0.4), 3.5 + 4. * 0.5 * (1. + sin(uelapseTime * (1. + findex) + 4. * findex * PI)));
//         float r = 360. * findex * fcol;
//         float b = i % 2 == 1 ? fcol * 0.9 : 0.;
//         col += vec3(b, fcol * findex, fcol);
//     }
//     gl_FragColor = vec4( col, 1.0 );
// }