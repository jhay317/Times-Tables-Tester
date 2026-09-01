// Cloudflare Pages Function for GET /api/auth/profiles
import {
  jsonResponse,
  optionsResponse,
  getKV,
} from './_utils.js';

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  const { env } = context;
  const kv = getKV(env);

  if (!kv) {
    return jsonResponse({ profiles: [] });
  }

  try {
    const profiles = await kv.get('users_index', { type: 'json' });
    return jsonResponse({ profiles: Array.isArray(profiles) ? profiles : [] });
  } catch (err) {
    return jsonResponse({ profiles: [], error: err.message });
  }
}
