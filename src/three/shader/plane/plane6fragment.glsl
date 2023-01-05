
varying vec2 vUv; 
uniform float uelapseTime; 
void main()
{
	vec2 uv = vUv;
	uv.y -= 0.5;
    float wave1 = 1.0 - pow(abs(sin(uv.x * 1.0 +uelapseTime) *0.3 + uv.y),0.1);
    float wave2 = 1.0 - pow(abs(sin(uv.x * 4.0 +uelapseTime) *0.15 + uv.y),0.1);
    float wave3 = 1.0 - pow(abs(sin(uv.x * 2.0 +uelapseTime*1.8) *0.1 + uv.y),0.12);
    float wave4 = 1.0 - pow(abs(sin(uv.x * 13.0 +uelapseTime*5.1) *0.22 + uv.y),0.12);
    vec3 color = 
    vec3(wave1,wave1*0.7,wave1*0.8)
       + vec3(wave2*0.5,wave2,wave2*0.9)
       + vec3(wave3*0.2,wave3*0.7,wave3)
       + vec3(wave4,wave4*.1,wave4*0.85);
    gl_FragColor = vec4(vec3(color),1.0);
}