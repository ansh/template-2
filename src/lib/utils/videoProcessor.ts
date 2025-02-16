export async function createMemeVideo(
  videoUrl: string,
  caption: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      // Create canvas with 9:16 aspect ratio
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set dimensions (assuming 1080x1920 for high quality)
      canvas.width = 1080;
      canvas.height = 1920;
      
      // Calculate video placement
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / videoAspect;
      const yOffset = (canvas.height - targetHeight) / 2;

      // Start video processing
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Try different codecs in order of preference
      const mimeType = [
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/x-matroska;codecs=h264',
        'video/webm;codecs=h264',
        'video/webm'
      ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

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

      video.onplay = () => {
        const drawFrame = () => {
          // Fill black background
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw video in center
          ctx.drawImage(
            video,
            0,
            yOffset,
            targetWidth,
            targetHeight
          );

          // Configure text style
          const fontSize = 72;
          ctx.font = `bold ${fontSize}px Impact`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          // Wrap text and calculate total height
          const maxWidth = canvas.width - 40; // Leave 20px padding on each side
          const lines = wrapText(ctx, caption, maxWidth);
          const lineHeight = fontSize * 1.2;
          const totalTextHeight = lines.length * lineHeight;
          
          // Position text above video with padding
          const textY = yOffset - 40; // 40px padding above video

          // Draw each line with stroke
          lines.forEach((line, index) => {
            const y = textY - (lines.length - 1 - index) * lineHeight;
            
            // Draw stroke
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 8;
            ctx.strokeText(line, canvas.width / 2, y);
            
            // Draw text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(line, canvas.width / 2, y);
          });

          if (!video.ended) {
            requestAnimationFrame(drawFrame);
          } else {
            mediaRecorder.stop();
          }
        };

        mediaRecorder.start();
        drawFrame();
      };

      video.play();
    };

    video.onerror = reject;
  });
} 