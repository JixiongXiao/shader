export default class GlslLearn {
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
      `
    attribute vec4 v_position;
    varying vec4 vPosition;
    void main() {
     gl_Position = v_position;
     vPosition = v_position + 0.5;
     // 设置点的大小
     gl_PointSize = 20.0;
    }`
    );
    this.gl.compileShader(this.vShader);
    // 创建片元着色器
    this.fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    // this.gl.shaderSource(this.fShader, this.fragmentShader("normal")); // 普通
    // this.gl.shaderSource(this.fShader, this.fragmentShader("random")); // 随机函数
    // this.gl.shaderSource(this.fShader, this.fragmentShader("random1D")); // // 一维随机
    // this.gl.shaderSource(this.fShader, this.fragmentShader("random2D")); // // 二维随机
    this.gl.shaderSource(this.fShader, this.fragmentShader("noise")); // // 二维随机

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
  fragmentShader(type) {
    if (type === "normal")
      return `
      precision mediump float;
      uniform vec4 uColor;
      varying vec4 vPosition;
    void main() {
      // float c = pow(2.0, vPosition.x - 1.0);
      // float c = sign(log(vPosition.x * 5.0 + 0.1));
      // 向上取整
      // float c = ceil(vPosition.x*10.0) / 10.0;
      // 向下取整
      float c = floor(vPosition.x*10.0) / 20.0;
      c += floor(vPosition.y*10.0) / 20.0;
     gl_FragColor = vec4(c,c,c,1.0);
    }
    `;
    if (type === "random")
      return /* glsl*/ `
      precision mediump float;
      uniform vec4 uColor;
      varying vec4 vPosition;
      float random(vec2 st){
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453);
      }
    void main() {
      float c = dot(vPosition.xy,vec2(12.9898,78.233));  // 用点乘将2维坐标转换成一维坐标
      c = sin(c); // 将一维坐标转换为-1到1之间的值
      c = c * 43758.51453; // 将数值转换到一个比较大的范围，这个值可以是任意的
      c = fract(c); // 取该值的小数部分
     gl_FragColor = vec4(c,c,c,1.0);
    }
    `;
    if (type === "random1D")
      return /*glsl*/ `
      precision mediump float;
      #define r 43758.5453
      uniform vec4 uColor;
      varying vec4 vPosition;
      float random(float n){
        return fract(sin(n)*r);
      }
    void main() {
      float i = floor(vPosition.x * 10.0);
      float f = fract(vPosition.x * 10.0);
      float c = mix(random(i),random(i + 1.0),f);
     gl_FragColor = vec4(c,c,c,1.0);
    }
      `;
    if (type === "random2D")
      return /*glsl*/ `
      precision mediump float;
      #define r 43758.5453
      uniform vec4 uColor;
      varying vec4 vPosition;
      float random(vec2 st){
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*r);
      }
    void main() {
      vec2 i = floor(vPosition.xy * 10.0);
      vec2 f = fract(vPosition.xy * 10.0);
      f = smoothstep(0.0,1.0,f);
      float a = random(i);
      float b = random(i + vec2(1.0,0.0));
      float c = random(i + vec2(0.0,1.0));
      float d = random(i + vec2(1.0,1.0));
      float mixN = mix(a,b,f.x); // 相当于a * (1.0 - f.x) + b * f.x
      float z = a * (1.0 - f.x) + b * f.x + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.y * f.x;
     gl_FragColor = vec4(z,z,z,1.0);
    }
      `;
    if (type === "noise")
      return /*glsl*/ `
      precision mediump float;
      #define r 43758.5453
      uniform vec4 uColor;
      varying vec4 vPosition;
      float random(vec2 st){
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*r);
      }
      float noise(vec2 st) {
      vec2 i = floor(st.xy);
      vec2 f = fract(st.xy);
      f = smoothstep(0.0,1.0,f);
      float a = random(i);
      float b = random(i + vec2(1.0,0.0));
      float c = random(i + vec2(0.0,1.0));
      float d = random(i + vec2(1.0,1.0));
      float mixN = mix(a,b,f.x); // 相当于a * (1.0 - f.x) + b * f.x
      float z = a * (1.0 - f.x) + b * f.x + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.y * f.x;
      return z;
      }
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 2.0;
        for(int i=0; i<6; i++) {
          value += amplitude*noise(st);
          st *= frequency;
          amplitude *= 0.5;
        }
        return value;
      }
    void main() {
      vec2 st = vPosition.xy;
      float z = noise(st * 10.0);
      float c = fbm(st * 15.0);
      z = c;

     gl_FragColor = vec4(z,z,z,1.0);
    }
    `;
  }
}
