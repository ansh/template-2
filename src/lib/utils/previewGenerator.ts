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

export async function createMemePreview(
  videoUrl: string,
  caption: string,
  backgroundImage?: string,
  isGreenscreen?: boolean,
  textSettings?: TextSettings,
  labels?: Label[]
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      // Seek to 0.1s for stable frame
      video.currentTime = 0.1;
    };

    // Wait for the seek to complete
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = 1080;
      canvas.height = 1920;

      // Draw black background by default
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // If there's a background image and we're in greenscreen mode, use it
      if (isGreenscreen && backgroundImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = backgroundImage;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawVideoAndText();
        };
      } else {
        drawVideoAndText();
      }

      function drawVideoAndText() {
        const videoAspect = video.videoWidth / video.videoHeight;
        const targetWidth = canvas.width;
        const targetHeight = targetWidth / videoAspect;
        const yOffset = (canvas.height - targetHeight) / 2;

        // Draw video frame
        ctx.drawImage(video, 0, yOffset, targetWidth, targetHeight);

        // Draw caption
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
            ctx.lineWidth = label.size * 0.08;  // Changed from fontSize to label.size
            ctx.strokeText(label.text, x, y);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(label.text, x, y);
          });
        }

        resolve(canvas);
      }
    };

    video.onerror = (e) => {
      reject(e);
    };
  });
}

// Helper function to wrap text (same as in videoProcessor.ts)
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