// Cloudflare Pages Function for POST /api/auth/register
import {
  jsonResponse,
  optionsResponse,
  getKV,
  generateId,
  generateSalt,
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
    const { username, displayName, avatar, pin } = body || {};

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return jsonResponse({ error: 'Username must be at least 2 characters.' }, 400);
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUsername) {
      return jsonResponse({ error: 'Username contains invalid characters.' }, 400);
    }

    // Require 4-digit PIN
    const pinStr = String(pin || '').trim();
    if (!/^\d{4}$/.test(pinStr)) {
      return jsonResponse({ error: 'PIN must be a 4-digit numeric code (e.g. 1234).' }, 400);
    }

    const cleanDisplayName = (displayName && String(displayName).trim()) || username.trim();
    const cleanAvatar = ['dog', 'cat', 'robot', 'fairy'].includes(avatar) ? avatar : 'dog';

    const kv = getKV(env);
    if (!kv) {
      // In-memory / ephemeral fallback if KV is not bound
      const userId = generateId('usr');
      const token = await createAuthToken({
        userId,
        username: cleanUsername,
        displayName: cleanDisplayName,
        avatar: cleanAvatar,
      }, env.AUTH_SECRET);

      return jsonResponse({
        success: true,
        user: {
          id: userId,
          username: cleanUsername,
          displayName: cleanDisplayName,
          avatar: cleanAvatar,
        },
        token,
      }, 201);
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:${cleanUsername}`, { type: 'json' });
    if (existingUser) {
      return jsonResponse({ error: `Explorer username "${cleanUsername}" is already taken.` }, 409);
    }

    const userId = generateId('usr');
    const salt = generateSalt();
    const pinHash = await hashPin(pinStr, salt);

    const userRecord = {
      id: userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatar: cleanAvatar,
      pinHash,
      salt,
      createdAt: Date.now(),
    };

    // Save user record
    await kv.put(`user:${cleanUsername}`, JSON.stringify(userRecord));
    await kv.put(`user_id:${userId}`, cleanUsername);

    // Update public profiles index for quick switcher
    let profilesIndex = await kv.get('users_index', { type: 'json' });
    if (!Array.isArray(profilesIndex)) {
      profilesIndex = [];
    }

    // Remove duplicates if any
    profilesIndex = profilesIndex.filter(p => p.username !== cleanUsername && p.id !== userId);
    profilesIndex.push({
      id: userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatar: cleanAvatar,
      createdAt: userRecord.createdAt,
    });

    await kv.put('users_index', JSON.stringify(profilesIndex));

    // Generate session token
    const token = await createAuthToken({
      userId,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatar: cleanAvatar,
    }, env.AUTH_SECRET);

    return jsonResponse({
      success: true,
      user: {
        id: userId,
        username: cleanUsername,
        displayName: cleanDisplayName,
        avatar: cleanAvatar,
      },
      token,
    }, 201);
  } catch (err) {
    return jsonResponse({ error: err.message || 'Registration failed.' }, 500);
  }
}
