varying vec2 vUv;
varying vec3 vPosition;

void main()
{
    float a = 1.0;
    float s = 3.0; // 虚化宽度
    float t = 7.0; // 非虚化区域 // s+t相加最好不大于2分之一的长度
    if(vPosition.x > t || vPosition.x < -t){
        a *= (s - (abs(vPosition.x) - t)) / s;
    }
    if(vPosition.z > t || vPosition.z < -t){
        a *= (s - (abs(vPosition.z) - t)) / s;
    }
	gl_FragColor = vec4(0.0,0.5,0.9, a); 
}
