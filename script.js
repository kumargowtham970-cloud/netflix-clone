document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    const authSection = document.getElementById('auth-section');

    // Check login state
    const userJson = localStorage.getItem('streamflix_user');
    if (userJson) {
        const user = JSON.parse(userJson);
        authSection.innerHTML = `
            <div class="user-avatar" title="${user.name}"></div>
            <i class="fas fa-caret-down"></i>
            <button onclick="logout()" style="background: none; border: none; color: #fff; cursor: pointer; margin-left: 10px;">Logout</button>
        `;
    }

    // Expose logout to window so the inline onclick can find it
    window.logout = function () {
        localStorage.removeItem('streamflix_user');
        window.location.reload();
    };

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Slider controls
    const sliders = document.querySelectorAll('.slider');

    function updateHandles(slider, leftHandle, rightHandle) {
        const canScrollLeft = slider.scrollLeft > 0;
        const canScrollRight = slider.scrollLeft < (slider.scrollWidth - slider.clientWidth - 5); // 5px buffer

        if (canScrollLeft) {
            leftHandle.style.opacity = '1';
            leftHandle.style.pointerEvents = 'all';
        } else {
            leftHandle.style.opacity = '0';
            leftHandle.style.pointerEvents = 'none';
        }

        if (canScrollRight) {
            rightHandle.style.opacity = '1';
            rightHandle.style.pointerEvents = 'all';
        } else {
            rightHandle.style.opacity = '0';
            rightHandle.style.pointerEvents = 'none';
        }
    }

    sliders.forEach((slider, index) => {
        const container = slider.closest('.row-container');
        const leftHandle = container.querySelector('.left-handle');
        const rightHandle = container.querySelector('.right-handle');

        // Move right
        rightHandle.addEventListener('click', () => {
            const width = slider.clientWidth;
            slider.scrollBy({
                left: width * 0.8,
                behavior: 'smooth'
            });
        });

        // Move left
        leftHandle.addEventListener('click', () => {
            const width = slider.clientWidth;
            slider.scrollBy({
                left: -(width * 0.8),
                behavior: 'smooth'
            });
        });

        // Update handles on scroll
        slider.addEventListener('scroll', () => {
            updateHandles(slider, leftHandle, rightHandle);
        });

        // Initial check and also check after a small delay (for dynamic content)
        setTimeout(() => updateHandles(slider, leftHandle, rightHandle), 500);

        // Use ResizeObserver to detect content changes or window resizing
        const resizeObserver = new ResizeObserver(() => {
            updateHandles(slider, leftHandle, rightHandle);
        });
        resizeObserver.observe(slider);
    });

    // Video Modal functionality
    const modal = document.getElementById('video-modal');
    const mainPlayBtn = document.getElementById('main-play-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const rotateBtn = document.getElementById('rotate-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const video = document.getElementById('netflix-video');

    // Also add event listeners to all row movie play buttons
    const rowPlayBtns = document.querySelectorAll('.fa-play-circle');

    let currentRotation = 0;
    let currentZoom = 1;
    let fillMode = false;

    function applyTransform() {
        const container = video.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        video.style.transform = `rotate(${currentRotation}deg)`;

        let baseScale = currentZoom;

        // Auto-scale to fill the screen if fillMode is on
        if (fillMode) {
            const containerAspect = containerWidth / containerHeight;
            const videoAspect = (currentRotation % 180 === 0)
                ? (video.videoWidth / video.videoHeight)
                : (video.videoHeight / video.videoWidth);

            if (videoAspect > containerAspect) {
                // Video is wider than container, scale based on height
                const actualVideoHeight = (currentRotation % 180 === 0) ? video.videoHeight : video.videoWidth;
                // Since the video is absolute 100%, we use its rendered size
                baseScale *= containerHeight / ((currentRotation % 180 === 0) ? video.offsetHeight : video.offsetWidth);
            } else {
                // Video is taller than container, scale based on width
                baseScale *= containerWidth / ((currentRotation % 180 === 0) ? video.offsetWidth : video.offsetHeight);
            }
            video.style.objectFit = 'cover';
        } else {
            video.style.objectFit = 'contain';
        }

        video.style.transform += ` scale(${baseScale})`;
    }

    rotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRotation = (currentRotation + 90) % 360;
        applyTransform();
    });

    zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fillMode = true;
        currentZoom += 0.25;
        applyTransform();
    });

    zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentZoom = Math.max(0.25, currentZoom - 0.25);
        if (currentZoom <= 1) fillMode = false;
        applyTransform();
    });

    // Custom Video Controls Elements
    const playPauseBtn = document.getElementById('play-pause-btn');
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeElem = document.getElementById('current-time');
    const durationElem = document.getElementById('duration');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const customControls = document.getElementById('custom-controls');

    // Format time function for video player
    function formatTime(timeInSeconds) {
        const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);
        return {
            minutes: result.substr(3, 2),
            seconds: result.substr(6, 2)
        };
    }

    // Play/Pause
    function togglePlay() {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    playPauseBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);

    // Update time and progress bar
    video.addEventListener('timeupdate', () => {
        const time = formatTime(video.currentTime);
        currentTimeElem.innerText = `${parseInt(time.minutes)}:${time.seconds}`;

        const progressPercent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    });

    // Load duration when video loads
    video.addEventListener('loadedmetadata', () => {
        const time = formatTime(video.duration);
        durationElem.innerText = `${parseInt(time.minutes)}:${time.seconds}`;
    });

    // Seek functionality
    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = video.duration;
        video.currentTime = (clickX / width) * duration;
    });

    // Volume control
    muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        volumeSlider.value = video.muted ? 0 : video.volume;
        muteBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });

    volumeSlider.addEventListener('input', (e) => {
        video.volume = e.target.value;
        video.muted = e.target.value == 0;
        if (video.volume == 0) muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        else if (video.volume < 0.5) muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        else muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    });

    // Fullscreen control for the whole modal content
    fullscreenBtn.addEventListener('click', () => {
        const modalContent = document.querySelector('.video-modal-content');

        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
            const requestFS = modalContent.requestFullscreen || modalContent.webkitRequestFullscreen || modalContent.mozRequestFullScreen || modalContent.msRequestFullscreen;
            if (requestFS) {
                requestFS.call(modalContent).then(() => {
                    fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                }).catch(err => {
                    console.log(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            }
        } else {
            const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exitFS) exitFS.call(document);
        }
    });

    // Handle fullscreen change to update icon and controls
    const handleFSChange = () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            customControls.style.opacity = '1';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    document.addEventListener('mozfullscreenchange', handleFSChange);
    document.addEventListener('MSFullscreenChange', handleFSChange);

    // Auto-hide controls in fullscreen
    let controlsTimeout;
    const hideControls = () => {
        const modalContent = document.querySelector('.video-modal-content');
        if (document.fullscreenElement) {
            customControls.style.opacity = '0';
            if (modalContent) modalContent.style.cursor = 'none';
        }
    };

    modal.addEventListener('mousemove', () => {
        if (document.fullscreenElement) {
            customControls.style.opacity = '1';
            const modalContent = document.querySelector('.video-modal-content');
            if (modalContent) modalContent.style.cursor = 'default';
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(hideControls, 3000);
        }
    });

    // Open/Close Modal handling enhancements
    function openModal() {
        modal.classList.add('show');
        currentRotation = 0; // Reset rotation every time modal opens
        currentZoom = 1;     // Reset zoom every time modal opens
        applyTransform();
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    function closeModal() {
        modal.classList.remove('show');
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (document.fullscreenElement) document.exitFullscreen();
    }

    mainPlayBtn.addEventListener('click', openModal);

    rowPlayBtns.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    closeModalBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside the video container
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Fetches videos from MongoDB backend
    async function fetchVideos() {
        try {
            const response = await fetch('/api/videos');
            const videos = await response.json();

            // If we have videos, replace the first row with our dynamic content
            if (videos && videos.length > 0) {
                renderVideos(videos);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    }

    function renderVideos(videos) {
        // Find all movie rows
        const rows = document.querySelectorAll('.movie-row');

        // Create a map of row titles to their sliders
        const rowMap = {};
        rows.forEach(row => {
            const title = row.querySelector('.row-title').textContent.trim();
            const slider = row.querySelector('.slider');
            if (title && slider) {
                rowMap[title] = slider;
                // Optional: Clear existing static content if we have dynamic content for this row
                // slider.innerHTML = ''; 
            }
        });

        // Group videos by category
        videos.forEach(videoData => {
            const targetSlider = rowMap[videoData.category];

            // If the row exists, append the video card to it
            if (targetSlider) {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.innerHTML = `
                    <img src="${videoData.thumbnailUrl}" alt="${videoData.title}">
                    <div class="movie-info">
                        <div class="movie-actions">
                            <i class="fas fa-play-circle play-dynamic-btn" data-video="${videoData.videoUrl}"></i>
                            <i class="fas fa-plus-circle"></i>
                            <i class="far fa-thumbs-up"></i>
                            <i class="fas fa-chevron-circle-down" style="margin-left: auto;"></i>
                        </div>
                        <h4 style="margin: 8px 0;">${videoData.title}</h4>
                        <p class="movie-match">99% Match <span class="movie-rating">${videoData.category}</span></p>
                        <p class="movie-tags">${videoData.description.substring(0, 30)}...</p>
                    </div>
                `;

                // Add click event to open modal
                card.addEventListener('click', () => {
                    video.src = videoData.videoUrl;
                    video.load();
                    openModal();
                });

                targetSlider.appendChild(card);
            }
        });
    }

    // Call fetch when page loads
    fetchVideos();
});
