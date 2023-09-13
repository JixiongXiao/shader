import * as THREE from "three";
import * as TWEEN from "three/examples/jsm/libs/tween.module.js";
let textureLoader = new THREE.TextureLoader();
let tMap = textureLoader.load("texture/effect/contour_glow.png");

let tMap1 = textureLoader.load("texture/particles/9.png");
let tMap2 = textureLoader.load("texture/effect/grow.png");
tMap.wrapS = THREE.RepeatWrapping;
tMap.wrapT = THREE.RepeatWrapping;
tMap.anisotropy = 16;
tMap.magFilter = THREE.LinearFilter;
tMap.minFilter = THREE.LinearMipMapLinearFilter;
tMap.colorSpace = THREE.SRGBColorSpace;
tMap1.wrapS = THREE.RepeatWrapping;
tMap1.wrapT = THREE.RepeatWrapping;
tMap1.anisotropy = 16;
tMap1.magFilter = THREE.LinearFilter;
tMap1.minFilter = THREE.LinearMipMapLinearFilter;
tMap1.colorSpace = THREE.SRGBColorSpace;
tMap2.wrapS = THREE.ClampToEdgeWrapping;
tMap2.wrapT = THREE.ClampToEdgeWrapping;
tMap2.anisotropy = 16;
tMap2.magFilter = THREE.LinearFilter;
tMap2.minFilter = THREE.LinearMipMapLinearFilter;
tMap2.colorSpace = THREE.SRGBColorSpace;
var shaderInfo = {
  uniforms: {
    tMap: { value: tMap },
    tMap1: { value: tMap1 },
    tMap2: { value: tMap2 },
    time: { value: 0.0 },
    cameraPosition: { value: new THREE.Vector3(0, 0, 0) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec4 mPosition;
    varying vec4 mvPosition;
    varying vec4 vPosition;
    void main() {
        vUv = uv;
        vNormal = normal;
        mPosition = modelMatrix * vec4( position, 1.0 );
        mvPosition = viewMatrix * mPosition;
        vPosition = projectionMatrix * mvPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    #define PI 3.14159265358
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec4 mPosition;
    varying vec4 mvPosition;
    varying vec4 vPosition;

    // uniform vec3 cameraPosition //以注入
    uniform float time;
    uniform sampler2D tMap;
    uniform sampler2D tMap1;
    uniform sampler2D tMap2;

    // 2D Random
    float random (in vec2 st) {
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))* 43758.5453123);
    }

    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    // Some useful functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {

        // Precompute values for skewed triangular grid
        const vec4 C = vec4(0.211324865405187,
                            // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,
                            // 0.5*(sqrt(3.0)-1.0)
                            -0.577350269189626,
                            // -1.0 + 2.0 * C.x
                            0.024390243902439);
                            // 1.0 / 41.0

        // First corner (x0)
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);

        // Other two corners (x1, x2)
        vec2 i1 = vec2(0.0);
        i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
        vec2 x1 = x0.xy + C.xx - i1;
        vec2 x2 = x0.xy + C.zz;

        // Do some permutations to avoid
        // truncation effects in permutation
        i = mod289(i);
        vec3 p = permute(
                permute( i.y + vec3(0.0, i1.y, 1.0))
                    + i.x + vec3(0.0, i1.x, 1.0 ));

        vec3 m = max(0.5 - vec3(
                            dot(x0,x0),
                            dot(x1,x1),
                            dot(x2,x2)
                            ), 0.0);

        m = m*m ;
        m = m*m ;

        // Gradients:
        //  41 pts uniformly over a line, mapped onto a diamond
        //  The ring size 17*17 = 289 is close to a multiple
        //      of 41 (41*7 = 287)

        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;

        // Normalise gradients implicitly by scaling m
        // Approximation of: m *= inversesqrt(a0*a0 + h*h);
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

        // Compute final noise value at P
        vec3 g = vec3(0.0);
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
        return 130.0 * dot(m, g);
    }

    void main() {

        gl_FragColor = vec4(vUv,1.0,1.0);
        // gl_FragColor = vec4(vNormal,1.0);
        // gl_FragColor = vec4(mvPosition.xyz,1.0);

        // 获取视角方向
        // vec3 viewDir = normalize(cameraPosition - mPosition.xyz);
        // float intensity = 1.0 - dot(vNormal, viewDir);

        // gl_FragColor = vec4(vUv,1.0,intensity);

        // 条纹
        // gl_FragColor = texture2D(tMap,vUv);
        // gl_FragColor = texture2D(tMap,vec2(mPosition.x,mPosition.y));

        // 菲涅尔+条纹
        // vec3 viewDir = normalize(cameraPosition - mPosition.xyz);
        // float intensity = 1.0 - dot(vNormal, viewDir);
        // vec4 mapColor = texture2D(tMap,vec2(mPosition.x,mPosition.y));

        // gl_FragColor = vec4(mapColor.xyz+intensity
        // ,mapColor.w + intensity);

        // 菲涅尔+条纹+三角函数
        // vec3 viewDir = normalize(cameraPosition - mPosition.xyz);
        // float intensity = 1.0 - dot(vNormal, viewDir);
        // vec4 mapColor = texture2D(tMap,vec2(mPosition.x,mPosition.y+sin((mPosition.x)*10.0*6.28)*0.02)+time);

        // gl_FragColor = vec4(mapColor.xyz+intensity
        // ,mapColor.w + intensity);


         // 菲涅尔+条纹+图案
        // vec3 viewDir = normalize(cameraPosition - mPosition.xyz);
        // float intensity = 1.0 - dot(vNormal, viewDir);
        // vec4 mapColor = texture2D(tMap,vec2(mPosition.x,mPosition.y+time));
        // vec4 mapColor1 = texture2D(tMap1,vec2(mPosition.x*5.0,(mPosition.y+time*0.5)*5.0));

        // mapColor.xyz += mapColor1.xyz;

        // float alpha = mapColor.a + mapColor1.x + intensity;

        // gl_FragColor = vec4(mapColor.xyz+intensity,alpha );


        // 噪声函数
        // float n = snoise(vec2(mPosition.x+mPosition.z,mPosition.y+mPosition.z)*5.0);
        // n = (n+1.0)*0.5;
        // gl_FragColor = vec4(vUv,1.0,n);

        // 菲涅尔+条纹+图案
        // vec3 viewDir = normalize(cameraPosition - mPosition.xyz);
        // float intensity = 1.0 - dot(vNormal, viewDir);
        // vec4 mapColor = texture2D(tMap,vec2(mPosition.x,mPosition.y+time));
        // vec4 mapColor1 = texture2D(tMap1,vec2(mPosition.x*5.0,(mPosition.y+time*0.5)*5.0));

        // mapColor.xyz += mapColor1.xyz;

        // float alpha = mapColor.a + mapColor1.x + intensity;

        // float n = snoise(vec2(mPosition.x+mPosition.z+time,mPosition.y+mPosition.z+time)*5.0);
        // n = (n+1.0)*0.5;

        // gl_FragColor = vec4(mapColor.xyz+intensity,alpha*n );

        // 噪声函数
        float n = snoise(vec2(mPosition.x+mPosition.z,mPosition.y+mPosition.z)*5.0);
        n = (n+1.0)*0.5;
        float alpha = step( time,n);

        float fireMix = smoothstep(time,time+0.1,n);
        vec4 fireColor = mix(vec4(1.0,0.0,0.0,1.0),vec4(1.0,1.0,0.0,1.0),fireMix);
        if(n>time&&n<time+0.1){
            gl_FragColor = fireColor;
        }else{
            gl_FragColor = vec4(vUv,1.0,alpha);
        }


        // gl_FragColor = vec4(vUv,1.0,alpha);
        
        
    }
  `,
};

let tween = new TWEEN.Tween(shaderInfo.uniforms.time);
tween.to({ value: 1 }, 1000);
// 设置循环无数次
tween.repeat(Infinity);
// 循环往复
tween.yoyo(true);
tween.start();

export default class BasicEffectMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: shaderInfo.uniforms,
      vertexShader: shaderInfo.vertexShader,
      fragmentShader: shaderInfo.fragmentShader,
      transparent: true,
      //   side: THREE.DoubleSide,
      //   depthTest: false,
      //   depthWrite: false,
      //   blending: THREE.AdditiveBlending,
    });
  }
  onBeforeRender(renderer, scene, camera) {
    let view = new THREE.Vector3();
    this.uniforms.cameraPosition.value = camera.position;
  }
  onBeforeCompile(shader, renderer) {
    console.log(shader.vertexShader);
    console.log(shader.fragmentShader);
  }
}
