/**
 * A Perlin noise implementation for generating smooth organic motion
 */
export class NoiseGenerator {
  private permutation: number[];
  private gradients: [number, number, number][];
  
  constructor() {
    // Initialize permutation table
    this.permutation = this.generatePermutationTable();
    
    // Initialize gradients
    this.gradients = this.generateGradients();
  }
  
  /**
   * Generates a random permutation table
   */
  private generatePermutationTable(): number[] {
    const perm: number[] = [];
    
    // Create array of values 0-255
    for (let i = 0; i < 256; i++) {
      perm[i] = i;
    }
    
    // Shuffle the array
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]]; // Swap
    }
    
    // Extend to 512 elements for easier indexing
    for (let i = 0; i < 256; i++) {
      perm[i + 256] = perm[i];
    }
    
    return perm;
  }
  
  /**
   * Generates random unit gradients for 3D Perlin noise
   */
  private generateGradients(): [number, number, number][] {
    const gradients: [number, number, number][] = [];
    
    for (let i = 0; i < 256; i++) {
      // Generate random points on a unit sphere
      let theta = 2 * Math.PI * Math.random();
      let phi = Math.acos(2 * Math.random() - 1);
      
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.sin(phi) * Math.sin(theta);
      let z = Math.cos(phi);
      
      gradients[i] = [x, y, z];
    }
    
    return gradients;
  }
  
  /**
   * Smoothing function that creates a smooth transition from 0 to 1
   */
  private fade(t: number): number {
    // Improved smoothing function: 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  /**
   * Linear interpolation between a and b by amount t
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  /**
   * Calculate dot product of gradient and distance vectors
   */
  private grad(hash: number, x: number, y: number, z: number): number {
    const gradient = this.gradients[hash & 255];
    return gradient[0] * x + gradient[1] * y + gradient[2] * z;
  }
  
  /**
   * 3D Perlin noise function
   */
  public perlin3D(x: number, y: number, z: number): number {
    // Find unit cube that contains the point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    // Find relative position within cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    // Hash coordinates of the 8 cube corners
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;
    
    // Calculate noise contributions from each corner
    const gradAA = this.grad(this.permutation[AA], x, y, z);
    const gradBA = this.grad(this.permutation[BA], x - 1, y, z);
    const gradAB = this.grad(this.permutation[AB], x, y - 1, z);
    const gradBB = this.grad(this.permutation[BB], x - 1, y - 1, z);
    const gradAA1 = this.grad(this.permutation[AA + 1], x, y, z - 1);
    const gradBA1 = this.grad(this.permutation[BA + 1], x - 1, y, z - 1);
    const gradAB1 = this.grad(this.permutation[AB + 1], x, y - 1, z - 1);
    const gradBB1 = this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1);
    
    // Interpolate along x
    const y1 = this.lerp(gradAA, gradBA, u);
    const y2 = this.lerp(gradAB, gradBB, u);
    const y1z = this.lerp(gradAA1, gradBA1, u);
    const y2z = this.lerp(gradAB1, gradBB1, u);
    
    // Interpolate along y
    const x1 = this.lerp(y1, y2, v);
    const x1z = this.lerp(y1z, y2z, v);
    
    // Interpolate along z
    const result = this.lerp(x1, x1z, w);
    
    // Scale from [-1, 1] to [0, 1]
    return (result + 1) / 2;
  }
  
  /**
   * Fractal Brownian Motion for layered Perlin noise
   * Creates more natural, detailed noise patterns
   */
  public fbm3D(x: number, y: number, z: number, octaves: number = 6, lacunarity: number = 2.0, persistence: number = 0.5): number {
    let total = 0.0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0.0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.perlin3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return total / maxValue;
  }
}
