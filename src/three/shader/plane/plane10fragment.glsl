varying vec2 vUv;
varying vec3 vPosition;

float circle(vec2 _st, float _radius){
    vec2 pos = vec2(0.5)-_st;
    return smoothstep(1.0-_radius,1.0-_radius+_radius*0.2,1.-dot(pos,pos)*3.14);
}

void main()
{
 float a = circle(vUv, 0.5);
 a =  a * pow(vUv.y , 3.0);
	gl_FragColor = vec4(0.0,0.5,0.9, a); 
}
