export default class Box {
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
    uniform mat2 u_rotation;
    uniform mat2 u_viewMatrix;
    uniform vec2 u_translation;
    uniform mat2 u_scaleMatrix;
    void main() {
     vec2 pos = v_position.xy; // 坐标
     pos = u_rotation * pos; // 旋转矩阵转换
     pos = u_scaleMatrix * pos; // 缩放矩阵
     pos =  pos + u_translation; // 位移坐标
     pos = u_viewMatrix  * pos; // 视图矩阵转换
     gl_Position = vec4(pos,0,1);

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

    // viewMatrix传值
    this.u_viewMatrix = this.gl.getUniformLocation(
      this.program,
      "u_viewMatrix"
    );
    let width = window.innerWidth / 2;
    let heigth = window.innerHeight / 2;
    this.gl.uniformMatrix2fv(this.u_viewMatrix, false, [
      1 / width,
      0,
      0,
      1 / heigth,
    ]);

    // u_translation传值
    this.u_translation = this.gl.getUniformLocation(
      this.program,
      "u_translation"
    );
    this.gl.uniform2f(this.u_translation, 0, 0); // 后两位为位移的像素距离
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
  rectangle(set) {
    const { x, y, width, height, color } = set;
    let tx = set.tx || 0;
    let ty = set.ty || 0;
    let rotate = set.rotate || 0;
    let scale = set.scale || 1;
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

    // u_translation传值
    this.u_translation = this.gl.getUniformLocation(
      this.program,
      "u_translation"
    );
    this.gl.uniform2f(this.u_translation, tx, ty); // 后两位为位移的像素距离

    // umatrix传值
    this.u_rotation = this.gl.getUniformLocation(this.program, "u_rotation");
    this.gl.uniformMatrix2fv(this.u_rotation, false, [
      Math.cos(rotate),
      Math.sin(rotate),
      -Math.sin(rotate),
      Math.cos(rotate),
    ]);

    // uscale 传值
    this.u_scaleMatrix = this.gl.getUniformLocation(
      this.program,
      "u_scaleMatrix"
    );
    this.gl.uniformMatrix2fv(this.u_scaleMatrix, false, [scale, 0, 0, scale]);

    // 创建索引数据
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

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
