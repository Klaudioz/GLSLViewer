# Real-time Shader Editor

A simple real-time shader editor that allows you to modify GLSL shaders and see the changes immediately.

## Setup

1. Install the requirements:
```bash
pip install -r requirements.txt
```

2. Clone the repository:
```bash
git clone https://github.com/yourusername/glsl-shader-editor.git
cd glsl-shader-editor
```

3. Update the Font Awesome kit code in `templates/index.html`:
Replace `your-code.js` with your Font Awesome kit code:
```html
<script src="https://kit.fontawesome.com/your-code.js"></script>
```

4. Start the Flask server:
```bash
python main.py
```

5. Open your web browser and navigate to:
```
http://localhost:5000
```

6. The default shader will automatically load and start animating.

7. Use the controls below the shader viewport to:
   - Play/Pause the animation
   - Reset the animation timer

8. View the shader code in the right panel
   - Any compilation errors will be displayed below the code

## Project Structure

```
├── main.py                 # Flask application entry point
├── static/
│   ├── css/
│   │   └── styles.css     # Custom styling
│   ├── js/
│   │   ├── controls.js    # Playback control handlers
│   │   └── shaderEditor.js # Main WebGL rendering logic
│   └── shaders/
│       ├── default.frag   # Fragment shader
│       └── default.vert   # Vertex shader
└── templates/
    └── index.html         # Main application template
```

## Default Shader

The default shader implements a dynamic 3D effect using ray marching techniques and HSV color space. It creates an abstract, animated visualization with the following features:

- Dynamic color gradients based on elevation and radius
- Animated camera movement through a procedural landscape
- Layered sine waves for terrain generation
- Time-based animation

## Customizing Shaders

To use your own shader:

1. Replace the content of `static/shaders/default.frag` with your fragment shader code
2. Available uniforms:
   - `t`: Time in seconds (float)
   - `r`: Resolution in pixels (vec2)
3. The vertex shader can also be customized by modifying `static/shaders/default.vert`

## Acknowledgments

- Three.js for WebGL rendering
- Flask for the web server
- Bootstrap for UI components
- Font Awesome for icons

## Contact

Your Name - [@klaudioz](https://twitter.com/klaudioz)

Project Link: [https://github.com/yourusername/glsl-shader-editor](https://github.com/yourusername/glsl-shader-editor)

Repl template: https://replit.com/@Klaudioz/GLSLShaderEditor