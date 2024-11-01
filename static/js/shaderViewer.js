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
    }

    setupShaderManagement() {
        // Save shader functionality
        document.getElementById('confirmSaveShader').addEventListener('click', () => {
            const name = document.getElementById('shaderName').value;
            if (!name) return;

            const code = this.editor.getValue();
            fetch('/api/shaders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, code })
            })
            .then(response => response.json())
            .then(shader => {
                this.currentShaderName = shader.name;
                this.currentShaderId = shader.id;
                this.updateSaveStatus(true);
                this.updateShaderNameDisplay();
                const modal = bootstrap.Modal.getInstance(document.getElementById('saveShaderModal'));
                modal.hide();
                document.getElementById('shaderName').value = '';
            });
        });

        // Load shader list
        document.getElementById('loadShaderBtn').addEventListener('click', () => {
            fetch('/api/shaders')
                .then(response => response.json())
                .then(shaders => {
                    const shaderList = document.getElementById('shaderList');
                    shaderList.innerHTML = '';
                    shaders.forEach(shader => {
                        const item = document.createElement('button');
                        item.className = 'list-group-item list-group-item-action';
                        item.textContent = shader.name;
                        item.addEventListener('click', () => this.loadShader(shader.id));
                        shaderList.appendChild(item);
                    });
                });
        });

        // Set up real-time code change tracking
        this.editor.on('change', () => {
            this.updateSaveStatus(false);
            this.applyShaderChanges();
        });
    }

    loadShader(shaderId) {
        fetch(`/api/shaders/${shaderId}`)
            .then(response => response.json())
            .then(shader => {
                this.currentShaderName = shader.name;
                this.currentShaderId = shader.id;
                this.editor.setValue(shader.code);
                this.updateSaveStatus(true);
                this.updateShaderNameDisplay();
                this.applyShaderChanges();
                const modal = bootstrap.Modal.getInstance(document.getElementById('loadShaderModal'));
                modal.hide();
            });
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
    
    loadShaders() {
        fetch('/static/shaders/default.vert')
            .then(response => response.text())
            .then(vertexShader => {
                this.vertexShader = vertexShader;
                fetch('/static/shaders/default.frag')
                    .then(response => response.text())
                    .then(fragmentShader => {
                        this.editor.setValue(fragmentShader);
                        this.createShaderMaterial(vertexShader, fragmentShader);
                        this.updateSaveStatus(true);
                        this.updateShaderNameDisplay();
                    });
            });
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
}

const viewer = new ShaderViewer();
