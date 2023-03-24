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
  SSAOEffect,
  NormalPass,
  DepthDownsamplingPass,
  TextureEffect,
} from "postprocessing";

import MeshReflectorMaterial from "../material/MeshReflectorMaterial";
import ReflectorMesh from "../material/ReflectorMesh";

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
    this.options = {
      intensity: 1,
      exponent: 1,
      distance: 10,
      fade: 0,
      roughnessFade: 1,
      thickness: 10,
      ior: 1.45,
      maxRoughness: 1,
      maxDepthDifference: 10,
      blend: 0.9,
      correction: 1,
      correctionRadius: 1,
      blur: 0.5,
      blurKernel: 1,
      blurSharpness: 10,
      jitter: 0,
      jitterRoughness: 0,
      steps: 20,
      refineSteps: 5,
      missedRays: true,
      useNormalMap: true,
      useRoughnessMap: true,
      resolutionScale: 1,
      velocityResolutionScale: 1,
    };
    this.init();
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLayers();
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
  initLayers() {
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(1);
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
    this.setAngle1();
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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(this.ambientLight);
    this.spotLight = new THREE.PointLight(0xffffff, 0.3);
    this.spotLight.position.set(3, 5, 3);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
    const spotLightHelper = new THREE.PointLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);
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
    //ssao效果
    const normalPass = new NormalPass(this.scene, this.camera);
    const ssaoEffect = new SSAOEffect(this.camera, normalPass.texture, {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 32,
      rings: 3,
      luminanceInfluence: 0.1,
      radius: 0.01,
      bias: 0,
      intensity: 1,
    });

    // 创建通道
    const bloomPass = new EffectPass(this.camera, this.bloomEffect);
    this.composer.addPass(bloomPass);
    const effectPass = new EffectPass(
      this.camera,
      this.bloomEffect,
      this.outlineEffect,
      // ssaoEffect,
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
    // this.renderer.render(this.scene, this.camera)
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    if (this.mirrorPlane) {
      this.mirrorPlane.material.update();
    }
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }
  taskQueue() {
    this.initBackground();
    this.addListenser();
    // this.createMesh(); // outline和bloom效果
    this.loadModel(); // 镜面
    // this.testSsaoEffect(); // 测试ssao 空间环境光遮蔽
  }
  initBackground() {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("./textures/powerplant.hdr", (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping; // 环境模糊效果
      this.scene.background = tex;
      this.scene.environment = tex;
      this.scene.backgroundBlurriness = 1;
    });
  }
  createMesh() {
    const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({ color: "#362894" });
    this.cube = new THREE.Mesh(cubeGeometry, this.material);
    // this.cube.layers.set(0)
    this.scene.add(this.cube);
    const coneGeometry = new THREE.ConeBufferGeometry(1, 2, 5);
    this.cone = new THREE.Mesh(coneGeometry, this.material);
    this.cone.position.set(0, 3, 0);
    // this.cone.layers.set(1)
    this.scene.add(this.cone);
    this.models.push(this.cube, this.cone);
  }
  loadModel() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("./draco/");
    const gltfLoader = new GLTFLoader();
    const rgbeLoader = new RGBELoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load("./model/bear.gltf", (gltf) => {
      this.bear = gltf.scene.children[0];
      this.bear.castShadow = true;
      this.scene.add(this.bear);
      this.bear.position.set(5, 0, 0);
      this.models.push(this.bear);
    });
    gltfLoader.load("./model/lion.gltf", (gltf) => {
      this.lion = gltf.scene.children[0];
      this.scene.add(this.lion);
      this.models.push(this.lion);
    });
    this.createMirror1();
    // this.createMirror2();
  }
  createMirror1() {
    const geometry = new THREE.PlaneGeometry(10, 10, 512, 512);
    const mirrorMaterial = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.5,
      roughness: 0.9,
      metalness: 0.6,
      // 可增加map
    });
    const groundMirror = new ReflectorMesh(geometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0xffffff,
      material: mirrorMaterial,
      reflectorFactor: 0.3,
    });
    groundMirror.rotation.x = -Math.PI / 2;
    // groundMirror.position.set(0, 0, -3);
    this.scene.add(groundMirror);
  }
  createMirror2() {
    const geometry = new THREE.PlaneGeometry(10, 10, 512, 512);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotateX(-Math.PI / 2);
    this.scene.add(plane);
    plane.material = new MeshReflectorMaterial(
      this.renderer,
      this.camera,
      this.scene,
      plane,
      {
        resolution: 1024,
        blur: [19, 80], // 倒影模糊
        mixBlur: 1.04,
        mixStrength: 1,
        mixContrast: 0.7,
        mirror: 1.8,
        depthScale: 2,
        distortion: 2,
        minDepthThreshold: 0.0, //代表到多远的地方会淡出到没画面
        maxDepthThreshold: 0.9, //代表从多远的地方开始淡出
        // resolution: 512,
        // blur: [30, 19], // 倒影模糊
        // mixBlur: 1.03,
        // mixStrength: 1,
        // mixContrast: 0.5,
        // mirror: 1.2,
        // depthScale: 1.2,
        // distortion: 2,
        // minDepthThreshold: 0.2, //代表到多远的地方会淡出到没画面
        // maxDepthThreshold: 0.3, //代表从多远的地方开始淡出
      }
    );
    plane.receiveShadow = true;
    plane.material.setValues({
      map: this.floorMap,
      normalMap: this.floorMapNormal,
      normalScale: new THREE.Vector2(0, 0.1),
      roughness: 0.7,
      metalness: 0.1,
    });
    this.mirrorPlane = plane;
  }
  testSsaoEffect() {
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
    });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.plane.receiveShadow = true;
    this.plane.position.set(0, 0, 0);
    this.plane.rotation.x = -Math.PI / 2;
    this.scene.add(this.plane);

    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
    });
    const box1Geometry = new THREE.BoxGeometry(1, 1, 2);
    const box1 = new THREE.Mesh(box1Geometry, boxMaterial);
    box1.position.set(0, 0.5, 0);
    box1.castShadow = true;
    box1.receiveShadow = true;
    this.scene.add(box1);

    const box2Geometry = new THREE.BoxGeometry(2, 1, 1);
    const box2 = new THREE.Mesh(box2Geometry, boxMaterial);
    box2.castShadow = true;
    box2.receiveShadow = true;
    this.scene.add(box2);
    box2.position.set(0.5, 0.5, 0);
  }
  addListenser() {
    window.addEventListener("dblclick", () => {});
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
    window.addEventListener("click", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.intersects = this.raycaster.intersectObjects(this.models);
      if (this.intersects.length > 0) {
        let obj = this.intersects[0].object;
        let outLineSelected = this.outlineEffect.selection;
        if (outLineSelected.has(obj)) outLineSelected.delete(obj);
        else outLineSelected.add(obj);
        let selected = this.bloomEffect.selection;
        if (selected.has(obj)) selected.delete(obj);
        else selected.add(obj);
      }
    });
  }
  setAngle1() {
    this.camera.lookAt(new THREE.Vector3(-4.5, 1.9, -0.85));
    const euler = new THREE.Euler(0, 0, 0, "XYZ");
    euler.setFromQuaternion(this.camera.quaternion);
    this.originAngle = euler;
    this.maxAngle = euler;
  }
}
