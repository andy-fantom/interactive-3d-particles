/**
 * Custom shaders for the particle system
 */

export const ParticleVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float opacity;
  
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    vColor = customColor;
    vOpacity = opacity;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const ParticleFragmentShader = `
  uniform sampler2D pointTexture;
  
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    // Create a soft particle effect
    float distance = length(gl_PointCoord - vec2(0.5, 0.5));
    if (distance > 0.5) discard;
    
    // Calculate a soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, distance);
    
    // Apply color and opacity
    gl_FragColor = vec4(vColor, vOpacity * alpha);
  }
`;

// Utility function to create shader material
export function createParticleShaderMaterial() {
  return {
    uniforms: {
      pointTexture: { value: null }
    },
    vertexShader: ParticleVertexShader,
    fragmentShader: ParticleFragmentShader,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  };
}
