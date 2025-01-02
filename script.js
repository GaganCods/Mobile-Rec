let mediaRecorder;
let recordedChunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const recordType = document.getElementById('recordType');
const cameraMode = document.getElementById('cameraMode');
const preview = document.getElementById('preview');
const recorded = document.getElementById('recorded');

async function startRecording() {
    recordedChunks = [];
    let stream;

    try {
        if (recordType.value === 'screen') {
            // Check if running on mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Mobile screen recording
                if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            displaySurface: 'browser',
                            width: { ideal: window.screen.width },
                            height: { ideal: window.screen.height },
                            frameRate: { ideal: 30 }
                        },
                        audio: true
                    });
                } else {
                    throw new Error('Screen recording is not supported on this mobile device');
                }
            } else {
                // Desktop screen recording
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
            }
        } else {
            // Camera recording remains the same
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: cameraMode.value
                },
                audio: true
            });
        }

        // Set video constraints for better mobile performance
        preview.srcObject = stream;
        preview.setAttribute('playsinline', ''); // Important for iOS

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp8,opus'
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, {
                type: 'video/webm'
            });
            recorded.src = URL.createObjectURL(blob);
            downloadBtn.disabled = false;
        };

        mediaRecorder.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        recordType.disabled = true;
        cameraMode.disabled = true;
    } catch (err) {
        console.error('Error:', err);
        if (err.name === 'NotAllowedError') {
            alert('Permission denied. Please allow screen recording access.');
        } else if (err.name === 'NotSupportedError') {
            alert('Screen recording is not supported on this device/browser.');
        } else {
            alert('Error starting recording: ' + err.message);
        }
    }
}

function stopRecording() {
    mediaRecorder.stop();
    preview.srcObject.getTracks().forEach(track => track.stop());
    preview.srcObject = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    recordType.disabled = false;
    cameraMode.disabled = false;
}

function downloadRecording() {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'recording.webm';
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadRecording);

// Show/hide camera mode select based on record type
recordType.addEventListener('change', () => {
    cameraMode.style.display = recordType.value === 'camera' ? 'block' : 'none';
});

// Add detection for mobile browser support
function checkMobileSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // Check if screen recording is supported
        if (!('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices)) {
            recordType.querySelector('option[value="screen"]').disabled = true;
            recordType.value = 'camera';
            alert('Screen recording is not supported on this device. Only camera recording will be available.');
        }
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', checkMobileSupport);
