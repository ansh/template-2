// Add type declaration at the top of the file
declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}

import { TextSettings } from '@/lib/types/meme';

// Add Label interface at the top
interface Label {
  id: string;
  text: string;
  horizontalPosition: number;
  verticalPosition: number;
  size: number;
  font: string;
}

export async function createMemeVideo(
  videoUrl: string,
  caption: string,
  backgroundImage?: string,
  isGreenscreen?: boolean,
  textSettings?: TextSettings,
  labels?: Label[]
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const processingVideo = document.createElement('video');
    const backgroundImg = new Image();
    let isBackgroundLoaded = false;
    
    if (isGreenscreen && backgroundImage) {
      backgroundImg.crossOrigin = 'anonymous';
      backgroundImg.onload = () => {
        isBackgroundLoaded = true;
        if (processingVideo.readyState >= 2) {
          processingVideo.play();
        }
      };
      backgroundImg.src = backgroundImage;
    }

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
          // Clear canvas
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (isGreenscreen && isBackgroundLoaded) {
            // First draw the background
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
            
            // Create a temporary canvas for the video frame
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;
            
            // Draw video frame to temp canvas
            tempCtx.drawImage(processingVideo, 0, 0, targetWidth, targetHeight);
            
            // Get image data for processing
            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imageData.data;

            // Green screen removal with improved thresholds
            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              
              // Improved green screen detection
              if (g > 100 && g > 1.4 * r && g > 1.4 * b) {
                pixels[i + 3] = 0; // Make pixel transparent
              }
            }

            // Put processed frame back
            tempCtx.putImageData(imageData, 0, 0);
            
            // Draw processed frame onto main canvas
            ctx.drawImage(tempCanvas, 0, yOffset, targetWidth, targetHeight);
          } else {
            // Regular video drawing
            ctx.drawImage(processingVideo, 0, yOffset, targetWidth, targetHeight);
          }

          // Draw caption with adjusted position
          const fontSize = textSettings ? textSettings.size : Math.floor(canvas.width * 0.078);
          ctx.font = `bold ${fontSize}px ${textSettings?.font || 'Impact'}`;
          ctx.textAlign = textSettings?.alignment || 'center';
          ctx.textBaseline = 'bottom';
          
          const maxWidth = canvas.width * 0.9;
          const lines = wrapText(ctx, caption, maxWidth);
          const lineHeight = fontSize * 1.2;

          // Calculate vertical position
          const textY = canvas.height * (textSettings?.verticalPosition || 25) / 100;

          // Calculate x position based on alignment
          const x = textSettings?.alignment === 'left' 
            ? canvas.width * 0.05 
            : textSettings?.alignment === 'right' 
              ? canvas.width * 0.95 
              : canvas.width / 2;

          lines.forEach((line, index) => {
            const y = textY + (index * lineHeight);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = fontSize * 0.08;
            ctx.strokeText(line, x, y);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(line, x, y);
          });

          // Draw labels
          if (labels?.length) {
            labels.forEach(label => {
              if (!label.text.trim()) return;
              
              const x = canvas.width * (label.horizontalPosition / 100);
              const y = canvas.height * (label.verticalPosition / 100);
              
              // Use label's size instead of caption size
              ctx.font = `bold ${label.size}px ${label.font}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Draw text with outline - use label.size for line width
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = label.size * 0.08;
              ctx.strokeText(label.text, x, y);
              
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(label.text, x, y);
            });
          }

          if (!processingVideo.ended) {
            requestAnimationFrame(drawFrame);
          }
        };

        mediaRecorder.start();
        drawFrame();
      };

      // Remove the seek delay for final video
      if (!isGreenscreen || (isGreenscreen && isBackgroundLoaded)) {
        processingVideo.play();
      }
    };

    processingVideo.onerror = (e) => {
      cleanup();
      reject(e);
    };
  });
}
// Helper function to wrap text
function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // Split text into lines based on user's line breaks first
  const userLines = text.split('\n');
  const lines: string[] = [];

  // Then handle word wrapping within each line
  userLines.forEach(userLine => {
    if (userLine.trim() === '') {
      // Preserve empty lines
      lines.push('');
      return;
    }

    const words = userLine.split(' ');
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
  });

  return lines;
}
