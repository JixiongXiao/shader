#include <common>
varying vec2 vUv;
uniform float uelapseTime;
uniform sampler2D uTexture;
uniform vec3 uColor;



void main()
{
    vec2 nSt = vUv * 2.0 - 1.0;
    vec3 co = vec3(0.9,0.9,0.9);
    float d = luminance(co);
    // gl_FragColor = vec4(d,d,d, 1.0);

    gl_FragColor = vec4(d,d,d, abs(nSt.x));
    

    
                          
}