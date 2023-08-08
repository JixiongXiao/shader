varying vec2 vUv;
uniform float uelapseTime;
uniform sampler2D uTexture;
uniform vec3 uColor;

float circle(vec2 _st, float _radius){
    vec2 pos = vec2(0.5)-_st;
    return smoothstep(1.0-_radius,1.0-_radius+_radius*0.2,1.-dot(pos,pos)*3.14);
}

void main()
{
    vec4 textureColor = texture2D(uTexture,vUv); //采样
    float a = 6.; // 圆圈数量，a越大圆圈数量越多，圆圈宽度越小
    float t = 2.0; // 时间系数 越大圆圈阔算速度越快
	vec2 uv = vUv * a;
    float alpha = circle(vUv, 0.85); // 正方形四角透明
    float dt = sin(mod(length((uv - vec2(0.5 * a, 0.5 * a)) * 1.) - uelapseTime * t, 3.14));
    float circle = (cos(mod(uv.x * 32.0, 3.14) - 1.58) *0.5) *(sin(mod(uv.y * 32.0, 3.14)) *0.5) * (1.-dt);
    vec4 z = mix(textureColor, vec4(uColor, dt - .5),  1. - dt);
	gl_FragColor = vec4(1,4,12,1.*alpha) * circle; // 圆圈向外扩散特效加网格球点
	// gl_FragColor = vec4(z.rgb,z.a*alpha); // 双层扩散加纹理，

}