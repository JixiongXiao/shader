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
    this.initLight();
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
      1000
    );
    // 3设置相机位置
    this.camera.position.set(-5.5, 3.7, 7.5);
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

  render() {
    requestAnimationFrame(this.render.bind(this));
    let deltaTime = this.clock.getDelta(); // 刷新帧数
    this.elapsedTime.value = this.clock.getElapsedTime();
    this.control && this.control.update();
    this.composer.render();
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }
  taskQueue() {
    this.createMesh();
  }
  createMesh() {
    const points = [
      new THREE.Vector3(0.5, 0.5, 10),
      new THREE.Vector3(0.25, 0.7, 8),
      new THREE.Vector3(0.33, 0.9, 9.8),
      new THREE.Vector3(0.35, 0.8, 6),
      new THREE.Vector3(0.4, 0.6, 9),
    ];
    const geometry = new THREE.PlaneGeometry(20, 20, 126, 126);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.5,
      uniforms: {
        uelapseTime: this.uelapseTime,
        range: {
          value: 10,
        },
        uPoints: {
          value: new Float32Array(points.flatMap((v) => [v.x, v.y, v.z])),
        },
        uPointsCount: {
          value: points.length,
        },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 heatMap;
        uniform vec3 uPoints[${points.length}];
        uniform int uPointsCount;
        
        vec3 gradient(float w, vec2 uv) {
        w = pow(clamp(w, 0., 1.) * 3.14159 * .5, .9);
        vec3 c = vec3(sin(w), sin(w * 2.), cos(w * 2.3)) * 1.1;
        vec3 t = vec3(0.0,0.0,0.0);
        return mix(t, c, w);
        }
        const float HEAT_MAX = 10.;
        const float PointRadius = .22;
        
        
        void main() {
            vUv = uv;
            float d = 0.;
            for (int i = 0; i < uPointsCount; i++) {
                vec3 v = uPoints[i];
                float intensity = v.z / HEAT_MAX;
                float pd = (1. - length(uv - v.xy) / PointRadius) * intensity;
                d += pow(max(0., pd), 2.);
            }
            heatMap = gradient(d, uv);
            vec4 modelPosition = modelMatrix * vec4 ( position, 1.0);
            modelPosition.y += heatMap.r;
            gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 heatMap;
  
        void main() {
  
        float a = (clamp(heatMap.r, 0., 1.) + clamp(heatMap.g, 0., 1.) + clamp(heatMap.b, 0., 1.)) / 2.5 ;
        gl_FragColor = vec4(heatMap.rgb, a);
        }
      `,
    });
    const plane = new THREE.Mesh(geometry, shaderMaterial);
    this.scene.add(plane);
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
