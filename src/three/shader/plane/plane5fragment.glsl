varying vec2 vUv; 
uniform float uelapseTime; 
#define M_PI 3.1415926535897932384626433832795
#define border(B,X) smoothstep(B, B+1e-4, X)
#define saturate(X) clamp(X,0.0,1.0)

#define drawPointX 0.9

vec4 screenColor(float x) {
	return vec4(.0,x*0.75,x*0.4,1.0);
}

void main()
{
	// Normalized pixel coordinates (from 0 to 1)
	vec2 uv = vUv;
	
	float tx = uv.x + uelapseTime * 0.3;
	float dy = uv.y + 0.2*sin(20.0*tx);
	float sinLine = saturate(border(0.95, sin(M_PI * dy)) - (0.75 - uv.x));
	if(uv.x > drawPointX) { sinLine = 0.0; }
	
	float hLines = border(0.99, sin(M_PI * uv.y * 10.0 + 0.1) * 1.2);
	float vLines = border(0.99, sin(M_PI * uv.x * 16.0 + 0.1) * 1.2);
	float grid = 1.0 * saturate(hLines + vLines);
	
	float drawDot = smoothstep(.88, .89, .9 - length(vec2(uv.x,dy)-vec2(drawPointX,0.5)));
	
	// Output to screen
	gl_FragColor = screenColor(saturate(sinLine + grid));
	
}
// 底下为原版备份
// varying vec2 vUv; 
// uniform float uelapseTime; 
// #define M_PI 3.1415926535897932384626433832795
// #define border(B,X) smoothstep(B, B+1e-4, X)
// #define saturate(X) clamp(X,0.0,1.0)

// #define drawPointX 0.75

// vec4 screenColor(float x) {
// 	return vec4(.0,x*0.75,x,1.0);
// }

// void main()
// {
// 	// Normalized pixel coordinates (from 0 to 1)
// 	vec2 uv = vUv;
	
// 	float tx = uv.x + uelapseTime * 0.3;
// 	float dy = uv.y + 0.2*sin(20.0*tx);
// 	float sinLine = saturate(border(0.9999, sin(M_PI * dy)) - (0.75 - uv.x));
// 	if(uv.x > drawPointX) { sinLine = 0.0; }
	
// 	float hLines = border(0.99, sin(M_PI * uv.y * 20.0 + 0.1));
// 	float vLines = border(0.99, sin(M_PI * uv.x * 32.0 + 0.1));
// 	float grid = 0.3 * saturate(hLines + vLines);
	
// 	float drawDot = smoothstep(.88, .89, .9 - length(vec2(uv.x,dy)-vec2(drawPointX,0.5)));
	
// 	// Output to screen
// 	gl_FragColor = screenColor(saturate(sinLine + grid + drawDot));
// }
