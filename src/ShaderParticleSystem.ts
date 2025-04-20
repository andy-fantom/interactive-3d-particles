import * as THREE from 'three';
import { createParticleShaderMaterial } from './Shaders';
import { NoiseGenerator } from './NoiseGenerator';

/**
 * Advanced particle system using custom shaders
 */
export class ShaderParticleSystem {
  private particles: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;
  private velocities: Float32Array;
  private originalPositions: Float32Array;
  private noiseGen: NoiseGenerator;
  private scene: THREE.Scene;
  private particleCount: number;
  private time: number = 0;
  private flowSpeed: number = 0.5;
  private colorIntensity: number = 1.0;

  constructor(scene: THREE.Scene, particleCount: number = 5000) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.noiseGen = new NoiseGenerator();
    
    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();
    
    // Create arrays for attributes
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.opacities = new Float32Array(this.particleCount);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    
    // Initialize particles
    this.initParticles();
    
    // Create material with custom shaders
    this.particleMaterial = new THREE.ShaderMaterial(createParticleShaderMaterial());
    
    // Create mesh
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      // Distribute particles in a 3D shape (here a sphere)
      const radius = 25 * Math.cbrt(Math.random()); // Use cube root for uniform volume distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      const i3 = i * 3;
      
      // Position
      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;
      
      // Store original position
      this.originalPositions[i3] = x;
      this.originalPositions[i3 + 1] = y;
      this.originalPositions[i3 + 2] = z;
      
      // Initial velocity
      this.velocities[i3] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Color - create a beautiful color palette
      const distanceNormalized = Math.sqrt(x*x + y*y + z*z) / 25;
      const angle = Math.atan2(y, x);
      
      this.colors[i3] = 0.5 + 0.5 * Math.sin(distanceNormalized * 5.0); // Red
      this.colors[i3 + 1] = 0.5 + 0.5 * Math.sin(angle * 2.0 + distanceNormalized * 3.0); // Green
      this.colors[i3 + 2] = 0.5 + 0.5 * Math.cos(distanceNormalized * 4.0 + phi); // Blue
      
      // Size - varies by distance from center
      this.sizes[i] = 0.1 + 0.2 * Math.pow(Math.random(), 2);
      
      // Opacity - varies by distance from center
      this.opacities[i] = 0.5 + 0.5 * Math.random();
    }
    
    // Set attributes
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(this.colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));
  }

  public update(delta: number, mousePosition: THREE.Vector2): void {
    // Increment time
    this.time += delta * 0.5;
    
    // Convert mouse position to 3D direction
    const raycaster = new THREE.Raycaster();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    raycaster.setFromCamera(mousePosition, camera);
    const mouseDirection = raycaster.ray.direction.clone().multiplyScalar(20);
    
    // Update each particle
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Current position
      const x = this.positions[i3];
      const y = this.positions[i3 + 1];
      const z = this.positions[i3 + 2];
      
      // Noise-based motion
      const noiseScale = 0.05;
      const timeScale = 0.2;
      
      // Use fBm for more natural movement
      const noiseX = this.noiseGen.fbm3D(x * noiseScale, y * noiseScale, z * noiseScale + this.time * timeScale, 4) * 2 - 1;
      const noiseY = this.noiseGen.fbm3D(x * noiseScale + 100, y * noiseScale, z * noiseScale + this.time * timeScale, 4) * 2 - 1;
      const noiseZ = this.noiseGen.fbm3D(x * noiseScale, y * noiseScale + 100, z * noiseScale + this.time * timeScale, 4) * 2 - 1;
      
      // Mouse influence
      const mouseDist = Math.sqrt(
        Math.pow(x - mouseDirection.x, 2) +
        Math.pow(y - mouseDirection.y, 2) +
        Math.pow(z - mouseDirection.z, 2)
      );
      
      const mouseForce = Math.max(0, 1 - mouseDist / 15);
      const mouseVectorX = (mouseDirection.x - x) * mouseForce * 0.02;
      const mouseVectorY = (mouseDirection.y - y) * mouseForce * 0.02;
      const mouseVectorZ = (mouseDirection.z - z) * mouseForce * 0.02;
      
      // Return force to original position
      const returnScale = 0.001;
      const returnX = (this.originalPositions[i3] - x) * returnScale;
      const returnY = (this.originalPositions[i3 + 1] - y) * returnScale;
      const returnZ = (this.originalPositions[i3 + 2] - z) * returnScale;
      
      // Update velocity
      this.velocities[i3] += (noiseX * this.flowSpeed + mouseVectorX + returnX) * delta;
      this.velocities[i3 + 1] += (noiseY * this.flowSpeed + mouseVectorY + returnY) * delta;
      this.velocities[i3 + 2] += (noiseZ * this.flowSpeed + mouseVectorZ + returnZ) * delta;
      
      // Apply damping
      const damping = 0.95;
      this.velocities[i3] *= damping;
      this.velocities[i3 + 1] *= damping;
      this.velocities[i3 + 2] *= damping;
      
      // Update position
      this.positions[i3] += this.velocities[i3];
      this.positions[i3 + 1] += this.velocities[i3 + 1];
      this.positions[i3 + 2] += this.velocities[i3 + 2];
      
      // Update size based on velocity
      const velocityMag = Math.sqrt(
        this.velocities[i3] * this.velocities[i3] +
        this.velocities[i3 + 1] * this.velocities[i3 + 1] +
        this.velocities[i3 + 2] * this.velocities[i3 + 2]
      );
      
      // Update particle size
      this.sizes[i] = 0.1 + velocityMag * 2;
      
      // Update color based on velocity
      const colorChange = velocityMag * 5 * this.colorIntensity;
      this.colors[i3] = Math.min(1, Math.max(0, this.colors[i3] + (Math.random() - 0.5) * 0.01 + colorChange * 0.1));
      this.colors[i3 + 1] = Math.min(1, Math.max(0, this.colors[i3 + 1] + (Math.random() - 0.5) * 0.01 + colorChange * 0.05));
      this.colors[i3 + 2] = Math.min(1, Math.max(0, this.colors[i3 + 2] + (Math.random() - 0.5) * 0.01 + colorChange * 0.15));
    }
    
    // Update buffer attributes
    (this.particleGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.particleGeometry.attributes.customColor as THREE.BufferAttribute).needsUpdate = true;
    (this.particleGeometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }

  public setParticleCount(count: number): void {
    if (count === this.particleCount) return;
    
    // Remove old particles
    this.scene.remove(this.particles);
    
    // Update count
    this.particleCount = count;
    
    // Recreate arrays
    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.opacities = new Float32Array(this.particleCount);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    
    // Create new geometry
    this.particleGeometry = new THREE.BufferGeometry();
    
    // Initialize particles
    this.initParticles();
    
    // Create new mesh
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);
  }

  public setFlowSpeed(speed: number): void {
    this.flowSpeed = speed;
  }

  public setColorIntensity(intensity: number): void {
    this.colorIntensity = intensity;
  }
}
