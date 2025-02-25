export async function GET() {
  return new Response(
    JSON.stringify({
      anthropicKeyExists: !!process.env.ANTHROPIC_API_KEY,
      anthropicKeyFormat: process.env.ANTHROPIC_API_KEY?.startsWith('sk-'),
      // Don't include the actual key in the response!
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
} 