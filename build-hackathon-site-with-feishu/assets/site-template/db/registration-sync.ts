import { env } from "cloudflare:workers";

async function ensureSyncTable() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS registration_sync (
    email TEXT PRIMARY KEY,
    feishu_range TEXT NOT NULL DEFAULT '',
    last_error TEXT NOT NULL DEFAULT '',
    synced_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

export async function getFeishuRange(email: string) {
  await ensureSyncTable();
  const row = await env.DB.prepare("SELECT feishu_range FROM registration_sync WHERE email = ?")
    .bind(email)
    .first<{ feishu_range: string }>();
  return row?.feishu_range || "";
}

export async function markFeishuSynced(email: string, range: string) {
  await ensureSyncTable();
  await env.DB.prepare(`INSERT INTO registration_sync (email, feishu_range, last_error, synced_at, updated_at)
    VALUES (?, ?, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      feishu_range = excluded.feishu_range,
      last_error = '',
      synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(email, range)
    .run();
}

export async function markFeishuError(email: string, message: string) {
  await ensureSyncTable();
  await env.DB.prepare(`INSERT INTO registration_sync (email, last_error, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      last_error = excluded.last_error,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(email, message.slice(0, 500))
    .run();
}
