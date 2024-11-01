class ShaderViewer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('shader-canvas'),
            antialias: true
        });
        
        this.clock = new THREE.Clock();
        this.isPlaying = true;
        this.uniforms = {
            t: { value: 0 },
            r: { value: new THREE.Vector2() },
            speed: { value: 1.0 },
            hue_shift: { value: 0.0 },
            saturation: { value: 1.0 },
            brightness: { value: 1.0 },
            shape_scale: { value: 1.0 }
        };
        
        this.editor = null;
        this.currentMesh = null;
        this.vertexShader = '';
        this.currentShaderName = 'Untitled';
        this.currentShaderId = null;
        this.isModified = false;
        
        this.init();
    }
    
    init() {
        try {
            this.renderer.getContext().getExtension('WEBGL_depth_texture');
            this.renderer.getContext().getExtension('OES_standard_derivatives');
            
            this.camera.position.z = 1;
            this.renderer.setSize(
                this.renderer.domElement.clientWidth,
                this.renderer.domElement.clientHeight
            );
            
            this.initCodeEditor();
            this.loadShaders();
            this.setupShaderManagement();
            
            window.addEventListener('resize', this.onResize.bind(this));
            this.onResize();
            
            this.setupParameterControls();
            this.animate();
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error);
        }
    }

    setupShaderManagement() {
        document.getElementById('confirmSaveShader').addEventListener('click', async () => {
            try {
                const name = document.getElementById('shaderName').value;
                if (!name) {
                    throw new Error('Shader name is required');
                }

                const code = this.editor.getValue();
                const response = await fetch('/api/shaders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, code })
                });

                if (!response.ok) {
                    throw new Error('Failed to save shader');
                }

                const shader = await response.json();
                this.currentShaderName = shader.name;
                this.currentShaderId = shader.id;
                this.updateSaveStatus(true);
                this.updateShaderNameDisplay();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('saveShaderModal'));
                modal.hide();
                document.getElementById('shaderName').value = '';
            } catch (error) {
                console.error('Save error:', error);
                this.handleError(error);
            }
        });

        document.getElementById('loadShaderBtn').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/shaders');
                if (!response.ok) {
                    throw new Error('Failed to fetch shaders');
                }

                const shaders = await response.json();
                const shaderList = document.getElementById('shaderList');
                shaderList.innerHTML = '';
                shaders.forEach(shader => {
                    const item = document.createElement('button');
                    item.className = 'list-group-item list-group-item-action';
                    item.textContent = shader.name;
                    item.addEventListener('click', () => this.loadShader(shader.id));
                    shaderList.appendChild(item);
                });
            } catch (error) {
                console.error('Load list error:', error);
                this.handleError(error);
            }
        });

        this.editor.on('change', () => {
            this.updateSaveStatus(false);
            this.applyShaderChanges();
        });
    }

    async loadShader(shaderId) {
        try {
            const response = await fetch(`/api/shaders/${shaderId}`);
            if (!response.ok) {
                throw new Error('Failed to load shader');
            }

            const shader = await response.json();
            this.currentShaderName = shader.name;
            this.currentShaderId = shader.id;
            this.editor.setValue(shader.code);
            this.updateSaveStatus(true);
            this.updateShaderNameDisplay();
            this.applyShaderChanges();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('loadShaderModal'));
            modal.hide();
        } catch (error) {
            console.error('Load shader error:', error);
            this.handleError(error);
        }
    }

    updateSaveStatus(saved) {
        this.isModified = !saved;
        const statusDot = document.getElementById('save-status');
        statusDot.className = saved ? 'saved' : 'unsaved';
    }

    updateShaderNameDisplay() {
        document.getElementById('current-shader-name').textContent = this.currentShaderName;
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
    }
    
    async loadShaders() {
        try {
            const vertResponse = await fetch('/static/shaders/default.vert');
            if (!vertResponse.ok) throw new Error('Failed to load vertex shader');
            this.vertexShader = await vertResponse.text();

            const fragResponse = await fetch('/static/shaders/default.frag');
            if (!fragResponse.ok) throw new Error('Failed to load fragment shader');
            const fragmentShader = await fragResponse.text();

            this.editor.setValue(fragmentShader);
            this.createShaderMaterial(this.vertexShader, fragmentShader);
            this.updateSaveStatus(true);
            this.updateShaderNameDisplay();
        } catch (error) {
            console.error('Shader loading error:', error);
            this.handleError(error);
        }
    }
    
    createShaderMaterial(vertexShader, fragmentShader) {
        try {
            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
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
    
    applyShaderChanges() {
        const newFragmentShader = this.editor.getValue();
        this.createShaderMaterial(this.vertexShader, newFragmentShader);
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
            this.uniforms.t.value = this.clock.getElapsedTime();
        }
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate.bind(this));
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
    }
    
    reset() {
        this.clock.start();
        this.uniforms.t.value = 0;
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
        this.uniforms.t.value = 0;
        
        // Capture frames
        for (let i = 0; i < totalFrames; i++) {
            // Update progress
            const progress = (i / totalFrames) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Render frame
            this.renderer.render(this.scene, this.camera);
            
            // Get frame data
            const canvas = this.renderer.domElement;
            const frameData = canvas.toDataURL('image/png').split(',')[1];
            frames.push(frameData);
            
            // Update time
            this.uniforms.t.value += timeStep;
        }
        
        try {
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
        const duration = parseInt(document.getElementById('exportDuration').value);
        const fps = parseInt(document.getElementById('exportFPS').value);
        
        if (duration && fps) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
            modal.hide();
            await viewer.exportVideo(duration, fps);
        }
    });
});
