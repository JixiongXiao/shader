varying vec2 vUv;
uniform float uelapseTime;
uniform sampler2D uTexture;
uniform vec3 uColor;

float box(vec2 _st, vec2 _size){
    _size = vec2(0.5)-_size*0.5;
    vec2 uv = smoothstep(_size,_size+vec2(1e-4),_st);
    uv *= smoothstep(_size,_size+vec2(1e-4),vec2(1.0)-_st);
    return uv.x*uv.y;
}

float circle(vec2 _st, float _radius){
    vec2 pos = vec2(0.5)-_st;
    return smoothstep(1.0-_radius,1.0-_radius+_radius*0.2,1.-dot(pos,pos)*3.14);
}

void main()
{
    // vec3 color = vec3(0.0);
    // float color = box(vUv, vec2(0.9));
    // gl_FragColor = vec4(0.3,0.2,0.1, 1.0 - color);
    // float color = circle(vUv, 0.9);
    // gl_FragColor = vec4(0.3,0.2,0.1, color);
                          vec3 color1 = vec3(0.25882353,0.392156863,0.8627451);
                          vec3 color2 = vec3(0.4967, 0.3216, 0.8745);
                          vec3 colorL = vec3(0.,0.,1.);
                          vec2 center = vec2(0.5,0.5);
                          float dis = distance(center,vUv);
                          vec3 color3 = mix(color1,color2,sqrt(dis));
                          gl_FragColor = vec4(color3,0.54);
                          
}