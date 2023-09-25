export default class SphereGeometry {
  constructor(
    radius = 1,
    widthSegments = 8,
    heightSegments = 6,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI
  ) {
    this.type = "SphereGeometry";

    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI); // 0 ~ PI
    // 索引值
    const indices = [];
    // 顶点值
    const vertices = [];
    // 法线值
    const normals = [];
    // uv值
    const uvs = [];

    // 生成球体顶点
    for (let y = 0; y <= heightSegments; y++) {
      // 创建保存每一行的数组
      const v = y / heightSegments;
      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const theta = v * thetaLength + thetaStart;
        const phi = u * phiLength + phiStart;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const px = radius * sinTheta * cosPhi;
        const py = radius * cosTheta;
        const pz = radius * sinTheta * sinPhi;

        vertices.push(px, py, pz, 1.0);
        // 生成法线
        normals.push(px, py, pz);

        // 生成uv
        uvs.push(u, v);
      }
    }

    // 生成索引
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const v1 = y * (widthSegments + 1) + x + 1;
        const v2 = y * (widthSegments + 1) + x;
        const v3 = (y + 1) * (widthSegments + 1) + x;
        const v4 = (y + 1) * (widthSegments + 1) + x + 1;
        indices.push(v1, v2, v4);
        indices.push(v2, v3, v4);
      }
    }

    this.index = new Uint16Array(indices);

    this.attributes = {
      position: new Float32Array(vertices.flat()),
      normal: new Float32Array(normals.flat()),
      uv: new Float32Array(uvs.flat()),
    };

    this.bufferData = {};
  }
}
