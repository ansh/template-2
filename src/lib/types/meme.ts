export interface MemeVideo {
  id: string;
  name: string;
  videoUrl: string;
  instructions: string;
  typicalUsage: string;
  examples: string[];
  tags: string[];
}

export interface MemeRequest {
  concept: string;
  audience: string;
}

export interface MemeResponse {
  caption: string;
  videoId: string;
}

export interface BackgroundImage {
  id: string;
  url: string;
  name: string;
  tags: string[];
  aspect_ratio: "9:16" | "16:9" | "1:1";
}

export interface TextSettings {
  size: number;
  font: string;
  verticalPosition: number;
  alignment: 'left' | 'center' | 'right';
} 