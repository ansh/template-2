import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        openaiKeyPresent: !!process.env.OPENAI_API_KEY
    });
} 