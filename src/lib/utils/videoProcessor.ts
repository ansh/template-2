// Add type declaration at the top of the file
declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}

export async function createMemeVideo(
  videoUrl: string,
  caption: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Add timeout protection
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video processing timed out'));
    }, 30000); // 30 second timeout

    console.log('Starting video processing:', videoUrl);
    
    // State tracking
    let isSetup = false;
    let mediaRecorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];

    // Create video element
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1080;
    canvas.height = 1920;

    function drawTextOverlay() {
      const fontSize = 72;
      ctx.font = `bold ${fontSize}px Impact`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const maxWidth = canvas.width - 40;
      const lines = wrapText(ctx, caption, maxWidth);
      const lineHeight = fontSize * 1.2;
      const textY = canvas.height / 4;

      lines.forEach((line, index) => {
        const y = textY - (lines.length - 1 - index) * lineHeight;
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(line, canvas.width / 2, y);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, canvas.width / 2, y);
      });
    }

    function cleanup() {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      video.pause();
      video.src = '';
      video.remove();
      canvas.remove();
    }

    // Wait for video metadata to load
    video.addEventListener('loadedmetadata', () => {
      if (isSetup) return;
      isSetup = true;

      const videoAspect = video.videoWidth / video.videoHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / videoAspect;
      const yOffset = (canvas.height - targetHeight) / 2;

      // Set up streams
      const canvasStream = canvas.captureStream(30); // Specify framerate
      const audioStream = video.captureStream();
      
      // Add audio if available
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }

      try {
        mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 8000000
        });
      } catch (e) {
        console.error('MediaRecorder creation failed:', e);
        cleanup();
        reject(e);
        return;
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        clearTimeout(timeout); // Clear timeout on success
        const blob = new Blob(chunks, { type: 'video/webm' });
        cleanup();
        resolve(blob);
      };

      // Start recording and playing
      let animationFrame: number;

      function animate() {
        if (video.ended || !mediaRecorder) {
          cancelAnimationFrame(animationFrame);
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          return;
        }

        // Calculate and report progress
        const progress = (video.currentTime / video.duration) * 100;
        onProgress?.(progress);

        // Draw video frame
        ctx.drawImage(video, 0, yOffset, targetWidth, targetHeight);
        
        // Draw black bars
        if (yOffset > 0) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, yOffset);
          ctx.fillRect(0, yOffset + targetHeight, canvas.width, yOffset);
        }
        
        // Draw caption
        drawTextOverlay();
        
        animationFrame = requestAnimationFrame(animate);
      }

      // Start the process
      video.currentTime = 0;
      mediaRecorder.start();
      video.play().then(() => {
        animate();
      }).catch(err => {
        console.error('Playback failed:', err);
        cleanup();
        reject(err);
      });
    }, { once: true }); // Only run setup once

    video.onerror = (err) => {
      console.error('Video error:', err);
      cleanup();
      reject(err);
    };
  });
}

// Helper function to wrap text
function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = context.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
} 