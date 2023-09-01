import Shape from "./main/shape";
import GlslLearn from "./main/glslLearn";
import Box from "./main/box";

export default class ThreePlus {
  constructor(dom) {
    this.domElement = document.querySelector(dom);
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
    // this.shape = new Shape(this.canvas, this.gl);
    // this.drawLineEvent(); // 注册线段绘制事件
    // this.drawRectEvent();
    // this.shape.rectangle(-0.25, -0.5, 1 * 0.5, 1, [1, 0, 0, 1]);
    // this.rect = new GlslLearn(this.canvas, this.gl);
    this.boxShape = new Box(this.canvas, this.gl);
    this.boxShape.rectangle(-50, 50, 100, -100, [0.1, 0.2, 0.3, 1]);
  }
  drawLineEvent() {
    window.addEventListener("click", (e) => {
      let x = (e.clientX / window.innerWidth - 0.5) * 2;
      let y = -(e.clientY / window.innerHeight - 0.5) * 2;
      if (this.shape.vertices.length === 0) {
        this.shape.moveTo(x, y);
      } else {
        this.shape.lineTo(x, y);
      }
    });
  }
  drawRectEvent() {
    let point = 0;
    let arr = [];
    window.addEventListener("click", (e) => {
      let x = (e.clientX / window.innerWidth - 0.5) * 2;
      let y = -(e.clientY / window.innerHeight - 0.5) * 2;
      point++;
      arr.push([x, y]);
      this.shape.drawPoint(x, y); // 绘制当前点击的点
      if (point === 2) {
        this.shape.drawPoint(arr[0][0], arr[0][1]); // 绘制第一个点
        let width = arr[1][0] - arr[0][0];
        let height = arr[1][1] - arr[0][1];
        let color = [Math.random(), Math.random(), Math.random(), 1];
        this.shape.rectangle(arr[0][0], arr[0][1], width, height, color);
        arr = [];
        point = 0;
      }
    });
  }
}
