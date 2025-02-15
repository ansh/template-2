export type MemeStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      meme_templates: {
        Row: {
          id: string;
          name: string;
          video_url: string;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          video_url: string;
          instructions?: string | null;
        };
        Update: {
          name?: string;
          video_url?: string;
          instructions?: string | null;
        };
      };
    };
  };
}

export interface MemeTemplate {
  id: string;
  name: string;
  video_url: string;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemeGeneration {
  id: string;
  template_id: string;
  caption: string;
  output_url: string | null;
  status: MemeStatus;
  created_at: string;
  updated_at: string;
} 