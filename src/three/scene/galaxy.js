import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
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
import galaxyVertexShader from "../shader/galaxy/vertex.glsl";
import galaxyFragmentShader from "../shader/galaxy/fragment.glsl";
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
      1500
    );
    // 3设置相机位置
    this.camera.position.set(0, 30, 70);
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
    // this.scene.add(this.ambientLight);
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
    this.moveParticles();
    this.control && this.control.update();
    this.composer.render();
    this.raycaster.setFromCamera(this.mouse, this.camera);
    TWEEN.update();
  }
  taskQueue() {
    this.addParticles();
    this.createLensFlare(50, -50, -800, 200, 200);
    this.generateGalaxy();
    this.createFallingStar();
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
  }
  getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }
  addParticles() {
    var geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      const cur = i * 3;
      vertices[cur] = this.getRandomArbitrary(-1100, 1100);
      vertices[cur + 1] = this.getRandomArbitrary(-1100, 1100);
      vertices[cur + 2] = this.getRandomArbitrary(-1100, 1100);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const loader = new THREE.TextureLoader();
    const texture = loader.load("./textures/particle/4.png");
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    var material = new THREE.PointsMaterial({
      size: 15,
      map: texture,
      transparent: true,
      // alphaMap: texture,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.particleSystemObject = new THREE.Points(geometry, material);

    this.scene.add(this.particleSystemObject);
  }
  createLensFlare(x, y, z, xScale, zScale) {
    const boxScale = { x: xScale, y: 0.1, z: zScale };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    var geometry = new THREE.PlaneBufferGeometry(xScale, zScale);

    const loader = new THREE.TextureLoader();
    const texture = loader.load("./textures/particle/lensflare0.png");
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    loadedTexture.depthWrite = true;
    loadedTexture.depthTest = true;

    this.lensFlareObject = new THREE.Mesh(geometry, loadedTexture);
    this.lensFlareObject.position.set(x, y, z);
    this.lensFlareObject.renderOrder = 1;

    this.lensFlareObject.receiveShadow = true;
    this.scene.add(this.lensFlareObject);
  }
  generateGalaxy() {
    const parameters = {};
    // 默认配置
    parameters.count = 30000;
    parameters.size = 0.005;
    parameters.radius = 100;
    parameters.branches = 3;
    parameters.spin = 1;
    parameters.uSize = 30;
    // 调试
    // parameters.count = 5000;
    // parameters.size = 0.005;
    // parameters.radius = 30;
    // parameters.branches = 3;
    // parameters.spin = 1;
    // parameters.uSize = 30; // 粒子大小

    parameters.uSpeed = 1; // 旋转速度
    parameters.randomnessPower = 3;
    parameters.insideColor = "#ff6030";
    parameters.outsideColor = "#1b3984";
    parameters.randomness = 0.2;
    parameters.position = {
      x: 0,
      y: 0,
      z: 0,
    };
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);
    const randomness = new Float32Array(parameters.count * 3);

    const colors = new Float32Array(parameters.count * 3);
    const scales = new Float32Array(parameters.count * 1);

    const insideColor = new THREE.Color(parameters.insideColor);
    const outsideColor = new THREE.Color(parameters.outsideColor);
    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;

      // Position
      const radius = Math.random() * parameters.radius;

      const branchAngle =
        ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

      //
      const randomX =
        Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius -
        parameters.position.x;
      const randomY =
        Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius -
        parameters.position.y;
      const randomZ =
        Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius -
        parameters.position.z;
      // 默认position
      // positions[i3] = Math.cos(branchAngle) * radius;
      // positions[i3 + 1] = 0;
      // positions[i3 + 2] = Math.sin(branchAngle) * radius;
      // 测试
      positions[i3] = Math.cos(branchAngle + radius * 0.06) * radius;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle + radius * 0.06) * radius;

      randomness[i3] = randomX;
      randomness[i3 + 1] = randomY;
      randomness[i3 + 2] = randomZ;

      // Color
      const mixedColor = insideColor.clone();
      mixedColor.lerp(outsideColor, radius / parameters.radius);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      // Scale
      scales[i] = Math.random();
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute(
      "aRandomness",
      new THREE.BufferAttribute(randomness, 3)
    );
    const galaxyMaterial = new THREE.ShaderMaterial({
      // size: parameters.size,
      // sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      vertexShader: galaxyVertexShader,
      fragmentShader: galaxyFragmentShader,
      uniforms: {
        uTime: this.elapsedTime,
        uSize: { value: parameters.uSize * this.renderer.getPixelRatio() },
        uSpeed: {
          value: parameters.uSpeed,
        },
      },
    });
    this.galaxyPoints = new THREE.Points(geometry, galaxyMaterial);
    this.scene.add(this.galaxyPoints);
  }
  moveParticles() {
    this.particleSystemObject.rotation.z += 0.0002;
    this.lensFlareObject.rotation.z += 0.00015;
    if (this.lensFlareObject.position.x < 750) {
      this.lensFlareObject.position.x += 0.025;
      this.lensFlareObject.position.y -= 0.001;
    } else {
      this.lensFlareObject.position.x = -750;
      this.lensFlareObject.position.y = -50;
    }
  }
  createFallingStar() {
    const path1 = [
      new THREE.Vector3(500, 300, -500),
      new THREE.Vector3(550, 259, -500),
      new THREE.Vector3(631, 200, -500),
    ];
    const options1 = {
      color: "#FFFCEC",
      num: 2000,
      size: 3,
      x: [-1500, 300], // 轴向移动，最小值,最大值
      y: [-400, 100],
      z: [-200, 200],
      rotate: "z",
    };
    const star1 = new FallingStar(path1, options1);
    this.scene.add(star1.mesh);
    const path2 = [
      new THREE.Vector3(600, 0, -100),
      new THREE.Vector3(650, 4, 0),
      new THREE.Vector3(700, 0, 100),
    ];
    const options2 = {
      color: "#FFFCEC",
      num: 2000,
      size: 3,
      x: [-200, 200], // 轴向移动，最小值,最大值
      y: [-300, 300],
      z: [-1200, 1200],
      rotate: "x",
    };
    const star2 = new FallingStar(path2, options2);
    this.scene.add(star2.mesh);

    const path3 = [
      new THREE.Vector3(-600, 0, -100),
      new THREE.Vector3(-650, 4, 0),
      new THREE.Vector3(-700, 0, 100),
    ];
    const options3 = {
      color: "#FFFCEC",
      num: 2000,
      size: 4,
      x: [-200, 200], // 轴向移动，最小值,最大值
      y: [-300, 300],
      z: [-400, 1200],
      rotate: "z",
    };
    const star3 = new FallingStar(path3, options3);
    this.scene.add(star3.mesh);
  }
}

class FallingStar {
  constructor(vec3Arr, option) {
    this.timer = null;
    this.pointNum = option.num ? option.num : 700; // 线条的点的个数
    this.duration = option.duration ? option.duration : 13;
    this.size = option.size ? option.size : 1.0;
    this.delay = option.delay ? option.delay : 0;
    this.color = option.color ? option.color : 0xffff00;
    this.x = option.x ? option.x : [0, 0];
    this.y = option.y ? option.y : [0, 0];
    this.z = option.z ? option.z : [0, 0];
    this.rotate = option.rotate ? option.rotate : "x";
    this.lineCurve = new THREE.CatmullRomCurve3(vec3Arr);
    const points = this.lineCurve.getPoints(this.pointNum);
    this.geometry = new THREE.BufferGeometry().setFromPoints(points);
    // 给每一个顶点设置属性 大小与他们的index成正比，越后面越大
    const pointSizeArray = new Float32Array(points.length);
    for (let i = 0; i < pointSizeArray.length; i++) {
      pointSizeArray[i] = i;
    }
    // 给几何体设置属性，该属性可以在着色器中通过attribute拿到
    this.geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(pointSizeArray, 1)
    );

    // 创建材质
    this.shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: {
          value: 0,
        },
        uColor: {
          value: new THREE.Color(this.color),
        },
        uLength: {
          value: points.length,
        },
        uPointNum: {
          value: this.pointNum,
        },
        uPointSize: {
          value: this.size, // 尺寸系数
        },
      },
      vertexShader: `
            attribute float aSize;
            varying float vSize;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uLength;
            uniform float uPointNum;
            uniform float uPointSize;
            
            void main() {
                vec4 viewPosition = viewMatrix * modelMatrix * vec4(position,1.0);
                gl_Position = projectionMatrix * viewPosition;
                vSize = aSize / 2.0 - uTime;
                if(vSize < 0.0) {
                    vSize = vSize + uLength;
                }
                vSize = (vSize - uPointNum / 1.5) * uPointSize;
                gl_PointSize = (-vSize / viewPosition.z);
            }
            `,
      fragmentShader: `
            varying float vSize;
            uniform vec3 uColor;
            
            void main() {
                float distanceToCenter = distance(gl_PointCoord, vec2(0.5,0.5));
                float strenght = 1.0 - (distanceToCenter * 2.0);
                if(vSize <= 0.0 ) {
                gl_FragColor= vec4(1.0,0.0,0.0,0.0);
                } else {
                gl_FragColor= vec4(uColor,strenght * 0.1);
                }
            }
            `,
    });
    this.mesh = new THREE.Points(this.geometry, this.shaderMaterial);
    this.genearteAnimate();
  }
  genearteAnimate() {
    const delay = this.delay + this.getRandomNum(0, 3); // 0到3秒的延迟
    const duration = this.getRandomNum(0.8, 2);
    const animate = new TWEEN.Tween(this.shaderMaterial.uniforms.uTime);
    animate
      .to(
        {
          value: this.pointNum,
        },
        duration * 1000
      )
      // .repeat(Infinity)
      .delay(delay * 1000);
    animate.onComplete(() => {
      this.mesh.position.x = this.getRandomNum(this.x[0], this.x[1]);
      this.mesh.position.y = this.getRandomNum(this.y[0], this.y[1]);
      this.mesh.position.z = this.getRandomNum(this.z[0], this.z[1]);
      this.mesh.rotation[this.rotate] = Math.PI * this.getRandomNum(0, 2);
      this.shaderMaterial.uniforms.uTime.value = 0;
      this.genearteAnimate();
    });
    animate.start();
  }
  getRandomNum(min, max) {
    return Math.random() * (max - min) + min;
  }
  remove() {
    this.mesh.remove();
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
