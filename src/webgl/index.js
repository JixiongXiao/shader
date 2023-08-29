export default class ThreePlus {
  constructor(dom) {
    this.domElement = document.querySelector(dom);
    this.init();
  }
  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.domElement.appendChild(this.canvas);

    // 获取webgl上下文
    this.gl = this.canvas.getContext("webgl");
    // this.gl.enable(this.gl.CULL_FACE);
    this.draw();
  }
  draw() {
    // 创建顶点着色器
    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(
      vShader,
      /*glsl */ `
    attribute vec4 v_position;
    void main() {
     gl_Position = v_position;
     // 设置点的大小
     gl_PointSize = 20.0;
    }`
    );
    this.gl.compileShader(vShader);
    // 创建片元着色器
    const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(
      fShader,
      `
    void main() {
     gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }
    `
    );
    this.gl.compileShader(fShader);

    // 创建着色器程序, 并关联顶点，片元着色器
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vShader);
    this.gl.attachShader(program, fShader);
    this.gl.linkProgram(program);

    // 使用着色器
    this.gl.useProgram(program);

    // 创建顶点数据
    const position = this.gl.getAttribLocation(program, "v_position");
    // 创建缓冲区
    const pBuffer = this.gl.createBuffer();
    // 绑定缓冲区
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, pBuffer);
    // 设置顶点数据
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.5, 0.5, -0.5, -0.5, -0.5]),
      this.gl.STATIC_DRAW
    );

    // 将顶点数据提供给position
    this.gl.vertexAttribPointer(
      position,
      2, // 迭代数，数组中每2个单位为一组
      this.gl.FLOAT,
      false,
      0, //
      0 // 从第0个开始
    );

    // 开启attribute变量
    this.gl.enableVertexAttribArray(position);

    // 用element array方法绘制
    // 创建索引缓冲数据
    const indexBuffer = this.gl.createBuffer();
    // 绑定缓冲数据
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // 设置索引
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint8Array([0, 1, 2, 5, 1, 2]),
      this.gl.STATIC_DRAW
    );
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //绘制
    //绘制方法1
    // this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    // 绘制方法2
    // this.gl.drawElements(this.gl.POINTS, 3, this.gl.UNSIGNED_BYTE, 0);
    // // 绘制方法3
    // this.gl.drawElements(this.gl.LINES, 4, this.gl.UNSIGNED_BYTE, 0);
    // // 绘制方法4
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_BYTE, 0);
  }
}
