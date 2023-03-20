varying vec3 vPosition;
varying vec2 vUv;
uniform float uelapseTime;

		
  		vec4 GradualAnimate(vec2 uv) {
			float speed = 0.1;
			float num = 10.0;
			float gap = 0.9;
			float strength = step(gap, mod(cos(uv.y) * 1.5 * num, 1.0)) * step(gap, mod((uv.y - (uelapseTime * speed)) * num, 1.0));
			return vec4(uv, 1.0, strength);
		}

void main() {
 gl_FragColor = GradualAnimate(vUv);
    // gl_FragColor = vec4(vUv.x,vUv.y,1.0,1.0);

}