// Previous code remains the same until line 277
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

const viewer = new ShaderViewer();

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
