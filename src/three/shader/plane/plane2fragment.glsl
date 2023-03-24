varying vec2 vUv;
varying vec3 vPosition;

void main()
{
    vec2 center = vec2(0,0);
    float strength = mod(vUv.y * 2.0, 1.0);
	gl_FragColor = vec4(strength,strength, strength, 1.0); // 圆圈向外扩散，无其他特效，
}