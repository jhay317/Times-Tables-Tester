// Cloudflare Pages Function for /api/stats

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to get KV binding if available
function getKV(env) {
  return env.STATS_KV || env.STATS || null;
}

// GET /api/stats
export async function onRequestGet(context) {
  const kv = getKV(context.env);
  let data = {};

  if (kv) {
    try {
      const stored = await kv.get('user_stats', { type: 'json' });
      if (stored) {
        data = stored;
      }
    } catch (e) {
      console.error("Error reading stats from Cloudflare KV:", e);
    }
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: COMMON_HEADERS,
  });
}

// POST /api/stats
export async function onRequestPost(context) {
  try {
    const newData = await context.request.json();
    const kv = getKV(context.env);
    
    let existingData = {};
    if (kv) {
      try {
        const stored = await kv.get('user_stats', { type: 'json' });
        if (stored) {
          existingData = stored;
        }
      } catch (e) {
        console.error("Error fetching existing stats from KV:", e);
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
        await kv.put('user_stats', JSON.stringify(existingData));
      } catch (e) {
        console.error("Error saving updated stats to KV:", e);
      }
    }

    return new Response(JSON.stringify(existingData), {
      status: 200,
      headers: COMMON_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Invalid payload" }), {
      status: 400,
      headers: COMMON_HEADERS,
    });
  }
}

// OPTIONS /api/stats (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: COMMON_HEADERS,
  });
}
