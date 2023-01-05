varying vec2 vUv;


void main()
{
    float strength = mod(vUv.y * 2.0, 1.0);
	gl_FragColor = vec4(strength,strength, strength, 1.0); // 圆圈向外扩散，无其他特效，
}