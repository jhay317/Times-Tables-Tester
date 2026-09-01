// Cloudflare Pages Function for /api/stats (Per-User Isolated)
import {
  COMMON_HEADERS,
  jsonResponse,
  optionsResponse,
  getKV,
  getAuthenticatedUser,
} from './auth/_utils.js';

// GET /api/stats
export async function onRequestGet(context) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  const kv = getKV(env);

  // Isolate stats key per user ID or guest
  const userKey = user ? `stats:${user.userId}` : 'stats:guest';
  let data = {};

  if (kv) {
    try {
      const stored = await kv.get(userKey, { type: 'json' });
      if (stored) {
        data = stored;
      }
    } catch (e) {
      console.error(`Error reading stats for ${userKey} from Cloudflare KV:`, e);
    }
  }

  return jsonResponse(data);
}

// POST /api/stats
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const user = await getAuthenticatedUser(request, env);
    const newData = await request.json();
    const kv = getKV(env);

    // Isolate stats key per user ID or guest
    const userKey = user ? `stats:${user.userId}` : 'stats:guest';
    
    let existingData = {};
    if (kv) {
      try {
        const stored = await kv.get(userKey, { type: 'json' });
        if (stored) {
          existingData = stored;
        }
      } catch (e) {
        console.error(`Error fetching existing stats for ${userKey} from KV:`, e);
      }
    }

    // Merge incoming stats with existing stats
    for (const [tableKey, newStats] of Object.entries(newData || {})) {
      if (tableKey === 'rewards_data') {
        if (!existingData.rewards_data) existingData.rewards_data = {};
        const rew = existingData.rewards_data;

        if (newStats.bonus_stars !== undefined) {
          rew.bonus_stars = Math.max(rew.bonus_stars || 0, newStats.bonus_stars || 0);
        }

        if (newStats.daily_logs && typeof newStats.daily_logs === 'object') {
          if (!rew.daily_logs) rew.daily_logs = {};
          for (const [dateStr, logEntry] of Object.entries(newStats.daily_logs)) {
            if (!rew.daily_logs[dateStr]) {
              rew.daily_logs[dateStr] = logEntry;
            } else {
              const curr = rew.daily_logs[dateStr];
              curr.seconds_played = Math.max(curr.seconds_played || 0, logEntry.seconds_played || 0);
              curr.goal_completed = (curr.goal_completed || false) || (logEntry.goal_completed || false);
            }
          }
        }

        if (Array.isArray(newStats.unlocked_items)) {
          const itemSet = new Set(rew.unlocked_items || []);
          newStats.unlocked_items.forEach(item => itemSet.add(item));
          rew.unlocked_items = Array.from(itemSet);
        }

        if (newStats.equipped_items && typeof newStats.equipped_items === 'object') {
          if (!rew.equipped_items) rew.equipped_items = { hat: null, trail: null };
          Object.assign(rew.equipped_items, newStats.equipped_items);
        }

        if (newStats.weekly_history && typeof newStats.weekly_history === 'object') {
          if (!rew.weekly_history) rew.weekly_history = {};
          Object.assign(rew.weekly_history, newStats.weekly_history);
        }

        if (newStats.parent_settings && typeof newStats.parent_settings === 'object') {
          if (!rew.parent_settings) rew.parent_settings = {};
          Object.assign(rew.parent_settings, newStats.parent_settings);
        }

        continue;
      }

      if (!existingData[tableKey]) {
        existingData[tableKey] = {
          attempts: 0,
          successes: 0,
          failures: 0,
          best_time: null,
        };
      }

      const stats = existingData[tableKey];
      if (newStats && typeof newStats === 'object') {
        stats.attempts = (stats.attempts || 0) + (newStats.attempts || 0);
        stats.successes = (stats.successes || 0) + (newStats.successes || 0);
        stats.failures = (stats.failures || 0) + (newStats.failures || 0);

        const incomingBest = newStats.best_time;
        if (incomingBest !== undefined && incomingBest !== null) {
          const currentBest = stats.best_time;
          if (currentBest === undefined || currentBest === null || incomingBest < currentBest) {
            stats.best_time = incomingBest;
          }
        }
      }
    }

    // Save updated stats back to KV if bound
    if (kv) {
      try {
        await kv.put(userKey, JSON.stringify(existingData));
      } catch (e) {
        console.error(`Error saving updated stats for ${userKey} to KV:`, e);
      }
    }

    return jsonResponse(existingData);
  } catch (err) {
    return jsonResponse({ error: err.message || "Invalid payload" }, 400);
  }
}

// OPTIONS /api/stats (CORS preflight)
export async function onRequestOptions() {
  return optionsResponse();
}
