import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
import { PathPointList } from "../material/PathPointList";
import { PathGeometry } from "../material/PathGeometry";
import { PathTubeGeometry } from "../material/PathTubeGeometry";
import { FlowLightSystem } from "../material/flowLight";

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
    this.renderer.info.autoReset = false;
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
    this.renderer.info.reset();
    let deltaTime = this.clock.getDelta(); // 刷新帧数
    this.elapsedTime.value = this.clock.getElapsedTime();
    this.control && this.control.update();
    this.composer.render();
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    this.flowSystem && this.flowSystem.update(this.elapsedTime.value);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
  taskQueue() {
    this.createPath();
    // this.createPathWithMap();
    // this.addListenser();
    // this.initRaycasterEvent();
    // this.createFlowline();
  }
  createPath() {
    const points = [
      new THREE.Vector3(-2, 0, 5),
      new THREE.Vector3(-2, 0, -5),
      new THREE.Vector3(2, 0, -5),
      new THREE.Vector3(2, 0, 5),
    ];
    const up = new THREE.Vector3(0, 1, 0);
    const pathPointList = new PathPointList();
    pathPointList.set(points, 0.5, 10, up, false);
    const geometry = new PathGeometry();
    geometry.update(pathPointList, {
      width: 0.3,
      arrow: false,
      side: "both",
    });
    const tubeGeometry = new PathTubeGeometry({
      pathPointList: pathPointList,
      options: {
        radius: 0.1, // default is 0.1
        radialSegments: 8, // default is 8
        progress: 1, // default is 1
        startRad: 0, // default is 0
      },
      usage: THREE.StaticDrawUsage,
    });
    const material = new THREE.MeshStandardMaterial({
      color: 0xfffff,
      depthWrite: true,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(tubeGeometry, material);

    mesh.material.onBeforeCompile = (shader) => {
      (shader.uniforms.uelapseTime = this.elapsedTime),
        this.shaderModify(shader);
      // console.log(shader.vertexShader);
      // console.log(shader.fragmentShader);
    };
    this.scene.add(mesh);
  }
  shaderModify(shader) {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `
        #include <common>
        varying vec3 vPosition;
        varying vec2 st;
        `
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        #include <begin_vertex>
        vPosition = position;
        st = uv;
        `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <common>`,
      `
      varying vec2 st;
      uniform float uelapseTime;
      #include <common>
      //
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>
      //#end
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `//#end`,
      `
      //#end
      gl_FragColor = vec4(st.x,0.3,0.4,st.x);
      `
    );
  }
  // 带贴图的path
  createPathWithMap() {
    const texture = new THREE.TextureLoader().load(
      "./textures/spriteline2.png"
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(1, 1);
    const points = [
      new THREE.Vector3(-20, 0, 30),
      new THREE.Vector3(-20, 0, 20),
      new THREE.Vector3(-20, 0, 10),
      new THREE.Vector3(20, 0, -50),
    ];
    const up = new THREE.Vector3(0, 1, 0);
    const pathPointList = new PathPointList();
    pathPointList.set(points, 0.5, 10, up, false);
    const geometry = new PathGeometry();
    geometry.update(pathPointList, {
      width: 0.3,
      arrow: false,
      // side: "both",
    });
    const material = new THREE.MeshStandardMaterial({
      color: 0xfffff,
      depthWrite: true,
      transparent: true,
      opacity: 1,
      map: texture,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTexture = { value: texture };
      shader.uniforms.tRepeat = { value: new THREE.Vector2(1, 1) };
      shader.uniforms.uelapseTime = this.elapsedTime;
      this.shaderModifyWithMap(shader);
      // console.log(shader.fragmentShader);
    };
    this.scene.add(mesh);
  }
  // 带贴图的path
  shaderModifyWithMap(shader) {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `
        #include <common>
        varying vec3 vPosition;
        varying vec2 st;
        `
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        #include <begin_vertex>
        vPosition = position;
        st = uv;
        `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <common>`,
      `
      varying vec2 st;
      uniform float uelapseTime;
      uniform vec2 tRepeat;
      uniform sampler2D uTexture;
      #include <common>
      //
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>
      //#end
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      `//#end`,
      `
      //#end
      float speed = 0.5;
      vec2 horizontal = vec2(fract(st.x * tRepeat.x - uelapseTime * speed),st.y);
      vec2 vertical = vec2(fract(st.y * tRepeat.y - uelapseTime * speed),st.x);
      vec4 textureColor = texture2D(uTexture, horizontal);
      gl_FragColor = textureColor;
      `
    );
  }
  addListenser() {
    window.addEventListener("dblclick", () => {
      console.log(this.renderer.info);
    });
    window.addEventListener("click", (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.intersects = this.raycaster.intersectObjects(this.models);
      if (this.intersects.length > 0) {
        let obj = this.intersects[0].object;
        // console.log(obj);
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
  // 用类生成path
  createFlowline() {
    const points = [
      new THREE.Vector3(-20, 0, 30),
      new THREE.Vector3(-20, 0, 20),
      new THREE.Vector3(-20, 0, 10),
      new THREE.Vector3(20, 0, -50),
    ];
    this.flowSystem = new FlowLightSystem();
    this.flowSystem.init(this.scene, this.bloomEffect);
    this.flowSystem.createFlowLight(points, {
      type: "line",
      segments: 3.0,
      width: 0.5,
      bloom: true,
    });
  }
}
