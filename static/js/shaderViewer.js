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
            r: { value: new THREE.Vector2() }
        };
        
        this.editor = null;
        this.currentMesh = null;
        this.vertexShader = '';
        
        this.init();
    }
    
    init() {
        this.camera.position.z = 1;
        this.renderer.setSize(
            this.renderer.domElement.clientWidth,
            this.renderer.domElement.clientHeight
        );
        
        // Initialize CodeMirror
        this.initCodeEditor();
        
        // Load default shaders
        this.loadShaders();
        
        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();
        
        // Setup apply button
        document.getElementById('applyShaderBtn').addEventListener('click', () => {
            this.applyShaderChanges();
        });
        
        // Start animation loop
        this.animate();
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
            
            // Hide error display if it was shown
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

// Initialize viewer
const viewer = new ShaderViewer();
