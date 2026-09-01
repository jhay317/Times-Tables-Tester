// Cloudflare Pages Function for GET /api/auth/me
import {
  jsonResponse,
  optionsResponse,
  getAuthenticatedUser,
} from './_utils.js';

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);

  if (!user) {
    return jsonResponse({ error: 'Unauthorized. Please sign in.' }, 401);
  }

  return jsonResponse({
    user: {
      id: user.userId,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar || 'dog',
    },
  });
}
