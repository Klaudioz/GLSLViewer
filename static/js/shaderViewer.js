// Previous ShaderViewer class implementation remains the same until line 357
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
