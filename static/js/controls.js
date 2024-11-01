document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    playPauseBtn.addEventListener('click', () => {
        viewer.togglePlayPause();
        const icon = playPauseBtn.querySelector('i');
        icon.classList.toggle('fa-play');
        icon.classList.toggle('fa-pause');
    });
    
    resetBtn.addEventListener('click', () => {
        viewer.reset();
    });
});
