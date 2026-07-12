import { saveRegistration, type RegistrationInput } from "../../../db/registrations";
import { syncRegistrationToFeishu } from "../../../lib/feishu";

const allowedRoles = new Set(["开发者", "产品经理", "设计师", "创业者", "学生", "其他"]);
const allowedTracks = new Set(["赛道名称 01", "赛道名称 02", "赛道名称 03"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: RegistrationInput = {
      name: clean(body.name, 40),
      email: clean(body.email, 120).toLowerCase(),
      phone: clean(body.phone, 30),
      organization: clean(body.organization, 100),
      role: clean(body.role, 30),
      track: clean(body.track, 50),
      teamName: clean(body.teamName, 80),
      teamSize: Math.min(3, Math.max(1, Number(body.teamSize) || 1)),
      projectIdea: clean(body.projectIdea, 1000),
    };

    if (!input.name || !/^\S+@\S+\.\S+$/.test(input.email)) {
      return Response.json({ error: "请填写有效的姓名和邮箱" }, { status: 400 });
    }
    if (!allowedRoles.has(input.role) || !allowedTracks.has(input.track)) {
      return Response.json({ error: "请选择有效的角色和赛道" }, { status: 400 });
    }
    if (input.projectIdea.length < 20) {
      return Response.json({ error: "项目构想至少需要 20 个字" }, { status: 400 });
    }

    await saveRegistration(input);
    try {
      const sync = await syncRegistrationToFeishu(input);
      return Response.json({ ok: true, synced: true, submissionId: sync.submissionId }, { status: 201 });
    } catch (syncError) {
      console.error("feishu registration sync failed", syncError);
      return Response.json(
        { error: "报名信息已安全暂存，但飞书同步暂时失败，请稍后重新提交" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("registration failed", error);
    return Response.json({ error: "报名服务暂时繁忙，请稍后重试" }, { status: 500 });
  }
}
