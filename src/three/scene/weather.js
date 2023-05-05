import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  BloomEffect,
  EffectPass,
  SelectiveBloomEffect,
  EffectComposer,
  RenderPass,
  BlendFunction,
  OutlineEffect,
  SMAAEffect,
  GodRaysEffect,
} from "postprocessing";

export default class ThreePlus {
  constructor(selector) {
    this.clock = new THREE.Clock();
    this.domElement = document.querySelector(selector);
    this.width = this.domElement.clientWidth;
    this.height = this.domElement.clientHeight;
    this.mixer = null;
    this.cameraCanMove = false;
    this.pointerSpeed = 0.5;
    this.originAngle = null; // radians
    this.maxAngle = null; // radians
    this._euler = new THREE.Euler(0, 0, 0, "XYZ");
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.intersects = null;
    this.models = [];
    this.elapsedTime = {
      value: 0,
    };
    this.init();
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControl();
    this.initAxesHelper();
    this.initComposer();
    // this.initLight();
    this.taskQueue();
    this.render();
  }
  initScene() {
    this.scene = new THREE.Scene();
  }
  initCamera() {
    // 2创建相机
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      150000
    );
    // 3设置相机位置
    this.camera.position.set(700, 700, 500);
    // this.camera.updateProjectionMatrix();
  }
  initRenderer() {
    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: false,
      powerPreference: "high-performance",
    });
    // 设置渲染尺寸的大小
    this.renderer.setSize(this.width, this.height);
    // 开启阴影贴图
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    // this.renderer.setClearColor('#8AE3C4',1)
    this.domElement.appendChild(this.renderer.domElement);
    this.renderer.autoClearDepth = true;
  }
  initControl() {
    // // 创建轨道控制器
    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    // 第一人称控制器
    // this.control = new PointerLockControls(this.camera, this.renderer.domElement)
    // // 设置控制器阻尼,必须在动画循环里调用update
    this.control.enableDamping = true;
  }
  initAxesHelper() {
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
  }
  initLight() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2);
    // this.scene.add(this.ambientLight)
    this.spotLight = new THREE.PointLight(0xffffff, 3);
    this.spotLight.position.set(3, 5, 3);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
    const spotLightHelper = new THREE.PointLightHelper(this.spotLight);
    // this.scene.add(spotLightHelper)
  }
  initComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEffect = new SelectiveBloomEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.01,
      luminanceSmoothing: 0.6,
      intensity: 3,
      // mipmapBlur:true,
    });
    this.bloomEffect.inverted = false;
    this.bloomEffect.ignoreBackground = true;
    this.bloomEffect.selection.set([]);
    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.ADD,
      edgeStrength: 3,
      pulseSpeed: 0,
      visibleEdgeColor: 0xffffff,
      hiddenEdgeColor: 0x22090a,
      blur: false,
      xRay: true,
      usePatternTexture: false,
    });
    const smaaEffect = new SMAAEffect();
    // 创建通道
    const bloomPass = new EffectPass(this.camera, this.bloomEffect);
    this.composer.addPass(bloomPass);
    const effectPass = new EffectPass(
      this.camera,
      this.bloomEffect,
      this.outlineEffect,
      smaaEffect
    );
    this.composer.addPass(effectPass);
  }
  initRaycasterEvent() {
    // window.addEventListener("mousemove", (e)=>{
    //     this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    //     this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
    // })
    window.addEventListener("click", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.intersects = this.raycaster.intersectObjects(this.models);
      if (this.intersects.length > 0) {
        let obj = this.intersects[0].object;
        console.log(obj);
      }
    });
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    let deltaTime = this.clock.getDelta(); // 刷新帧数
    this.update((this.clock.getElapsedTime() * 0.5) % 1);
    this.elapsedTime.value = this.clock.getElapsedTime();
    this.control && this.control.update();
    this.composer.render();
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }
  taskQueue() {
    this.createRain();
    this.initRaycasterEvent();
  }

  createRain() {
    const num = 1000; // 雨水数量
    const rangeY = 500; // 高度
    const rangeX = 400; // 雨水范围x轴
    const rangeZ = 400; // 雨水范围z轴
    const box = new THREE.Box3(
      new THREE.Vector3(-rangeX, 0, -rangeZ),
      new THREE.Vector3(rangeX, rangeY, rangeZ)
    );
    //创建雨
    this.rainMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8,
      // map: new THREE.TextureLoader().load("./color.png"),
      depthWrite: false,
    });
    this.shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      uniforms: {
        cameraPosition: {
          value: new THREE.Vector3(0, 200, 0),
        },
        top: {
          value: rangeY,
        },
        bottom: {
          value: 0,
        },
        time: {
          value: 0,
        },
      },
      vertexShader: `
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float top;
      uniform float bottom;
      uniform float time;
      float angle(float x, float y){
        return atan(y, x);
      }
      vec2 getFoot(vec2 camera,vec2 normal,vec2 pos){
          vec2 position;
          float distanceLen = distance(pos, normal);
          float a = angle(camera.x - normal.x, camera.y - normal.y);
          pos.x > normal.x ? a -= 0.785 : a += 0.785; 
          position.x = cos(a) * distanceLen;
          position.y = sin(a) * distanceLen;
          
          return position + normal;
      }

      void main() {
          vPosition = position;
          vUv = uv;
          vec2 foot = getFoot(vec2(cameraPosition.x, cameraPosition.z),  vec2(normal.x, normal.z), vec2(position.x, position.z));
          float height = top - bottom;
          float y = normal.y - bottom - height * time;
          y = y + (y < 0.0 ? height : 0.0);
          float ratio = (1.0 - y / height) * (1.0 - y / height);
          y = height * (1.0 - ratio);
          y += bottom;
          y += position.y - normal.y;
          vec3 transformed = vec3( foot.x, y, foot.y );
          vec3 position = transformed;
          vec4 modelPosition = modelMatrix * vec4 ( position, 1.0);
      
      
          gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }
     `,
      fragmentShader: `
      varying vec2 vUv;
      void main()
      {
          gl_FragColor = vec4(0.6,0.8,1.0, vUv.y);
      }
     `,
    });
    var geometry = new THREE.BufferGeometry();

    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i < num; i++) {
      const pos = new THREE.Vector3();
      pos.x = Math.random() * (box.max.x - box.min.x) + box.min.x;
      pos.y = Math.random() * (box.max.y - box.min.y) + box.min.y;
      pos.z = Math.random() * (box.max.z - box.min.z) + box.min.z;

      const height = (box.max.y - box.min.y) / 50; // 雨点高度
      const width = height / 60;

      vertices.push(
        pos.x + width,
        pos.y + height / 2,
        pos.z,
        pos.x - width,
        pos.y + height / 2,
        pos.z,
        pos.x - width,
        pos.y - height / 2,
        pos.z,
        pos.x + width,
        pos.y - height / 2,
        pos.z
      );

      normals.push(
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z
      );

      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

      indices.push(
        i * 4 + 0,
        i * 4 + 1,
        i * 4 + 2,
        i * 4 + 0,
        i * 4 + 2,
        i * 4 + 3
      );
    }

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(normals), 3)
    );
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), 2)
    );
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    // var mesh = new THREE.Mesh(geometry, this.rainMaterial);
    var mesh = new THREE.Mesh(geometry, this.shaderMaterial);
    mesh.material.onBeforeCompile = (shader) => {
      shader.uniforms.cameraPosition = {
        value: new THREE.Vector3(0, 200, 0),
      };
      shader.uniforms.top = {
        value: rangeY,
      };
      shader.uniforms.bottom = {
        value: 0,
      };
      shader.uniforms.time = {
        value: 0,
      };
      const getFoot = `
            uniform float top;
            uniform float bottom;
            uniform float time;
            varying vec2 vUv;
            #include <common>
            float angle(float x, float y){
              return atan(y, x);
            }
            vec2 getFoot(vec2 camera,vec2 normal,vec2 pos){
                vec2 position;

                float distanceLen = distance(pos, normal);

                float a = angle(camera.x - normal.x, camera.y - normal.y);

                pos.x > normal.x ? a -= 0.785 : a += 0.785; 

                position.x = cos(a) * distanceLen;
                position.y = sin(a) * distanceLen;
                
                return position + normal;
            }
            `;
      const begin_vertex = `
            vUv = uv;
            vec2 foot = getFoot(vec2(cameraPosition.x, cameraPosition.z),  vec2(normal.x, normal.z), vec2(position.x, position.z));
            float height = top - bottom;
            float y = normal.y - bottom - height * time;
            y = y + (y < 0.0 ? height : 0.0);
            float ratio = (1.0 - y / height) * (1.0 - y / height);
            y = height * (1.0 - ratio);
            y += bottom;
            y += position.y - normal.y;
            vec3 transformed = vec3( foot.x, y, foot.y );
            // vec3 transformed = vec3( position );
            `;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        getFoot
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        begin_vertex
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `
       #include <common>
       varying vec2 vUv;
       `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
       #include <dithering_fragment>
       gl_FragColor= vec4(1.0,1.0,1.0,(1.0 - vUv.y) * 0.5);
       `
      );
      this.rainMaterial.uniforms = shader.uniforms;
    };
    this.scene.add(mesh);
  }
  update(time) {
    if (this.shaderMaterial.uniforms) {
      this.shaderMaterial.uniforms.cameraPosition.value = this.camera.position;
      this.shaderMaterial.uniforms.time.value = time;
    }
  }
  addListenser() {
    window.addEventListener("dblclick", () => {});
    window.addEventListener("click", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.intersects = this.raycaster.intersectObjects(this.models);
      if (this.intersects.length > 0) {
        let obj = this.intersects[0].object;
        console.log(obj);
      }
    });
    window.addEventListener("mousedown", () => {
      this.cameraCanMove = true;
    });
    window.addEventListener("mouseup", () => {
      this.cameraCanMove = false;
    });
    window.addEventListener("mousemove", (event) => {
      if (this.cameraCanMove) {
        const movementX =
          event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this._euler.setFromQuaternion(this.camera.quaternion);
        this._euler.y -= movementX * 0.002 * this.pointerSpeed;
        if (this.maxAngle.y > -0.4 && this.maxAngle.y <= this.originAngle.y) {
          this.camera.quaternion.setFromEuler(this._euler);
          this.maxAngle = this._euler;
        }
      }
    });
  }
}
