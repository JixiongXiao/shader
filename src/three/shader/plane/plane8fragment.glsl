#define PI 3.14159265359
#define TWO_PI 6.28318530718
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
// 多边形 N代表边数
float polygon(vec2 _st,int num){
        int N = num;
    vec2 nSt = vec2(_st.x * 2.0 - 1.0,_st.y*2.0 - 1.0);
  float a = atan(nSt.x,nSt.y) + PI,
        r = TWO_PI  / float(N),
        d = cos(floor(0.5 + a / r) * r - a) * length(nSt);
    return smoothstep(0.41,0.4,d);

}
// 边缘带模糊
float triangle(vec2 _st){
        int N = 3;
    vec2 nSt = vec2(_st.x * 2.0 - 1.0,_st.y*2.0 - 1.0);
    nSt *= 0.89;
    nSt.y -= 0.02;
  float a = atan(nSt.x,nSt.y) + PI,
        r = TWO_PI  / float(N),
        d = cos(floor(0.5 + a / r) * r - a) * length(nSt);
    return smoothstep(0.45,0.4,d);

}
void main()
{
    // vec3 color = vec3(0.0);
    // float color = box(vUv, vec2(0.9));
    // gl_FragColor = vec4(0.3,0.2,0.1, 1.0 - color);
    // float color = circle(vUv, 0.6);
    float color = polygon(vUv,3);
    // float color = triangle(vUv);
    gl_FragColor = vec4(color,0.2,0.1, 1.0);
}