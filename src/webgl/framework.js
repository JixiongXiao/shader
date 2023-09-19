import Shape from "./basic/shape";
import GlslLearn from "./basic/glslLearn";
import Box from "./basic/box";

export default class ThreePlus {
  constructor(dom) {
    this.domElement = document.querySelector(dom);
    this.vector = { x: 0, y: 0 };
    this.rotate = 0;
    this.scale = 0.1;
    this.count = 0;
    this.judge = true;
    this.init();
    this.run();
  }
  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.domElement.appendChild(this.canvas);

    // 获取webgl上下文
    this.gl = this.canvas.getContext("webgl");
    // this.gl.enable(this.gl.CULL_FACE);
  }
  run() {
    this.render();
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
  }
}
