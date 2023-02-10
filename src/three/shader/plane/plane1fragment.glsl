varying vec2 vUv;
uniform float uelapseTime;
uniform sampler2D uTexture;
uniform vec3 uColor;

void main()
{
    vec4 textureColor = texture2D(uTexture,vUv); //采样
    float a = 6.; // 圆圈数量，a越大圆圈数量越多，圆圈宽度越小
    float t = 2.0; // 时间系数 越大圆圈阔算速度越快
	vec2 uv = vUv * a;
    float dt = sin(mod(length((uv - vec2(0.5 * a, 0.5 * a)) * 1.) - uelapseTime * t, 3.14));
    float circle = (cos(mod(uv.x * 32.0, 3.14) - 1.58) *0.5) *(sin(mod(uv.y * 32.0, 3.14)) *0.5) * (1.-dt);
	gl_FragColor = vec4(vUv,0.5, 1. - dt); // 圆圈向外扩散，
	// gl_FragColor = vec4(1,4,12,1) * circle; // 圆圈向外扩散特效加网格球点
	// gl_FragColor = mix(textureColor, vec4(uColor, dt - .5),  1. - dt); // 双层扩散加纹理，
}