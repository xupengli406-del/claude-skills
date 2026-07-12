import { env } from "cloudflare:workers";
import type { RegistrationInput } from "../db/registrations";
import { getFeishuRange, markFeishuError, markFeishuSynced } from "../db/registration-sync";

type FeishuEnv = {
  FEISHU_APP_ID?: string;
  FEISHU_APP_SECRET?: string;
  FEISHU_SPREADSHEET_TOKEN?: string;
  FEISHU_SHEET_ID?: string;
};

type FeishuResponse = {
  code: number;
  msg?: string;
  tenant_access_token?: string;
  data?: {
    updates?: { updatedRange?: string };
    updatedRange?: string;
  };
};

function getConfig() {
  const runtime = env as unknown as FeishuEnv;
  const appId = runtime.FEISHU_APP_ID?.trim();
  const appSecret = runtime.FEISHU_APP_SECRET?.trim();
  const spreadsheetToken = runtime.FEISHU_SPREADSHEET_TOKEN?.trim();
  const sheetId = runtime.FEISHU_SHEET_ID?.trim();
  if (!appId || !appSecret || !spreadsheetToken || !sheetId) {
    throw new Error("飞书报名表连接尚未配置完整");
  }
  return { appId, appSecret, spreadsheetToken, sheetId };
}

async function getTenantAccessToken(appId: string, appSecret: string) {
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const result = await response.json() as FeishuResponse;
  if (!response.ok || result.code !== 0 || !result.tenant_access_token) {
    throw new Error(`获取飞书访问凭证失败：${result.msg || response.status}`);
  }
  return result.tenant_access_token;
}

async function submissionId(email: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return `HK-${Array.from(new Uint8Array(digest)).slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function formatSubmissionTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date()).replaceAll("/", "-");
}

async function requestFeishu(url: string, accessToken: string, method: "POST" | "PUT", range: string, values: unknown[][]) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ valueRange: { range, values } }),
  });
  const result = await response.json() as FeishuResponse;
  if (!response.ok || result.code !== 0) {
    throw new Error(`写入飞书报名表失败：${result.msg || response.status}`);
  }
  return result.data?.updates?.updatedRange || result.data?.updatedRange || range;
}

export async function syncRegistrationToFeishu(input: RegistrationInput) {
  const config = getConfig();
  const existingRange = await getFeishuRange(input.email);
  const id = await submissionId(input.email);
  const values = [[
    formatSubmissionTime(),
    input.name,
    input.email,
    input.phone,
    input.organization,
    input.role,
    input.track,
    input.teamName,
    input.teamSize === 1 ? "个人参赛" : `${input.teamSize} 人组队`,
    input.projectIdea,
    "官网报名",
    id,
  ]];

  try {
    const accessToken = await getTenantAccessToken(config.appId, config.appSecret);
    const range = existingRange || `${config.sheetId}!A:L`;
    const url = existingRange
      ? `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${config.spreadsheetToken}/values`
      : `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${config.spreadsheetToken}/values_append?insertDataOption=INSERT_ROWS`;
    const updatedRange = await requestFeishu(url, accessToken, existingRange ? "PUT" : "POST", range, values);
    await markFeishuSynced(input.email, updatedRange);
    return { updatedRange, submissionId: id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "飞书同步失败";
    await markFeishuError(input.email, message);
    throw error;
  }
}
