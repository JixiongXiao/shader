varying vec3 vPosition;
varying vec2 vUv;
uniform float uelapseTime;

float sphere(vec2 coord, vec2 pos, float r) {
	vec2 d = pos - coord; 
	return smoothstep(60.0, 0.0, dot(d, d) - r * r);
}

vec4 GradualAnimate(vec2 fragCoord) {
 float FALLING_SPEED = 0.25;
 float STRIPES_FACTOR = 5.0;
	vec2 iResolution = vec2(0.8, 1.0);
	vec2 uv = fragCoord / iResolution.xy;
	vec2 clamped_uv = (round(uv / STRIPES_FACTOR) * STRIPES_FACTOR) / iResolution.xy;
	float value = fract(sin(clamped_uv.x) * 43758.5453123);
	//create stripes
	vec3 col = vec3(1.0 - mod(uv.y * 0.5 + (uelapseTime * (FALLING_SPEED + value / 5.0)) + value, 0.5));
	col *= clamp(cos(uelapseTime * 2.0 + uv.xyx + vec3(0, 2, 4)), 0.0, 1.0);
	col += vec3(sphere(fragCoord, vec2(clamped_uv.x, (1.0 - 2.0 * mod((uelapseTime * (FALLING_SPEED + value / 5.0)) + value, 0.5))) * iResolution.xy, 0.9)) / 2.0; 
	col *= vec3(exp(-pow(abs(uv.y - 0.5), 6.0) / pow(2.0 * 0.05, 2.0)));
	return vec4(col, 1.0);
}
		
void main() {
 gl_FragColor = GradualAnimate(vUv);
    // gl_FragColor = vec4(vUv.x,vUv.y,1.0,1.0);

}