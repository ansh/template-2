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
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const processingVideo = document.createElement('video');
    processingVideo.src = videoUrl;
    processingVideo.crossOrigin = 'anonymous';
    
    const cleanup = () => {
      const stream = processingVideo.captureStream();
      stream.getTracks().forEach(track => track.stop());
      processingVideo.remove();
    };

    processingVideo.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = 1080;
      canvas.height = 1920;
      
      const videoAspect = processingVideo.videoWidth / processingVideo.videoHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / videoAspect;
      const yOffset = (canvas.height - targetHeight) / 2;

      // Get both video and audio streams
      const canvasStream = canvas.captureStream(30);
      const videoStream = processingVideo.captureStream();
      
      // Add audio track from original video if it exists
      const audioTrack = videoStream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }

      const mimeType = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 8000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      processingVideo.onended = () => {
        mediaRecorder.stop();
      };

      mediaRecorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      processingVideo.onplay = () => {
        const drawFrame = () => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            processingVideo,
            0,
            yOffset,
            targetWidth,
            targetHeight
          );

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

          if (!processingVideo.ended) {
            requestAnimationFrame(drawFrame);
          }
        };

        mediaRecorder.start();
        drawFrame();
      };

      processingVideo.currentTime = 0;
      processingVideo.play();
    };

    processingVideo.onerror = (e) => {
      cleanup();
      reject(e);
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
