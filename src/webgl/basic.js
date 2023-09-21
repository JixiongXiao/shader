import Shape from "./basic/shape";
import GlslLearn from "./basic/glslLearn";
import Box from "./basic/box";
import Box3D from "./basic/3dBox";

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
    this.gl.enable(this.gl.DEPTH_TEST);
    // this.gl.enable(this.gl.CULL_FACE);
  }
  run() {
    // this.runShape();
    // this.runGlslShape();
    // this.runRotateBox();
    this.run3DBox();
    this.render();
  }
  runShape() {
    this.shape = new Shape(this.canvas, this.gl);
    // this.drawLineEvent(); // 注册线段绘制事件
    // this.drawRectEvent();
    this.shape.rectangle({
      x: -0.25,
      y: -0.5,
      width: 1 * 0.5,
      height: 1,
      color: [1, 0, 0, 1],
    });
  }
  runRotateBox() {
    this.boxShape = new Box(this.canvas, this.gl);
  }
  runGlslShape() {
    this.rect = new GlslLearn(this.canvas, this.gl);
  }
  run3DBox() {
    this.box3D = new Box3D(this.canvas, this.gl);
    // this.box3D.start();
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
  rotateBoxRender() {
    this.count += 0.16;
    this.vector.x += 1;
    this.vector.y += 1;
    this.rotate += 0.05;
    this.scale += 0.005;
    if (this.vector.x > 500) {
      this.vector.x = 0;
      this.vector.y = 0;
      this.scale = 0.1;
    }
    this.boxShape.rectangle({
      x: -50,
      y: 50,
      width: 100,
      height: -100,
      color: [0.1, 0.2, 0.3, 1],
      tx: this.vector.x,
      ty: this.vector.y,
      rotate: this.rotate,
      scale: this.scale,
    });
    requestAnimationFrame(this.rotateBoxRender.bind(this));
  }
  render() {
    this.boxShape && this.rotateBoxRender();
    this.box3D && this.box3D.update();
    requestAnimationFrame(this.render.bind(this));
  }
}
