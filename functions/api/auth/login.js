// Cloudflare Pages Function for POST /api/auth/login
import {
  jsonResponse,
  optionsResponse,
  getKV,
  hashPin,
  createAuthToken,
} from './_utils.js';

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { username, userId, pin } = body || {};

    const pinStr = String(pin || '').trim();
    if (!/^\d{4}$/.test(pinStr)) {
      return jsonResponse({ error: 'Please enter a valid 4-digit PIN.' }, 400);
    }

    const kv = getKV(env);
    if (!kv) {
      // Ephemeral fallback if KV is not configured
      const cleanUsername = String(username || userId || 'explorer').toLowerCase().trim();
      const fakeId = userId || `usr_${cleanUsername}`;
      const token = await createAuthToken({
        userId: fakeId,
        username: cleanUsername,
        displayName: cleanUsername,
        avatar: 'dog',
      }, env.AUTH_SECRET);

      return jsonResponse({
        success: true,
        user: {
          id: fakeId,
          username: cleanUsername,
          displayName: cleanUsername,
          avatar: 'dog',
        },
        token,
      });
    }

    let targetUsername = username ? String(username).trim().toLowerCase() : null;

    // If userId was provided instead of username, resolve it
    if (!targetUsername && userId) {
      targetUsername = await kv.get(`user_id:${userId}`);
    }

    if (!targetUsername) {
      return jsonResponse({ error: 'Explorer username or ID is required.' }, 400);
    }

    const userRecord = await kv.get(`user:${targetUsername}`, { type: 'json' });
    if (!userRecord) {
      return jsonResponse({ error: 'Explorer profile not found.' }, 404);
    }

    // Verify 4-digit PIN
    const computedHash = await hashPin(pinStr, userRecord.salt);
    if (computedHash !== userRecord.pinHash) {
      return jsonResponse({ error: 'Incorrect 4-digit PIN. Please try again.' }, 401);
    }

    // Create new JWT session token
    const token = await createAuthToken({
      userId: userRecord.id,
      username: userRecord.username,
      displayName: userRecord.displayName,
      avatar: userRecord.avatar,
    }, env.AUTH_SECRET);

    return jsonResponse({
      success: true,
      user: {
        id: userRecord.id,
        username: userRecord.username,
        displayName: userRecord.displayName,
        avatar: userRecord.avatar,
      },
      token,
    });
  } catch (err) {
    return jsonResponse({ error: err.message || 'Login failed.' }, 500);
  }
}
