import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { ParticleSystem } from './ParticleSystem';
import { ShaderParticleSystem } from './ShaderParticleSystem';

// Create a flag to determine which particle system to use (defaults to shader version)
const useShaderParticles = true;

// App class to manage the 3D application
class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem | ShaderParticleSystem;
  private mousePosition: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  private clock: THREE.Clock;
  private background: THREE.Mesh;
  private bgMaterial: THREE.ShaderMaterial;

  constructor() {
    // Initialize properties
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance' 
    });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.mousePosition = new THREE.Vector2(-10, -10); // Off-screen initially
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    
    // Camera initial position
    this.camera.position.z = 50;
    
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    document.getElementById('app')?.appendChild(this.renderer.domElement);
    
    // Configure controls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 100;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    
    // Create particle system
    const particleCount = parseInt((document.getElementById('particle-count') as HTMLInputElement).value);
    const particleSize = parseFloat((document.getElementById('particle-size') as HTMLInputElement).value);
    
    if (useShaderParticles) {
      this.particleSystem = new ShaderParticleSystem(this.scene, particleCount);
    } else {
      this.particleSystem = new ParticleSystem(this.scene, particleCount, particleSize);
    }
    
    // Create background with custom shader
    const bgGeometry = new THREE.SphereGeometry(200, 32, 32);
    this.bgMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vPosition;
        
        void main() {
          vec3 baseColor1 = vec3(0.05, 0.05, 0.1);
          vec3 baseColor2 = vec3(0.1, 0.05, 0.2);
          
          // Gradient based on position
          float t = length(vPosition.xy) / 200.0;
          vec3 color = mix(baseColor1, baseColor2, t);
          
          // Add subtle noise
          float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233)) * 0.5 + time) * 43758.5453);
          color += noise * 0.02;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    this.background = new THREE.Mesh(bgGeometry, this.bgMaterial);
    this.scene.add(this.background);
    
    // Initialize the application
    this.init();
  }

  private init(): void {
    // Set up event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.getElementById('particle-count')?.addEventListener('input', this.updateParticleCount.bind(this));
    document.getElementById('particle-size')?.addEventListener('input', this.updateParticleSize.bind(this));
    document.getElementById('flow-speed')?.addEventListener('input', this.updateFlowSpeed.bind(this));
    document.getElementById('color-intensity')?.addEventListener('input', this.updateColorIntensity.bind(this));
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    
    // Add point lights for more dynamic lighting
    const pointLight1 = new THREE.PointLight(0x3366ff, 1, 100);
    pointLight1.position.set(30, -10, 20);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff6633, 1, 100);
    pointLight2.position.set(-30, 10, -20);
    this.scene.add(pointLight2);
    
    // Start animation loop
    this.animate();
    
    // Intro animation
    this.introAnimation();
  }

  private introAnimation(): void {
    gsap.from(this.camera.position, {
      z: 200,
      duration: 2.5,
      ease: 'power3.out'
    });
    
    gsap.from('.info, .controls', {
      opacity: 0,
      y: 20,
      duration: 1.5,
      delay: 0.5,
      ease: 'power3.out'
    });
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update shader uniforms
    if (this.bgMaterial.uniforms) {
      this.bgMaterial.uniforms.time.value = elapsedTime * 0.1;
    }
    
    // Update controls
    this.controls.update();
    
    // Update particle system
    this.particleSystem.update(delta, this.mousePosition);
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    // Update mouse position in normalized device coordinates
    this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private updateParticleCount(): void {
    const value = parseInt((document.getElementById('particle-count') as HTMLInputElement).value);
    if ('setParticleCount' in this.particleSystem) {
      this.particleSystem.setParticleCount(value);
    }
  }

  private updateParticleSize(): void {
    const value = parseFloat((document.getElementById('particle-size') as HTMLInputElement).value);
    if ('setParticleSize' in this.particleSystem) {
      (this.particleSystem as ParticleSystem).setParticleSize(value);
    }
  }

  private updateFlowSpeed(): void {
    const value = parseFloat((document.getElementById('flow-speed') as HTMLInputElement).value);
    if ('setFlowSpeed' in this.particleSystem) {
      this.particleSystem.setFlowSpeed(value);
    }
  }

  private updateColorIntensity(): void {
    const value = parseFloat((document.getElementById('color-intensity') as HTMLInputElement).value);
    if ('setColorIntensity' in this.particleSystem) {
      this.particleSystem.setColorIntensity(value);
    }
  }
}

// Start the application when the page is loaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
