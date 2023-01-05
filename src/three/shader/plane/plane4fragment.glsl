varying vec2 vUv; 
uniform sampler2D uTexture;  
uniform sampler2D bg; 
uniform float uelapseTime;  
uniform float opacity; 
uniform float alpha;  
uniform vec3 uColor;  
uniform vec3 flowColor;  
uniform float glowFactor;  
uniform float speed;   
void main() {    
float repeatFactor =1.0;
vec2 mapUv = vUv * repeatFactor; 
float t=mod(uelapseTime/5.*speed,1.);          
vec2 uv=abs((vUv-vec2(0.5))*2.0);    
float dis = length(uv);    
float r = t-dis;     
vec4 col=texture2D(bg, mapUv);    
vec3 finalCol;    
vec4 mask = texture2D(bg, vec2(0.5,r));    
finalCol = mix(uColor,flowColor,clamp(0.,1.,mask.a*glowFactor));    
gl_FragColor= vec4(finalCol.rgb,(alpha+mask.a*glowFactor)*col.a*(1.-dis)*opacity);
}