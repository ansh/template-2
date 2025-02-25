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
  name: string;
  url: string;
  attribution?: {
    photographerName: string;
    photographerUrl: string;
    photoUrl: string;
    username: string;
  };
}

export interface TextSettings {
  size: number;
  font: string;
  verticalPosition: number;
  alignment: 'left' | 'center' | 'right';
} 