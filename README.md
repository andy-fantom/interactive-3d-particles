# Interactive 3D Particles

A beautiful and unique 3D particle system built with TypeScript and Three.js. This project demonstrates advanced 3D graphics techniques with interactive particles that respond to user input.

![Interactive 3D Particles Demo](https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Interactive+3D+Particles)

## Features

- Stunning 3D particle effects with smooth animations
- Interactive mouse-controlled particle behavior
- Perlin noise-based organic motion
- Custom shader implementation for enhanced visuals
- Responsive design that works on various screen sizes
- Performance-optimized with buffer geometry and instancing
- User-configurable settings for particle count, size, flow speed, and color intensity

## Live Demo

You can view a live demo [here](#) (coming soon).

## Technologies Used

- TypeScript for type-safe code
- Three.js for 3D rendering
- Custom GLSL shaders for advanced visual effects
- Perlin noise algorithms for natural motion
- Vite for fast development and building

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/andy-fantom/interactive-3d-particles.git
   cd interactive-3d-particles
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

- **Mouse movement**: Attracts particles
- **Scroll**: Zoom in/out
- **Slider controls**: Adjust particle properties

## Building for Production

To build the project for production:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Customization

You can customize the behavior and appearance of the particles by modifying the following files:

- `src/ParticleSystem.ts`: Basic particle system implementation
- `src/ShaderParticleSystem.ts`: Advanced shader-based particle system
- `src/NoiseGenerator.ts`: Noise generation for organic movement
- `src/Shaders.ts`: GLSL shader code

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Three.js for the excellent 3D library
- The creative coding community for inspiration
