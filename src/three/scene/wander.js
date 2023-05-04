import * as THREE from "three";
import * as CANNON from "cannon-es";

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
import { PointerLockControlsCannon } from "../material/PointerLockControlsCannon";

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
    // this.initControl();
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
    this.camera.position.set(0, 2, 8);
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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);
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
    this.controls && this.controls.update(deltaTime);
    this.world.step(1 / 60, deltaTime, 3);
    this.sphereMesh.position.copy(this.sphereBody.position);
    this.robot &&
      this.robot.quaternion.copy(this.controls.getObject().quaternion);
    this.composer.render();
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }
  taskQueue() {
    this.initCannon();
    this.initPointerLock();
  }

  initCannon() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);

    // 初始化物理材质
    this.world.defaultContactMaterial.contactEquationRelaxation = 4;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e9;

    const solver = new CANNON.GSSolver();
    solver.iterations = 7;
    solver.tolerance = 0.1;

    this.world.solver = new CANNON.SplitSolver(solver);
    const physicsMaterial = new CANNON.Material("physics");
    const physics_physics = new CANNON.ContactMaterial(
      physicsMaterial,
      physicsMaterial,
      {
        friction: 0,
        restitution: 0.7,
      }
    );
    // 将材质添加到世界中
    this.world.addContactMaterial(physics_physics);

    const radius = 0.8;
    const sphereShape = new CANNON.Sphere(radius);
    this.sphereBody = new CANNON.Body({
      mass: 5,
      material: physicsMaterial,
    });
    this.sphereBody.addShape(sphereShape);
    this.sphereBody.linearDamping = 0.9;
    this.sphereBody.position.set(0, 5, 0);
    this.world.addBody(this.sphereBody);

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      material: physicsMaterial,
    });
    groundBody.addShape(groundShape);

    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.world.addBody(groundBody);
    // 创建threejs球体
    const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);

    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      wireframe: true,
    });
    this.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphereMesh.castShadow = true;
    this.scene.add(this.sphereMesh);

    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("./draco/");
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load("./sci-hall/roomModel/ground03.glb", (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
    });
    gltfLoader.load("./sci-hall/roomModel/ground03.glb", (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
    });
    gltfLoader.load("./sci-hall/roomModel/ground.glb", (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
    });
    gltfLoader.load("./sci-hall/roomModel/stage.glb", (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
    });
    gltfLoader.load("./sci-hall/roomModel/board.glb", (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
    });
    gltfLoader.load("./sci-hall/roomModel/stage02.glb", (gltf) => {
      const model = gltf.scene;
      this.scene.add(model);
    });
    gltfLoader.load("./sci-hall/roomModel/collisions.glb", (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          const shape = new CANNON.Box(
            new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z)
          );
          const body = new CANNON.Body({
            mass: 0,
            material: physicsMaterial,
          });
          body.addShape(shape);
          body.position.copy(child.position);
          body.quaternion.copy(child.quaternion);
          this.world.addBody(body);
        }
      });
    });
    gltfLoader.load("./sci-hall/robot.glb", (gltf) => {
      this.robot = gltf.scene;
      this.robot.children[0].position.set(0, -0.8, 0);
      this.robot.children[0].rotation.set(0, Math.PI, 0);
      this.sphereMesh.add(this.robot);
    });
  }
  initPointerLock() {
    this.controls = new PointerLockControlsCannon(this.camera, this.sphereBody);
    this.scene.add(this.controls.getObject());
    this.renderer.domElement.addEventListener("click", () => {
      this.controls.lock();
    });
    this.controls.addEventListener("lock", () => {
      this.controls.enabled = true;
    });
    this.controls.addEventListener("unlock", () => {
      this.controls.enabled = false;
    });
  }
}
