import { PathPointList } from "./PathPointList.js";
import { PathGeometry } from "./PathGeometry.js";
import { PathTubeGeometry } from "./PathTubeGeometry.js";
import * as THREE from "three";
export class FlowLightSystem {
  constructor() {
    this.points = [];
    this.meshs = {};
    this.flows = [];
    this.uElapseTime = {
      value: 0,
    };
  }
  init(scene, bloom) {
    this.scene = scene;
    this.bloomEffect = bloom;
  }
  createFlowLight(
    points,
    config = { type: "tube", segments: 1.0, width: 5, bloom: true }
  ) {
    const material = this.createMaterial(config.segments);
    const lineGroup = new THREE.Group();

    const geometry = this.createGeometry(config, points);
    const line = this.createMesh(geometry, material);
    config.bloom && this.flows.push(line);
    lineGroup.add(line);
    this.scene.add(lineGroup);
  }
  createMaterial(seg) {
    const vertexShader = `
        varying vec2 vUv;
        uniform float uElapseTime;
        #include <logdepthbuf_pars_vertex>
        #include <common>
        // bool isPerspectiveMatrix(mat4) {
        //   return true;
        // }
        void main(){
          vUv = uv;
          // vec3 transformed = vec3(position);
          // vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          // gl_Position = projectionMatrix * mvPosition;
          #include <begin_vertex>
          #include <project_vertex>
          #include <logdepthbuf_vertex>
        }
    `;
    const fragmentShader = `

    uniform float uElapseTime;
    varying vec2 vUv;

  
    #include <logdepthbuf_pars_fragment>
    void main() {
      vec3 c = vec3(0.2,0.5,0.7);
      float a = 1.0;
      float p = ${seg}.0; //线段段数
      
      // 从头部到尾部渐变
      // float r = step(0.5, fract(vUv.x * p - uElapseTime));
      // float fade = (fract(vUv.x * p - uElapseTime) * 2.0) - 1.0;
      // a =  r * fade;
      // gl_FragColor = vec4(c,a);

      // 从中间往两边渐变
      float r = step(0.5, fract(vUv.x * p  - uElapseTime)); // 线条长度
      float fade = (fract(vUv.x * p - uElapseTime) * 2.0) - 1.0;
      a =  r * fade;
      gl_FragColor = vec4(c,a);

    	#include <logdepthbuf_fragment>

    }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uElapseTime: this.uElapseTime,
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
    return material;
  }
  createGeometry(config, points) {
    const up = new THREE.Vector3(0, 1, 0);
    const pathPointList = new PathPointList();
    pathPointList.set(points, 0.5, 10, up, false);
    if (config.type === "tube") {
      // 管道
      const tubeGeometry = new PathTubeGeometry({
        pathPointList: pathPointList,
        options: {
          radius: config.width, // default is 0.1
          radialSegments: 8, // default is 8
          progress: 1, // default is 1
          startRad: 0, // default is 0
        },
        usage: THREE.StaticDrawUsage,
      });
      return tubeGeometry;
    } else if (config.type === "line") {
      // 宽线
      const geometry = new PathGeometry();
      geometry.update(pathPointList, {
        width: config.width,
        arrow: false,
        side: "both",
      });
      return geometry;
    }
  }
  createMesh(g, m) {
    const mesh = new THREE.Mesh(g, m);
    return mesh;
  }
  update(elapseTime) {
    this.uElapseTime.value = elapseTime;
  }
}
