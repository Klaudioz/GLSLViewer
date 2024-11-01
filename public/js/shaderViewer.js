class ShaderViewer {
    constructor() {
        // Initialize THREE.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('shader-canvas'),
            antialias: true,
            preserveDrawingBuffer: true // Required for video export
        });

        // Initialize clock and animation state
        this.clock = new THREE.Clock();
        this.isPlaying = true;
        this.time = 0;

        // Initialize shader uniforms
        this.uniforms = {
            t: { value: 0 },
            r: { value: new THREE.Vector2() },
            speed: { value: 1.0 },
            hue_shift: { value: 0.0 },
            saturation: { value: 1.0 },
            brightness: { value: 1.0 },
            shape_scale: { value: 1.0 }
        };

        // Initialize tracking properties
        this.currentShaderName = 'Untitled';
        this.hasUnsavedChanges = false;
        this.currentMesh = null;
        this.vertexShader = '';
        this.editor = null;

        this.init();
    }

    init() {
        try {
            // Setup WebGL context and extensions
            this.renderer.getContext().getExtension('OES_standard_derivatives');
            this.renderer.getContext().getExtension('WEBGL_depth_texture');

            // Setup camera
            this.camera.position.z = 1;

            // Initialize renderer size
            this.renderer.setSize(
                this.renderer.domElement.clientWidth,
                this.renderer.domElement.clientHeight
            );

            // Initialize code editor
            this.initCodeEditor();
            
            // Load initial shaders
            this.loadShaders();

            // Setup event listeners
            window.addEventListener('resize', this.onResize.bind(this));
            this.onResize();

            // Setup parameter controls
            this.setupParameterControls();

            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error);
        }
    }

    initCodeEditor() {
        this.editor = CodeMirror.fromTextArea(document.getElementById('shader-code'), {
            mode: 'x-shader/x-fragment',
            theme: 'monokai',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            autoCloseBrackets: true,
            scrollbarStyle: null
        });

        this.editor.on('change', () => {
            this.hasUnsavedChanges = true;
            this.updateShader(this.editor.getValue());
        });
    }

    async loadShaders() {
        try {
            const vertResponse = await fetch('/shaders/default.vert');
            const fragResponse = await fetch('/shaders/default.frag');

            if (!vertResponse.ok || !fragResponse.ok) {
                throw new Error('Failed to load shaders');
            }

            this.vertexShader = await vertResponse.text();
            const fragmentShader = await fragResponse.text();

            this.editor.setValue(fragmentShader);
            this.updateShader(fragmentShader);
            
            this.hasUnsavedChanges = false;
            this.updateSaveStatus();
        } catch (error) {
            console.error('Shader loading error:', error);
            this.handleError(error);
        }
    }

    updateShader(fragmentShader) {
        try {
            const material = new THREE.ShaderMaterial({
                vertexShader: this.vertexShader,
                fragmentShader: fragmentShader,
                uniforms: this.uniforms
            });

            if (this.currentMesh) {
                this.scene.remove(this.currentMesh);
            }

            this.currentMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                material
            );

            this.scene.add(this.currentMesh);
            document.getElementById('error-display').classList.add('d-none');
        } catch (error) {
            console.error('Shader compilation error:', error);
            this.handleError(error);
        }
    }

    setupParameterControls() {
        const controls = {
            'speed': { min: 0, max: 2, step: 0.1, default: 1.0 },
            'hue_shift': { min: 0, max: 1, step: 0.1, default: 0.0 },
            'saturation': { min: 0, max: 2, step: 0.1, default: 1.0 },
            'brightness': { min: 0, max: 2, step: 0.1, default: 1.0 },
            'shape_scale': { min: 0.1, max: 2, step: 0.1, default: 1.0 }
        };

        Object.entries(controls).forEach(([param, config]) => {
            const input = document.getElementById(`${param}-control`);
            const value = document.getElementById(`${param}-value`);
            
            if (input && value) {
                input.value = config.default;
                value.textContent = config.default;
                
                input.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    this.uniforms[param].value = val;
                    value.textContent = val.toFixed(1);
                });
            }
        });
    }

    handleError(error) {
        const errorDisplay = document.getElementById('error-display');
        const errorMessage = document.getElementById('error-message');
        
        errorDisplay.classList.remove('d-none');
        errorMessage.textContent = error.message;
    }

    onResize() {
        const width = this.renderer.domElement.clientWidth;
        const height = this.renderer.domElement.clientHeight;
        
        this.renderer.setSize(width, height);
        this.uniforms.r.value.set(width, height);
    }

    animate() {
        if (this.isPlaying) {
            this.time = this.clock.getElapsedTime();
            this.uniforms.t.value = this.time;
        }
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate.bind(this));
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.clock.start();
        } else {
            this.clock.stop();
        }
    }

    reset() {
        // Reset clock and time uniforms
        this.clock.start();
        this.time = 0;
        this.uniforms.t.value = 0;

        // Reset all shader parameters to their default values
        const controls = {
            'speed': 1.0,
            'hue_shift': 0.0,
            'saturation': 1.0,
            'brightness': 1.0,
            'shape_scale': 1.0
        };

        // Update uniform values and UI controls
        Object.entries(controls).forEach(([param, defaultValue]) => {
            this.uniforms[param].value = defaultValue;
            const input = document.getElementById(`${param}-control`);
            const value = document.getElementById(`${param}-value`);
            
            if (input && value) {
                input.value = defaultValue;
                value.textContent = defaultValue.toFixed(1);
            }
        });

        // Re-render the scene
        this.renderer.render(this.scene, this.camera);
    }

    updateSaveStatus() {
        const statusDot = document.getElementById('save-status');
        statusDot.className = this.hasUnsavedChanges ? 'unsaved' : 'saved';
    }

    async exportVideo(duration, fps) {
        const frames = [];
        const totalFrames = duration * fps;
        const timeStep = 1 / fps;
        const progressBar = document.querySelector('#export-progress .progress-bar');
        
        // Show progress bar
        document.getElementById('export-progress').classList.remove('d-none');
        
        // Pause animation during export
        const wasPlaying = this.isPlaying;
        this.isPlaying = false;
        
        // Reset time
        this.time = 0;
        this.uniforms.t.value = 0;
        
        try {
            // Capture frames
            for (let i = 0; i < totalFrames; i++) {
                // Update progress
                const progress = (i / totalFrames) * 100;
                progressBar.style.width = `${progress}%`;
                
                // Render frame
                this.renderer.render(this.scene, this.camera);
                
                // Get frame data
                const frameData = this.renderer.domElement.toDataURL('image/png').split(',')[1];
                frames.push(frameData);
                
                // Update time
                this.time += timeStep;
                this.uniforms.t.value = this.time;
            }
            
            // Send frames to server
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    frames,
                    fps,
                    duration
                })
            });
            
            if (!response.ok) {
                throw new Error('Export failed');
            }
            
            // Get video blob URL
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `shader_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            this.handleError(error);
        } finally {
            // Hide progress bar
            document.getElementById('export-progress').classList.add('d-none');
            progressBar.style.width = '0%';
            
            // Restore animation state
            this.isPlaying = wasPlaying;
            if (wasPlaying) {
                this.clock.start();
            }
        }
    }
}

// Initialize viewer after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.viewer = new ShaderViewer();
    
    // Add export button handler
    document.getElementById('exportBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('exportModal'));
        modal.show();
    });

    document.getElementById('confirmExport').addEventListener('click', async () => {
        const durationInput = document.getElementById('exportDuration');
        const duration = parseInt(durationInput.value);
        const fps = parseInt(document.getElementById('exportFPS').value);
        
        // Validate duration
        if (duration < 2 || duration > 10) {
            durationInput.classList.add('is-invalid');
            return;
        }
        
        durationInput.classList.remove('is-invalid');
        const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        modal.hide();
        await viewer.exportVideo(duration, fps);
    });

    // Add duration input validation
    const durationInput = document.getElementById('exportDuration');
    durationInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value < 2 || value > 10) {
            e.target.classList.add('is-invalid');
        } else {
            e.target.classList.remove('is-invalid');
        }
    });
});
