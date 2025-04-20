import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { ParticleSystem } from './ParticleSystem';
import { ShaderParticleSystem } from './ShaderParticleSystem';

// Create a flag to determine which particle system to use (defaults to shader version)
const useShaderParticles = true;

// Color palettes for presets
const colorPresets = {
  cosmic: {
    primary: new THREE.Color(0x5e60ce),
    secondary: new THREE.Color(0x64dfdf),
    background1: new THREE.Color(0x050510),
    background2: new THREE.Color(0x10051f)
  },
  ocean: {
    primary: new THREE.Color(0x0077b6),
    secondary: new THREE.Color(0x00b4d8),
    background1: new THREE.Color(0x03045e),
    background2: new THREE.Color(0x0096c7)
  },
  fire: {
    primary: new THREE.Color(0xef476f),
    secondary: new THREE.Color(0xffd166),
    background1: new THREE.Color(0x540d0d),
    background2: new THREE.Color(0x9e2a2b)
  }
};

// Visual mode parameters
const visualModes = {
  sparkle: {
    noiseScale: 0.05,
    returnForce: 0.001,
    particleSize: 0.15,
    flowSpeed: 0.5
  },
  nebula: {
    noiseScale: 0.02,
    returnForce: 0.0005,
    particleSize: 0.25,
    flowSpeed: 0.3
  },
  vortex: {
    noiseScale: 0.1,
    returnForce: 0.002,
    particleSize: 0.1,
    flowSpeed: 1.2
  }
};

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
  private lights: {
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
    point1: THREE.PointLight;
    point2: THREE.PointLight;
  };
  private currentColorPreset: keyof typeof colorPresets = 'cosmic';
  private currentVisualMode: keyof typeof visualModes = 'sparkle';

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
        time: { value: 0 },
        color1: { value: colorPresets.cosmic.background1 },
        color2: { value: colorPresets.cosmic.background2 }
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
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vPosition;
        
        void main() {
          vec3 baseColor1 = color1;
          vec3 baseColor2 = color2;
          
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
    
    // Initialize lights
    this.lights = {
      ambient: new THREE.AmbientLight(0xffffff, 0.5),
      directional: new THREE.DirectionalLight(0xffffff, 1),
      point1: new THREE.PointLight(colorPresets.cosmic.primary, 1, 100),
      point2: new THREE.PointLight(colorPresets.cosmic.secondary, 1, 100),
    };
    
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
    
    // Add custom event listeners for UI controls
    window.addEventListener('toggleAutoRotate', ((e: CustomEvent) => {
      this.controls.autoRotate = e.detail.enabled;
    }) as EventListener);
    
    window.addEventListener('changeVisualMode', ((e: CustomEvent) => {
      this.applyVisualMode(e.detail.mode);
    }) as EventListener);
    
    window.addEventListener('applyColorPreset', ((e: CustomEvent) => {
      this.applyColorPreset(e.detail.preset);
    }) as EventListener);
    
    // Add lights to scene
    this.scene.add(this.lights.ambient);
    
    this.lights.directional.position.set(1, 1, 1);
    this.scene.add(this.lights.directional);
    
    this.lights.point1.position.set(30, -10, 20);
    this.scene.add(this.lights.point1);
    
    this.lights.point2.position.set(-30, 10, -20);
    this.scene.add(this.lights.point2);
    
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
  
  private applyVisualMode(mode: keyof typeof visualModes): void {
    if (!visualModes[mode]) return;
    
    this.currentVisualMode = mode;
    const settings = visualModes[mode];
    
    // Apply visual mode settings
    if ('setParticleSize' in this.particleSystem) {
      (this.particleSystem as ParticleSystem).setParticleSize(settings.particleSize);
      (document.getElementById('particle-size') as HTMLInputElement).value = settings.particleSize.toString();
      document.getElementById('particle-size-value')!.textContent = settings.particleSize.toString();
    }
    
    if ('setFlowSpeed' in this.particleSystem) {
      this.particleSystem.setFlowSpeed(settings.flowSpeed);
      (document.getElementById('flow-speed') as HTMLInputElement).value = settings.flowSpeed.toString();
      document.getElementById('flow-speed-value')!.textContent = settings.flowSpeed.toString();
    }
    
    // Apply animation for transition
    gsap.to(this.camera.position, {
      z: 50 + Math.random() * 10 - 5,
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
      duration: 1.5,
      ease: 'power2.inOut'
    });
    
    // Create a ripple effect in particles
    this.createRippleEffect();
  }
  
  private applyColorPreset(preset: keyof typeof colorPresets): void {
    if (!colorPresets[preset]) return;
    
    this.currentColorPreset = preset;
    const colors = colorPresets[preset];
    
    // Update point lights
    this.lights.point1.color.copy(colors.primary);
    this.lights.point2.color.copy(colors.secondary);
    
    // Update background colors
    if (this.bgMaterial.uniforms) {
      this.bgMaterial.uniforms.color1.value = colors.background1;
      this.bgMaterial.uniforms.color2.value = colors.background2;
    }
    
    // Create a color pulse animation
    this.createColorPulseAnimation();
  }
  
  private createRippleEffect(): void {
    // Simulate a ripple effect in the particle system
    // This is a placeholder for a more complex implementation
    // that would modify particle positions to create a wave
    
    // For now, we'll just animate the camera
    const currentZoom = this.camera.position.z;
    
    gsap.timeline()
      .to(this.camera.position, {
        z: currentZoom - 5,
        duration: 0.5,
        ease: 'power1.out'
      })
      .to(this.camera.position, {
        z: currentZoom,
        duration: 0.5,
        ease: 'power1.in'
      });
  }
  
  private createColorPulseAnimation(): void {
    // Create a pulse of light to showcase the color change
    const originalIntensity1 = this.lights.point1.intensity;
    const originalIntensity2 = this.lights.point2.intensity;
    
    gsap.timeline()
      .to([this.lights.point1, this.lights.point2], {
        intensity: 3,
        duration: 0.5,
        ease: 'power2.out'
      })
      .to(this.lights.point1, {
        intensity: originalIntensity1,
        duration: 1,
        ease: 'power2.in'
      })
      .to(this.lights.point2, {
        intensity: originalIntensity2,
        duration: 1,
        ease: 'power2.in'
      }, "-=1");
  }
}

// Start the application when the page is loaded
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

// Add type declarations for custom events
declare global {
  interface WindowEventMap {
    'toggleAutoRotate': CustomEvent<{enabled: boolean}>;
    'changeVisualMode': CustomEvent<{mode: string}>;
    'applyColorPreset': CustomEvent<{preset: string}>;
  }
}
