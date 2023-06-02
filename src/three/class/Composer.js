import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm//shaders/FXAAShader.js";
import { GammaCorrectionShader } from "three/examples/jsm//shaders/GammaCorrectionShader.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";

export default class Composer {
  constructor(renderer, scene, camera, dom) {
    this.composer = null;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.dom = dom;
    this.allOutlinePass = [];
    this.init();
  }
  init() {
    const renderPass = new RenderPass(this.scene, this.camera);

    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();
    fxaaPass.material.uniforms["resolution"].value.x =
      1 / (this.dom.offsetWidth * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
      1 / (this.dom.offsetHeight * pixelRatio);
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(fxaaPass);
    this.composer.addPass(gammaCorrection);
  }
  initOutLinePass(set = {}) {
    const params = {
      edgeStrength: 4.0, // 明暗
      edgeGlow: 1.0, // 外层光晕
      edgeThickness: 3.0, // 线条粗细
      pulsePeriod: 0, // 呼吸频率
      visibleEdgeColor: "#34EBF0",
      hiddenEdgeColor: "#190a05",
    };
    const keys = Object.keys(set);
    if (keys.length > 0) {
      keys.forEach((key) => {
        params[key] = set[key];
      });
    }
    const vec2 = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const outlinePass = new OutlinePass(vec2, this.scene, this.camera);
    outlinePass.visibleEdgeColor.set(params.visibleEdgeColor);
    outlinePass.hiddenEdgeColor.set(params.hiddenEdgeColor);
    outlinePass.edgeStrength = params.edgeStrength; // 线条明暗
    outlinePass.edgeGlow = params.edgeGlow; // outline外层光晕
    outlinePass.edgeThickness = params.edgeThickness; // 线条粗细
    outlinePass.pulsePeriod = params.pulsePeriod; // 呼吸灯
    outlinePass.set = (arr) => {
      outlinePass.selectedObjects = arr;
    };
    this.composer.addPass(outlinePass);
    this.allOutlinePass.push(outlinePass);
    return outlinePass;
  }
  initBloomPass(set = {}) {
    const params = {
      threshold: 0.85,
      radius: 0.4,
      strength: 1.5,
    };
    const vec2 = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const bloomPass = new UnrealBloomPass(vec2, 1.5, 0.4, 0.75);
    this.composer.addPass(bloomPass);
    return bloomPass;
  }
  render() {
    this.composer.render();
  }
}
