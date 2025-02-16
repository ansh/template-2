import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    keyPresent: !!process.env.ANTHROPIC_API_KEY,
    keyStart: process.env.ANTHROPIC_API_KEY?.substring(0, 12),
    keyLength: process.env.ANTHROPIC_API_KEY?.length,
    // Don't log the full key, just checking if it loads correctly
    envKeys: Object.keys(process.env).filter(key => key.includes('ANTHROPIC'))
  });
} 