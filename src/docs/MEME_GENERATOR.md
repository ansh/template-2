# Meme Generator Documentation

## System Overview

The meme generator creates memes using AI for template selection and caption generation, supporting both regular video templates and greenscreen videos with background replacement.

## Component Flow

### 1. Initial User Input
- User enters:
  - Target audience (optional)
  - Meme idea/description (required)
  - Selects AI model (Claude/GPT-4)
  - Toggles greenscreen mode

### 2. Template Selection Process
1. System converts user's idea into embedding vector
2. Queries Supabase for matching templates using vector similarity
3. Filters templates based on greenscreen mode
4. AI generates multiple caption options for each template
5. Displays results as interactive cards

### 3. Caption Selection & Preview
- Each template card shows:
  - Template name
  - Video preview
  - 3 AI-generated captions
- Clicking a caption:
  - Moves template to editor
  - Shows live preview of final meme
  - Keeps other options visible below
  - Shows background selector (if greenscreen)

### 4. Live Preview System
- Shows real-time preview of final meme
- Responsive layout:
  - Desktop (≥1024px):
    - Two-column layout with caption/controls on left, preview on right
    - Preview stays sticky while scrolling
    - Download button centered below both columns
  - Mobile (<1024px):
    - Single column layout
    - Order: Caption → Original Video → Preview → Download Button
    - Full width elements
- Preview includes:
  - First frame of video (at 0.1s for stable green screen)
  - Positioned caption with Impact font
  - Background image (if greenscreen)
  - Green screen removal effect
- Maintains exact same styling as final video:
  - Font size and style
  - Text positioning
  - Aspect ratio and letterboxing
  - Green screen processing

## Technical Implementation

### Database Schema

#### Meme Templates Table
```sql
CREATE TABLE meme_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  instructions TEXT,
  embedding VECTOR(1536),
  is_greenscreen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

#### Backgrounds Table
```sql
CREATE TABLE backgrounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  aspect_ratio TEXT CHECK (aspect_ratio IN ('9:16', '16:9', '1:1')) DEFAULT '9:16',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Video Processing

#### Preview Generation
```typescript
interface PreviewOptions {
  videoUrl: string;
  caption: string;
  backgroundImage?: string;
  isGreenscreen?: boolean;
}

// Process:
1. Load video and background (if greenscreen)
2. Seek to 0.1s for stable green screen preview
3. Draw to canvas:
   - Background (if greenscreen)
   - Process green screen
   - Add caption with Impact font
4. Return canvas for display
```

#### Final Video Generation
- Uses same core processing as preview
- Starts from beginning of video (no seek delay)
- Maintains audio from original video
- Processes frame-by-frame in real-time
- Downloads as MP4 when complete

#### Important Notes
- Video processing code is fragile and should not be modified
- Preview uses 0.1s delay for stable green screen frame
- Final video starts from beginning
- Both preview and final video use same styling/positioning
- Green screen effect requires precise timing

#### Regular Videos
- Canvas: 1080x1920
- Video positioning:
  - Centered vertically
  - Black letterboxing
- Caption positioning:
  - 40px above video
  - Font: Impact
  - Size: canvas.width * 0.078
  - White with black outline
  - Multi-line with wrapping

#### Greenscreen Videos
- Background:
  - Loaded first
  - Full canvas coverage
  - Must complete loading before video starts
- Video processing:
  - Frame-by-frame green removal
  - Green detection formula:
    ```javascript
    if (g > 100 && g > 1.4 * r && g > 1.4 * b) {
      pixel.alpha = 0;
    }
    ```
- Caption positioning:
  - 25% from top of canvas
  - Same styling as regular videos

### Background Selection
- Only visible when greenscreen mode is enabled
- Displays grid of available backgrounds
- Each background:
  - Must be 9:16 aspect ratio
  - Shows preview thumbnail
  - Highlights when selected
- Selected background is used for video processing
- If no background selected in greenscreen mode, download is prevented

### AI Integration

#### Template Selection
```typescript
interface TemplateQuery {
  prompt: string;
  isGreenscreenMode: boolean;
}

// Process:
1. Generate embedding from prompt
2. Query Supabase with vector similarity
3. Filter by isGreenscreenMode
4. Return top 5 matches
5. Fallback to random selection if no matches
```

#### Caption Generation
```typescript
interface CaptionPrompt {
  templateName: string;
  instructions: string;
  userIdea: string;
  audience?: string;
}

// AI Response Format:
TEMPLATE 1: [Name]
CAPTIONS:
1. [Caption 1]
2. [Caption 2]
3. [Caption 3]
```

## Error Handling

### Common Issues & Solutions

1. Video Processing
   - Issue: Video appears before background (greenscreen)
   - Solution: Use isBackgroundLoaded flag
   ```typescript
   let isBackgroundLoaded = false;
   backgroundImg.onload = () => {
     isBackgroundLoaded = true;
     if (processingVideo.readyState >= 2) {
       processingVideo.play();
     }
   };
   ```

2. Caption Positioning
   - Issue: Different requirements for modes
   - Solution: Conditional positioning
   ```typescript
   const textY = isGreenscreen 
     ? canvas.height * 0.25 
     : yOffset - 40;
   ```

3. Template Selection
   - Issue: No matching templates
   - Solution: Fallback with mode filter
   ```typescript
   if (!templates || templates.length === 0) {
     const fallback = await supabase
       .from('meme_templates')
       .select('*')
       .eq('is_greenscreen', isGreenscreenMode)
       .limit(5);
   }
   ```

## Development Guidelines

### Adding New Templates
1. Upload video file
2. Generate embedding from description
3. Set greenscreen flag if applicable
4. Store in Supabase

### Adding Backgrounds
1. Must be 9:16 aspect ratio
2. Public URL accessible
3. Tagged for categorization
4. Stored in Supabase storage
5. Only shown for greenscreen templates

### Testing Checklist
- [ ] Test with various caption lengths
- [ ] Test with different video aspects
- [ ] Test greenscreen detection
- [ ] Test background compatibility
- [ ] Test error scenarios
- [ ] Test background selection visibility
- [ ] Test download validation (no background selected)

### Preview System
- Update preview when:
  - Template changes
  - Caption changes
  - Background changes
  - Mode switches
- Handle loading states
- Show error messages if preview fails
- Maintain consistent styling with final video
- Consider performance implications of canvas operations

## Known Issues
1. Video processing performance needs optimization
2. Template selection accuracy needs improvement
3. Error handling needs standardization
4. Loading states need refinement
5. Green screen effect requires slight delay for stability
   - Preview uses 0.1s offset for stable frame
   - Final video may show brief transition

## Future Improvements
1. Add template categories
2. Implement background categories
3. Add custom background upload
4. Improve greenscreen detection
5. Add caption style options
6. Add background search/filtering
7. Support multiple aspect ratios