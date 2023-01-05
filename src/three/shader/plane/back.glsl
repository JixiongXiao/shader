// " #include <logdepthbuf_pars_fragment>   
// void main() {    
//      gl_FragColor= vec4(1.,1.,1.,0.);    
//      #include <logdepthbuf_fragment>                      
//      }       
//      " : "flow" === h ? " 
//      #include <logdepthbuf_pars_fragment> 
    //  varying vec2 vUv; 
    //  varying vec2 mapUv;   
    //  uniform sampler2D uTexture;  
    //  uniform sampler2D maskMap; 
    //   uniform float uelapseTime;  
    //   uniform float opacity; 
    //   uniform float alpha;  
    //   uniform vec3 color;  
    //   uniform vec3 flowColor;  
    //   uniform float glowFactor;  
    //   uniform float speed;   
    //   void main() {      
    //     float t=mod(uelapseTime/5.*speed,1.);          
    //     vec2 uv=abs((vUv-vec2(0.5))*2.0);    
    //     float dis = length(uv);    
    //     float r = t-dis;     
    //     vec4 col=texture2D(  uTexture, mapUv );    
    //     vec3 finalCol;    
    //     vec4 mask = texture2D(maskMap, vec2(0.5,r));    
    //     finalCol = mix(color,flowColor,clamp(0.,1.,mask.a*glowFactor));    
    //     gl_FragColor= vec4(finalCol.rgb,(alpha+mask.a*glowFactor)*col.a*(1.-dis)*opacity);  
//          #include <logdepthbuf_fragment> }       
//          " : " #include <logdepthbuf_pars_fragment> 
//          varying vec2 vUv;  
//          varying vec2 mapUv;  
//          uniform sampler2D uTexture;  
//          uniform sampler2D maskMap;  
//          uniform float uelapseTime;  
//          uniform float opacity; 
//          uniform float alpha;  
//          uniform vec3 color;  
//          uniform vec3 flowColor;  
//          uniform float glowFactor;  
//          uniform float speed; 
//          vec2 newUV(vec2 coord,float c,float s)  {    mat2 m=mat2(c,-s,s,c);    return m*coord; } 
//          void main() {      
//             float t=speed*uelapseTime;          
//             vec2 pivot=vec2(0.5,0.5);   
//             vec2 uv=newUV((vUv-pivot),cos(t),sin(t))+pivot;    
//             vec4 finalCol;   
//             if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)    
//             {      finalCol=vec4(color,opacity*alpha*texture2D(  uTexture, uv ).a);   }   
//             gl_FragColor= clamp(finalCol,0.,1.);    
//             #include <logdepthbuf_fragment> } "