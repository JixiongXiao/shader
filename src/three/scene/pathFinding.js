import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";
import { Graph } from "../class/dijkstra";
import {
  Brush,
  Evaluator,
  ADDITION,
  SUBTRACTION,
  INTERSECTION,
} from "three-bvh-csg";
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
const ZONE = "level1";
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
    this.start = null;
    this.end = null;
    this.init();
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLayers();
    this.initControl();
    // this.initAxesHelper();
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
    this.camera.position.set(-15.5, 13.7, 17.5);
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
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);
    this.spotLight = new THREE.PointLight(0xffffff, 0.3);
    this.spotLight.position.set(3, 5, 3);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
    const spotLightHelper = new THREE.PointLightHelper(this.spotLight);
    // this.scene.add(spotLightHelper);
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
  }
  taskQueue() {
    // this.initBackground();
    this.addListenser();
    this.initPathFindGraph();
    // this.initPathFindTube();
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
  initPathFindGraph() {
    const evaluator = new Evaluator();
    const material = new THREE.MeshStandardMaterial({
      color: "#A9C3FA",
      opacity: 0.75,
      transparent: true,
      side: THREE.DoubleSide,
      // wireframe: true,
    });
    const geometry = new THREE.BoxGeometry(31, 13, 13);
    this.pathfinder = new Pathfinding();
    this.helper = new PathfindingHelper();
    this.player = new THREE.Vector3(-16, 0, 0);
    this.target = new THREE.Vector3(-16, 0, 0);
    this.path = null;
    this.scene.add(this.helper);
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("./model/pathfindingLand.glb", (gltf) => {
      this.nav = gltf.scene.children[0];
      // 创建处理后的mesh
      // const brush1 = new Brush(this.nav.geometry, material);
      // const brush2 = new Brush(geometry, material);
      // this.brush = evaluator.evaluate(brush1, brush2, SUBTRACTION);
      // this.scene.add(this.brush);
      // 创建zone
      const zone = Pathfinding.createZone(this.nav.geometry);

      this.pathfinder.setZoneData(ZONE, zone);
      const navMesh = new THREE.Mesh(this.nav.geometry, material);

      this.scene.add(navMesh);

      // Set the player's navigation mesh group
      this.groupID = this.pathfinder.getGroup(ZONE, this.player);
      this.helper.setPlayerPosition(this.player);
    });
  }
  initPathFindTube() {
    this.boxGroup = new THREE.Group();
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
    });
    const data = {
      a: new THREE.Vector3(0, 0, 0),
      b: new THREE.Vector3(15, 0, 1),
      c: new THREE.Vector3(10, 0, -20),
      d: new THREE.Vector3(-12, 0, -13),
      e: new THREE.Vector3(-10, 0, 10),
      f: new THREE.Vector3(-30, 0, 0),
    };
    this.boxData = data;
    const map = {
      a: {
        b: data["a"].distanceTo(data["b"]),
        c: data["a"].distanceTo(data["c"]),
        d: data["a"].distanceTo(data["d"]),
        e: data["a"].distanceTo(data["e"]),
      },
      b: {
        a: data["b"].distanceTo(data["a"]),
        c: data["b"].distanceTo(data["c"]),
        e: data["b"].distanceTo(data["e"]),
      },
      c: {
        a: data["c"].distanceTo(data["a"]),
        b: data["c"].distanceTo(data["b"]),
        d: data["c"].distanceTo(data["d"]),
      },
      d: {
        a: data["d"].distanceTo(data["a"]),
        c: data["d"].distanceTo(data["c"]),
        e: data["d"].distanceTo(data["e"]),
        f: data["d"].distanceTo(data["f"]),
      },
      e: {
        a: data["e"].distanceTo(data["a"]),
        b: data["e"].distanceTo(data["b"]),
        d: data["e"].distanceTo(data["d"]),
        f: data["e"].distanceTo(data["f"]),
      },
      f: {
        d: data["f"].distanceTo(data["d"]),
        e: data["f"].distanceTo(data["e"]),
      },
    };
    console.log(map);
    for (let key in data) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(data[key].x, data[key].y, data[key].z);
      mesh.graphId = key;

      this.boxGroup.add(mesh);
    }
    this.scene.add(this.boxGroup);
    this.graph = new Graph(map);
  }
  handlePathFind(e) {
    if (this.player) {
      this.player.copy(this.target);
      this.helper.setPlayerPosition(this.player);
      const intersects = this.raycaster.intersectObject(this.nav);
      if (intersects.length === 0) return;
      this.target.copy(intersects[0].point);
      console.log("target:", this.target);

      // Calculate a path to the target and store it
      this.path = this.pathfinder.findPath(
        this.player,
        this.target,
        ZONE,
        this.groupID
      );
      console.log(this.path);
      if (this.path && this.path.length) {
        this.helper.setPath(this.path);
      }
    } else if (this.graph) {
      const intersects = this.raycaster.intersectObject(this.boxGroup);
      if (intersects.length) {
        if (!this.start) {
          this.start = intersects[0].object;
        } else if (this.start && !this.end) {
          this.end = intersects[0].object;
          const result = this.graph.findPath(
            this.start.graphId,
            this.end.graphId
          );
          console.log(this.start);
          console.log(this.end);
          console.log(result);
          const points = [];
          result.forEach((box) => {
            points.push(this.boxData[box]);
          });
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          this.pathLine = new THREE.Line(geometry, lineMaterial);
          this.scene.add(this.pathLine);
        }
      } else {
        this.start = null;
        this.end = null;
        this.scene.remove(this.pathLine);
      }
    }
  }
  addListenser() {
    window.addEventListener("dblclick", (e) => {});
    window.addEventListener("mousedown", () => {
      this.cameraCanMove = true;
    });
    window.addEventListener("mouseup", (e) => {
      this.cameraCanMove = false;
      this.handlePathFind(e);
    });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
    });
  }
}
