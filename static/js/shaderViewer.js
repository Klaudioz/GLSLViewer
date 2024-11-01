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
            t: { value: 0 },              // Changed from time to t
            r: { value: new THREE.Vector2() }  // Changed from resolution to r
        };
        
        this.init();
    }
    
    init() {
        this.camera.position.z = 1;
        this.renderer.setSize(
            this.renderer.domElement.clientWidth,
            this.renderer.domElement.clientHeight
        );
        
        // Create plane geometry that fills the view
        const geometry = new THREE.PlaneGeometry(2, 2);
        
        // Load default shaders
        this.loadShaders();
        
        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();
        
        // Start animation loop
        this.animate();
    }
    
    loadShaders() {
        fetch('/static/shaders/default.vert')
            .then(response => response.text())
            .then(vertexShader => {
                fetch('/static/shaders/default.frag')
                    .then(response => response.text())
                    .then(fragmentShader => {
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
            
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                material
            );
            
            this.scene.add(mesh);
            
            // Display shader code
            document.getElementById('shader-code').textContent = fragmentShader;
            
            // Hide error display if it was shown
            document.getElementById('error-display').classList.add('d-none');
        } catch (error) {
            this.handleError(error);
        }
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
        this.uniforms.r.value.set(width, height);  // Changed from resolution to r
    }
    
    animate() {
        if (this.isPlaying) {
            this.uniforms.t.value = this.clock.getElapsedTime();  // Changed from time to t
        }
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate.bind(this));
    }
    
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
    }
    
    reset() {
        this.clock.start();
        this.uniforms.t.value = 0;  // Changed from time to t
    }
}

// Initialize viewer
const viewer = new ShaderViewer();
