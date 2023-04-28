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
    float color = circle(vUv, 0.9);
    gl_FragColor = vec4(0.3,0.2,0.1, color);
}