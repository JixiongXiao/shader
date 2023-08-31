export default class Shape {
  constructor(canvas, gl) {
    this.canvas = canvas;
    this.gl = gl;
    this.initShader();
    this.initProgram();
    this.initDraw();
  }
  initShader() {
    // 创建顶点着色器
    this.vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(
      this.vShader,
      /*glsl */ `
    attribute vec4 v_position;
    varying vec4 v_color;
    attribute vec4 a_color;
    void main() {
     gl_Position = v_position;
     v_color = a_color;
     // 设置点的大小
     gl_PointSize = 20.0;
    }`
    );
    this.gl.compileShader(this.vShader);
    // 创建片元着色器
    this.fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(
      this.fShader,
      /*glsl */ `
      precision mediump float;
      uniform vec4 uColor;
      varying vec4 v_color;
    void main() {
     // gl_FragColor = vec4(v_color.xyz,1.0);
     gl_FragColor = vec4(uColor.xyz,1.0);
    }
    `
    );
    this.gl.compileShader(this.fShader);
  }
  initProgram() {
    // 创建着色器程序, 并关联顶点，片元着色器
    const program = this.gl.createProgram();
    this.gl.attachShader(program, this.vShader);
    this.gl.attachShader(program, this.fShader);
    this.gl.linkProgram(program);

    // 使用着色器
    this.gl.useProgram(program);
    this.program = program;
  }
  initDraw() {
    // 创建顶点数据
    this.position = this.gl.getAttribLocation(this.program, "v_position");
    // 创建缓冲区
    this.pBuffer = this.gl.createBuffer();
    // 绑定缓冲区
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pBuffer);

    // 将顶点数据提供给position
    this.gl.vertexAttribPointer(
      this.position,
      2, // 迭代数，数组中每2个单位为一组
      this.gl.FLOAT,
      false,
      0, //
      0 // 从第0个开始
    );

    // 开启attribute变量
    this.gl.enableVertexAttribArray(this.position);
    this.vertices = [];

    this.uColor = this.gl.getUniformLocation(this.program, "uColor");
    this.gl.uniform4f(this.uColor, 1.0, 1.0, 0.0, 1.0);

    // 设置顶点颜色
    // this.aColor = this.gl.getAttribLocation(this.program, "a_color");
    // this.cBuffer = this.gl.createBuffer();
    // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cBuffer);
    // this.gl.vertexAttribPointer(this.aColor, 4, this.gl.FLOAT, false, 0, 0);
    // this.gl.enableVertexAttribArray(this.aColor);

    // this.colors = [
    //   0.0,
    //   0.0,
    //   0.0,
    //   1.0, // 黑
    //   1.0,
    //   0.0,
    //   0.0,
    //   1.0, // 红
    //   0.0,
    //   1.0,
    //   0.0,
    //   1.0, // 绿
    //   0.0,
    //   0.0,
    //   1.0,
    //   1.0, // 蓝
    // ];

    // this.gl.bufferData(
    //   this.gl.ARRAY_BUFFER,
    //   new Float32Array(this.colors),
    //   this.gl.STATIC_DRAW
    // );
  }
  drawPoint(x, y) {
    this.vertices = [x, y];
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      this.gl.STATIC_DRAW
    );
    this.gl.uniform4f(this.uColor, 1.0, 1.0, 0.0, 1.0);
    this.gl.drawArrays(this.gl.POINTS, 0, 1);
  }
  moveTo(x, y) {
    this.vertices.push(x, y);
    // 设置顶点数据
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      this.gl.STATIC_DRAW
    );
    this.gl.drawArrays(this.gl.POINTS, 0, this.vertices.length / 2); //2维数组，2个值组成1个点，该参数表示一共绘制多少个点
  }
  lineTo(x, y) {
    this.vertices.push(x, y);
    // 设置顶点数据
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      this.gl.STATIC_DRAW
    );
    this.gl.drawArrays(this.gl.POINTS, 0, this.vertices.length / 2);
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.vertices.length / 2);
  }
  rectangle(x, y, width, height, color) {
    this.vertices = [
      x,
      y,
      x + width,
      y,
      x + width,
      y + height,
      x,
      y + height,
      x,
      y,
    ];
    this.gl.uniform4f(this.uColor, ...color);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      this.gl.STATIC_DRAW
    );
    // 创建索引数据
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    //两个三角形绘制矩形
    // this.gl.bufferData(
    //   this.gl.ELEMENT_ARRAY_BUFFER,
    //   new Uint8Array([0, 1, 3, 3, 1, 2]),
    //   this.gl.STATIC_DRAW
    // );
    // // 绘制
    // this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_BYTE, 0);

    // 一个三角带绘制矩形
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint8Array([0, 1, 3, 2]),
      this.gl.STATIC_DRAW
    );
    // 绘制
    this.gl.drawElements(this.gl.TRIANGLE_STRIP, 4, this.gl.UNSIGNED_BYTE, 0);
  }
}
