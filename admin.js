document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('upload-status');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent double submissions
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading... Please wait (this may take a moment)';
        statusDiv.className = '';
        statusDiv.textContent = '';

        const formData = new FormData();

        // Append text fields
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('category', document.getElementById('category').value);

        // Append files
        const thumbnailFile = document.getElementById('thumbnail').files[0];
        const videoFile = document.getElementById('video').files[0];

        formData.append('thumbnail', thumbnailFile);
        formData.append('video', videoFile);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.className = 'success';
                statusDiv.textContent = '✅ Success! Video uploaded to your Netflix clone.';
                uploadForm.reset();
            } else {
                statusDiv.className = 'error';
                statusDiv.textContent = '❌ Error: ' + (result.error || 'Failed to upload');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            statusDiv.className = 'error';
            statusDiv.textContent = '❌ Error: Could not connect to the server.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload to StreamFlix';
        }
    });
});
