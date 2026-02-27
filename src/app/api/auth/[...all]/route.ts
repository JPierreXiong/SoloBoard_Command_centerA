import { toNextJsHandler } from 'better-auth/next-js';

import { getAuth } from '@/core/auth';

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    const response = await handler.POST(request);
    
    // Log 422 errors for debugging
    if (response.status === 422) {
      const responseData = await response.clone().json().catch(() => ({}));
      console.error('Auth POST 422 error:', {
        status: response.status,
        data: responseData,
        url: request.url,
      });
    }
    
    return response;
  } catch (error) {
    console.error('Auth POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    return handler.GET(request);
  } catch (error) {
    console.error('Auth GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
