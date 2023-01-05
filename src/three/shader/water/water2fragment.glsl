varying vec2 vUv;
uniform float uelapseTime;


void main()
{
   
    //background texture
   	//vec4 texture_color = texture(iChannel0, uv);
    
   	//background color rgb( 49/255, 169/255, 238/255, 255/255 ) -- 0.192156862745098, 0.6627450980392157, 0.9333333333333333
    vec4 texture_color = vec4(0.192156862745098, 0.6627450980392157, 0.9333333333333333, 1.0);
    
    vec4 k = vec4(uelapseTime)*0.8;
	k.xy = vUv * 7.0;
    float val1 = length(0.5-fract(k.xyw*=mat3(vec3(-2.0,-1.0,0.0), vec3(3.0,-1.0,1.0), vec3(1.0,-1.0,-1.0))*0.5));
    float val2 = length(0.5-fract(k.xyw*=mat3(vec3(-2.0,-1.0,0.0), vec3(3.0,-1.0,1.0), vec3(1.0,-1.0,-1.0))*0.2));
    float val3 = length(0.5-fract(k.xyw*=mat3(vec3(-2.0,-1.0,0.0), vec3(3.0,-1.0,1.0), vec3(1.0,-1.0,-1.0))*0.5));
    vec4 color = vec4 ( pow(min(min(val1,val2),val3), 7.0) * 3.0)+texture_color;
    gl_FragColor = color;
}