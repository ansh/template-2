export async function createMemeVideo(
  videoUrl: string,
  caption: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto'; // Ensure video is preloaded

    video.onloadedmetadata = () => {
      // Store original duration
      const originalDuration = video.duration;
      
      // Create canvas with 9:16 aspect ratio
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = 1080;
      canvas.height = 1920;
      
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / videoAspect;
      const yOffset = (canvas.height - targetHeight) / 2;

      // Function to draw text overlay
      const drawTextOverlay = () => {
        const fontSize = 72;
        ctx.font = `bold ${fontSize}px Impact`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const maxWidth = canvas.width - 40;
        const lines = wrapText(ctx, caption, maxWidth);
        const lineHeight = fontSize * 1.2;
        const textY = yOffset - 40;

        lines.forEach((line, index) => {
          const y = textY - (lines.length - 1 - index) * lineHeight;
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.strokeText(line, canvas.width / 2, y);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(line, canvas.width / 2, y);
        });
      };

      const stream = canvas.captureStream();
      
      const mimeType = [
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/x-matroska;codecs=h264',
        'video/webm;codecs=h264',
        'video/webm'
      ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      let startTime: number;
      const frameInterval = 1000 / 30;
      let frameCount = 0;

      // Wait for video to be ready before starting
      video.oncanplaythrough = () => {
        // Draw first frame with video and text
        ctx.drawImage(
          video,
          0,
          yOffset,
          targetWidth,
          targetHeight
        );

        // Draw black bars if needed
        if (yOffset > 0) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, yOffset);
          ctx.fillRect(0, yOffset + targetHeight, canvas.width, yOffset);
        }

        // Draw text on first frame
        drawTextOverlay();

        startTime = performance.now();
        mediaRecorder.start();
        
        const drawFrame = () => {
          const targetTime = (frameCount * frameInterval) / 1000;
          
          if (targetTime <= originalDuration) {
            // Draw video frame
            ctx.drawImage(
              video,
              0,
              yOffset,
              targetWidth,
              targetHeight
            );

            // Draw black bars if needed
            if (yOffset > 0) {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, yOffset);
              ctx.fillRect(0, yOffset + targetHeight, canvas.width, yOffset);
            }

            // Draw text overlay
            drawTextOverlay();

            frameCount++;
            requestAnimationFrame(drawFrame);
          } else {
            mediaRecorder.stop();
            video.pause();
          }
        };

        video.play().then(drawFrame).catch(reject);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };
    };

    video.onerror = reject;
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