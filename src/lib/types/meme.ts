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