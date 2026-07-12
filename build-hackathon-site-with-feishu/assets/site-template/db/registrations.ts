import { env } from "cloudflare:workers";

export type RegistrationInput = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  track: string;
  teamName: string;
  teamSize: number;
  projectIdea: string;
};

async function ensureRegistrationsTable() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      organization TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL,
      track TEXT NOT NULL,
      team_name TEXT NOT NULL DEFAULT '',
      team_size INTEGER NOT NULL DEFAULT 1,
      project_idea TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS registrations_email_unique ON registrations (email)"),
  ]);
}

export async function saveRegistration(input: RegistrationInput) {
  if (!env.DB) throw new Error("报名服务暂不可用，请稍后重试");
  await ensureRegistrationsTable();
  return env.DB.prepare(`INSERT INTO registrations
    (name, email, phone, organization, role, track, team_name, team_size, project_idea, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      phone = excluded.phone,
      organization = excluded.organization,
      role = excluded.role,
      track = excluded.track,
      team_name = excluded.team_name,
      team_size = excluded.team_size,
      project_idea = excluded.project_idea,
      updated_at = CURRENT_TIMESTAMP`)
    .bind(input.name, input.email, input.phone, input.organization, input.role, input.track, input.teamName, input.teamSize, input.projectIdea)
    .run();
}
