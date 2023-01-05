// 正方形转八边形动态
#define PI 3.1415926535897932384626433832795                                          
varying vec2 vUv;                                          
uniform sampler2D uTexture;                     
uniform float uelapseTime;                     
uniform float speed;                     
uniform float opacity;                     
uniform int colorChanel;                     
uniform vec3 uColor;                                          
vec2 newUV(vec2 coord,float c,float s) {                          
    mat2 m=mat2(c,-s,s,c);                         
     return m*coord;                     
     }                      
     void main() {                         
        vec4 finalCol=vec4(0.,0.,0.,0.);                         
        float val;                         
        float t=speed*uelapseTime;                               
        vec2 pivot=vec2(0.5,0.5);                       
        vec2 uv=newUV((vUv-pivot),cos(t),sin(t))+pivot;                                                  
        if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.) {                             
            if(colorChanel==2) {                                
                val=texture2D(  uTexture, uv ).g;                                
                finalCol+=vec4(uColor,opacity*val);                             
            } else if(colorChanel==3) {                                
                val=texture2D(  uTexture, uv ).b;                                
                finalCol+=vec4(uColor,opacity*val);                             
            }else {                                
                val=texture2D(  uTexture, uv ).r;                               
                finalCol+=vec4(uColor,opacity*val);                             
            }                         
        }                                                  
        gl_FragColor= clamp(finalCol,0.,1.);                                     
    }