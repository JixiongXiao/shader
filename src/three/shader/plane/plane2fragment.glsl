varying vec2 vUv;
varying vec3 vPosition;

void main()
{
    float a = 1.0;
    float t = 4.0; // 非虚化区域
    float s = 1.0; // 虚化区域
    if(vPosition.x > t || vPosition.x < -t) {
    a *= s - (abs(vPosition.x) - t) / s;
    if( vPosition.z > t || vPosition.z < -t) {
    a *= s - (abs(vPosition.z) - t) / s;
    }
    }else if( vPosition.z > t || vPosition.z < -t) {
    a *= s - (abs(vPosition.z) - t) / s;
    if(vPosition.x > t || vPosition.x < -t){
        a *= s - (abs(vPosition.x) - t) / s;
    }
    }
	gl_FragColor = vec4(0.0,0.5,0.9, a); 
}