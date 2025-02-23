export async function createMemePreview(
  videoUrl: string,
  caption: string,
  backgroundImage?: string,
  isGreenscreen?: boolean
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const backgroundImg = new Image();
    let isBackgroundLoaded = false;
    
    if (isGreenscreen && backgroundImage) {
      backgroundImg.crossOrigin = 'anonymous';
      backgroundImg.onload = () => {
        isBackgroundLoaded = true;
        if (video.readyState >= 2) {
          renderPreview();
        }
      };
      backgroundImg.src = backgroundImage;
    }

    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    
    const renderPreview = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = 1080;
      canvas.height = 1920;
      
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetWidth = canvas.width;
      const targetHeight = targetWidth / videoAspect;
      const yOffset = (canvas.height - targetHeight) / 2;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isGreenscreen && isBackgroundLoaded) {
        // Draw background
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        
        // Create temporary canvas for green screen processing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        
        // Draw video frame
        tempCtx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Process green screen
        const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          
          if (g > 100 && g > 1.4 * r && g > 1.4 * b) {
            pixels[i + 3] = 0;
          }
        }

        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, yOffset, targetWidth, targetHeight);
      } else {
        // Draw regular video frame
        ctx.drawImage(video, 0, yOffset, targetWidth, targetHeight);
      }

      // Draw caption
      const fontSize = Math.floor(canvas.width * 0.078);
      ctx.font = `bold ${fontSize}px Impact`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const maxWidth = canvas.width * 0.9;
      const lines = wrapText(ctx, caption, maxWidth);
      const lineHeight = fontSize * 1.2;

      if (isGreenscreen) {
        // Position at 25% from top
        const quarterHeight = canvas.height * 0.25;
        lines.forEach((line, index) => {
          const y = quarterHeight + (index * lineHeight);
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = fontSize * 0.08;
          ctx.strokeText(line, canvas.width / 2, y);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(line, canvas.width / 2, y);
        });
      } else {
        // Position above video
        const textY = yOffset - 40;
        lines.forEach((line, index) => {
          const y = textY - (lines.length - 1 - index) * lineHeight;
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = fontSize * 0.08;
          ctx.strokeText(line, canvas.width / 2, y);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(line, canvas.width / 2, y);
        });
      }

      resolve(canvas);
    };

    video.onloadeddata = () => {
      // Seek to 0.1 seconds for stable green screen preview
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      if (!isGreenscreen || (isGreenscreen && isBackgroundLoaded)) {
        renderPreview();
      }
    };

    video.onerror = (e) => {
      reject(e);
    };
  });
}

// Helper function to wrap text (same as in videoProcessor.ts)
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