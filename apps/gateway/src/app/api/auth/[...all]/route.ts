import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// Export the handler directly since .use() is not available
export const { GET, POST } = toNextJsHandler(async (request: Request) => {
  console.log('[Auth] Request:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });

  const response = await auth.handler(request);

  console.log('[Auth] Response:', {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  });

  return response;
});
