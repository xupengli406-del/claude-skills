"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PiSquaresFourFill } from "react-icons/pi";

const navItems = [
  ["大赛介绍", "introduction"],
  ["大赛领航者", "advocates"],
  ["赛事日程", "agenda"],
  ["赛道介绍", "tracks"],
  ["大赛评委", "judges"],
  ["大赛奖项", "awards"],
  ["现场回顾", "resources"],
] as const;

const advocates = [
  { name: "领航嘉宾 A", en: "ADVOCATE 01", role: "请替换为新活动嘉宾头衔", image: "/avatar-placeholder.svg" },
  { name: "领航嘉宾 B", en: "ADVOCATE 02", role: "请替换为新活动嘉宾头衔", image: "/avatar-placeholder.svg" },
  { name: "领航嘉宾 C", en: "ADVOCATE 03", role: "请替换为新活动嘉宾头衔", image: "/avatar-placeholder.svg" },
  { name: "领航嘉宾 D", en: "ADVOCATE 04", role: "请替换为新活动嘉宾头衔", image: "/avatar-placeholder.svg" },
  { name: "领航嘉宾 E", en: "ADVOCATE 05", role: "请替换为新活动嘉宾头衔", image: "/avatar-placeholder.svg" },
  { name: "领航嘉宾 F", en: "ADVOCATE 06", role: "请替换为新活动嘉宾头衔", image: "/avatar-placeholder.svg" },
];

const agendaPhases = [
  {
    short: "DAY 01",
    title: "DAY 01 · 集结与启程",
    tone: "green",
    rows: [
      ["09:00", "签到入场", "领取胸牌、确认队伍、完成现场接入"],
      ["09:50", "正式开幕", "主办方致辞、赛题发布与评审说明"],
      ["10:50", "技术能力讲解", "工具、示例 Demo 与现场支持说明"],
      ["11:05", "集中开发", "选题收敛、架构设计、功能开发与接口联调"],
      ["22:00", "Day 1 结束", "保存成果，准备第二天冲刺"],
    ],
  },
  {
    short: "DAY 02 AM",
    title: "DAY 02 · 最后冲刺",
    tone: "violet",
    rows: [
      ["09:00", "开发收尾", "完成核心功能、Demo 录制与路演材料"],
      ["12:00", "工位午餐", "补充体力，继续完成最后联调"],
      ["14:00", "最终检查", "确认代码、PPT、演示链路与提交材料"],
      ["14:30", "提交截止", "停止开发，进入公开评审与 Workshop"],
    ],
  },
  {
    short: "DAY 02 PM",
    title: "DAY 02 · 路演与高光",
    tone: "blue",
    rows: [
      ["14:30", "开放评审 + Workshop", "评委逐队体验作品，嘉宾进行主题分享"],
      ["16:00", "项目路演", "每队 4 分钟展示 + 2 分钟问答"],
      ["17:30", "评委合议", "去极值计分，确认排名与奖项"],
      ["18:00", "颁奖与合影", "公布 10 支获奖队伍，记录高光时刻"],
      ["18:30", "采访与交流", "获奖团队、主办方及评委集中采访"],
    ],
  },
];

const tracks = [
  {
    number: "01",
    title: "赛道名称 01",
    kicker: "关键词 A / 关键词 B / 关键词 C",
    copy: "请替换为新活动第一条赛道的目标、范围与交付要求。",
    image: "/hackathon-assets/track-coding-ai.jpg",
  },
  {
    number: "02",
    title: "赛道名称 02",
    kicker: "关键词 A / 关键词 B / 关键词 C",
    copy: "请替换为新活动第二条赛道的目标、范围与交付要求。",
    image: "/hackathon-assets/track-data-ai.jpg",
  },
  {
    number: "03",
    title: "赛道名称 03",
    kicker: "关键词 A / 关键词 B / 开放方向",
    copy: "请替换为新活动第三条赛道的目标、范围与交付要求。",
    image: "/hackathon-assets/track-tob-ai.jpg",
  },
];

const judges = [
  { name: "评委 A", role: "请替换为新活动评委头衔", image: "/avatar-placeholder.svg" },
  { name: "评委 B", role: "请替换为新活动评委头衔", image: "/avatar-placeholder.svg" },
  { name: "评委 C", role: "请替换为新活动评委头衔", image: "/avatar-placeholder.svg" },
  { name: "评委 D", role: "请替换为新活动评委头衔", image: "/avatar-placeholder.svg" },
  { name: "评委 E", role: "请替换为新活动评委头衔", image: "/avatar-placeholder.svg" },
  { name: "评委 F", role: "请替换为新活动评委头衔", image: "/avatar-placeholder.svg" },
];

const judging = [
  ["--%", "评分维度 01", "请替换为新活动评分说明"],
  ["--%", "评分维度 02", "请替换为新活动评分说明"],
  ["--%", "评分维度 03", "请替换为新活动评分说明"],
  ["--%", "评分维度 04", "请替换为新活动评分说明"],
  ["--%", "评分维度 05", "请替换为新活动评分说明"],
];

const gallery = [
  { image: "/hackathon-assets/track-coding-ai.jpg", title: "回顾素材 01", copy: "请替换为已获授权的新活动照片" },
  { image: "/hackathon-assets/track-data-ai.jpg", title: "回顾素材 02", copy: "没有回顾素材时隐藏整个区块" },
  { image: "/hackathon-assets/track-tob-ai.jpg", title: "回顾素材 03", copy: "请填写对应图片说明" },
];

const repeatedAdvocates = [...advocates, ...advocates, ...advocates];
const rulesUrl = "https://example.feishu.cn/docx/REPLACE_WITH_RULES_DOCUMENT";
const awardsUrl = "https://example.feishu.cn/docx/REPLACE_WITH_AWARDS_DOCUMENT";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [agendaPhase, setAgendaPhase] = useState(0);
  const [speakerIndex, setSpeakerIndex] = useState(advocates.length + 1);
  const [speakerMotion, setSpeakerMotion] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const logicalSpeakerIndex = ((speakerIndex % advocates.length) + advocates.length) % advocates.length;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      const marker = window.scrollY + Math.min(220, window.innerHeight * 0.34);
      const current = [...navItems]
        .reverse()
        .find(([, id]) => {
          const section = document.getElementById(id);
          return section ? section.offsetTop <= marker : false;
        });
      if (current) setActiveSection(current[1]);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.13 },
    );
    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

    return () => {
      window.removeEventListener("scroll", onScroll);
      revealObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSpeakerIndex((current) => current + 1), 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (speakerMotion) return;
    const frame = window.requestAnimationFrame(() => setSpeakerMotion(true));
    return () => window.cancelAnimationFrame(frame);
  }, [speakerMotion]);

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen]);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!glowRef.current || event.pointerType !== "mouse") return;
    glowRef.current.style.transform = `translate3d(${event.clientX - 150}px, ${event.clientY - 150}px, 0)`;
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const settleSpeakerLoop = () => {
    if (speakerIndex >= advocates.length * 2) {
      setSpeakerMotion(false);
      setSpeakerIndex((current) => current - advocates.length);
    } else if (speakerIndex < advocates.length) {
      setSpeakerMotion(false);
      setSpeakerIndex((current) => current + advocates.length);
    }
  };
  const openRegistration = () => {
    setSubmitted(false);
    setFormError("");
    setModalOpen(true);
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "提交失败，请稍后重试");
      setSubmitted(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main onPointerMove={onPointerMove}>
      <div className="cursor-glow" ref={glowRef} aria-hidden="true" />
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-inner">
          <button className="brand" onClick={() => scrollTo("top")} aria-label="回到首页">
            <span className="brand-mark">HK</span><b>HACKATHON PORTAL</b>
          </button>
          <nav aria-label="大赛导航">
            {navItems.map(([label, id]) => (
              <button className={activeSection === id ? "active" : ""} key={id} onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </nav>
          <button className="header-cta" onClick={openRegistration}>立即报名</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-media" aria-hidden="true">
          <HeroSpotlight />
        </div>
        <div className="hero-scanlines" aria-hidden="true" />
        <div className="hero-topline"><span>主办方 × 联合主办方</span><span>HACKATHON</span></div>
        <div className="hero-content">
          <p className="hero-code"><span>48H</span> BUILD · TEST · SHIP</p>
          <h1><small>Hackathon</small><span className="hero-title-line"><span>MAKE</span><span>IT</span></span><em aria-label="Real">REAL</em></h1>
          <p className="hero-tagline"><b>从想法到作品</b><span>在限定时间内完成可运行交付。</span></p>
          <p className="hero-date"><i aria-hidden="true" />NEXT STOP · APPLICATIONS OPEN</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={openRegistration}>报名并提交创意</button>
            <button className="ghost-button" onClick={() => scrollTo("resources")}>查看更多信息</button>
          </div>
        </div>
        <div className="hero-console left"><span>001 / BEYOND</span><span>002 / PROMPT</span><span>003 / AGENT</span><b>&gt;&gt; READY FOR ACTION_</b></div>
        <div className="hero-console right"><span>&gt;&gt; CITY · YEAR</span><span>&gt;&gt; TEAMS · TBD</span><span>&gt;&gt; AWARDS · TBD</span><b>&gt;&gt; APPLICATIONS OPEN_</b></div>
        <div className="hero-stats" aria-label="赛事关键信息">
          <div><strong>48H</strong><span>极限开发</span></div>
          <div><strong>TBD</strong><span>参赛队伍</span></div>
          <div><strong>TBD</strong><span>参与者</span></div>
          <div><strong>TBD</strong><span>奖项权益</span></div>
        </div>
      </section>

      <section className="section intro-section" id="introduction">
        <SectionTitle cn="大赛介绍" en="Introduction" />
        <div className="intro-layout" data-reveal>
          <div className="intro-kicker"><span>WHY</span><b>BEYOND<br />PROMPT?</b></div>
          <div className="intro-copy">
            <h3>请填写这场黑客松的核心主张。</h3>
            <p>在限定时间里，围绕活动主题完成一个<strong>能运行、能体验、能展示</strong>的作品。</p>
            <p>请替换为新活动的目标人群、参赛方式和团队规模。</p>
            <blockquote>请替换为活动的一句话价值主张。</blockquote>
          </div>
        </div>
      </section>

      <section className="section advocates-section" id="advocates">
        <SectionTitle cn="大赛领航者" en="Chief Advocates" />
        <p className="section-note">请替换为新活动嘉宾阵容说明</p>
        <div className="speaker-carousel" data-reveal>
          <div className="speaker-window">
            <div className={`speaker-track ${speakerMotion ? "" : "no-transition"}`} style={{ "--speaker-index": speakerIndex } as React.CSSProperties} onTransitionEnd={(event) => event.target === event.currentTarget && settleSpeakerLoop()}>
              {repeatedAdvocates.map((person, index) => (
                <article className={`speaker-card ${index % advocates.length === logicalSpeakerIndex ? "active" : ""}`} key={`${index}-${person.name}`}>
                  <img src={person.image} alt={`${person.name}，${person.role}`} />
                  <div><p>{person.en || "HACKATHON"}</p><h3>{person.name}</h3><span>{person.role}</span></div>
                </article>
              ))}
            </div>
          </div>
          <button className="carousel-arrow prev" aria-label="上一位领航者" onClick={() => setSpeakerIndex((current) => current - 1)}>PREV</button>
          <button className="carousel-arrow next" aria-label="下一位领航者" onClick={() => setSpeakerIndex((current) => current + 1)}>NEXT</button>
          <div className="carousel-dots" aria-label="领航者轮播位置">
            {advocates.map((person, index) => <button aria-label={`查看${person.name}`} className={index === logicalSpeakerIndex ? "active" : ""} onClick={() => setSpeakerIndex(advocates.length + index)} key={person.name} />)}
          </div>
        </div>
      </section>

      <section className="section agenda-section" id="agenda">
        <SectionTitle cn="赛事日程" en="Agenda" />
        <div className={`agenda-shell tone-${agendaPhases[agendaPhase].tone}`} data-reveal>
          <div className="agenda-tabs" role="tablist" aria-label="赛事日程">
            {agendaPhases.map((phase, index) => (
              <button role="tab" aria-selected={agendaPhase === index} className={agendaPhase === index ? "active" : ""} onClick={() => setAgendaPhase(index)} key={phase.short}>
                <span>&lt; {phase.short} &gt;</span>{phase.title}
              </button>
            ))}
          </div>
          <div className="agenda-panel" role="tabpanel" key={agendaPhase}>
            {agendaPhases[agendaPhase].rows.map(([time, title, copy]) => (
              <div className="agenda-row" key={`${agendaPhase}-${time}`}><time>{time}</time><h3>{title}</h3><p>{copy}</p></div>
            ))}
          </div>
          <div className="agenda-actions"><button onClick={openRegistration}>前往报名</button><button onClick={() => scrollTo("tracks")}>查看赛道</button><button onClick={() => scrollTo("judges")}>认识评委</button></div>
        </div>
      </section>

      <section className="section tracks-section" id="tracks">
        <SectionTitle cn="赛道介绍" en="Tracks" />
        <p className="section-bracket">[ 企业真实问题 / 可运行产品 / 48 小时交付 ]</p>
        <div className="track-grid">
          {tracks.map((track) => (
            <article className="track-card" data-reveal key={track.number}>
              <img src={track.image} alt="" aria-hidden="true" />
              <div className="track-shade" />
              <span className="track-number">{track.number}</span>
              <div className="track-content"><p>{track.kicker}</p><h3>{track.title}</h3><div>{track.copy}</div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section judges-section" id="judges">
        <SectionTitle cn="大赛评委" en="Judges" />
        <p className="section-note">投资机构、产业与产品专家共同评审 · 排名不分先后</p>
        <div className="judges-grid">
          {judges.map((judge, index) => (
            <article className="judge-card" data-reveal style={{ "--delay": `${index * 70}ms` } as React.CSSProperties} key={judge.name}>
              <div className="judge-image"><img src={judge.image} alt={`${judge.name}，${judge.role}`} /></div>
              <div><h3>{judge.name}</h3><p>{judge.role}</p></div>
            </article>
          ))}
        </div>

        <div className="judging-block" data-reveal>
          <div className="judging-heading"><p>SCORING SYSTEM</p><h3>请替换为新活动确认后的评分与计分规则</h3></div>
          <div className="judging-grid">
            {judging.map(([value, title, copy]) => <article key={title}><strong>{value}</strong><h4>{title}</h4><p>{copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section awards-section" id="awards">
        <SectionTitle cn="大赛奖项" en="Awards" />
        <p className="section-bracket">[ 奖项名称 / 名额 / 权益待活动方确认 ]</p>
        <div className="award-podium" data-reveal>
          <article><div className="award-photo"><img src="/hackathon-assets/award-silver-ai.jpg" alt="银色奖杯插画" /></div><h3>奖项名称 02</h3><p>请填写名额和评选方式</p><strong>权益待确认</strong></article>
          <article className="champion"><div className="award-photo"><img src="/hackathon-assets/award-gold-ai.jpg" alt="金色奖杯插画" /></div><h3>奖项名称 01</h3><p>请填写名额和评选方式</p><strong>权益待确认</strong></article>
          <article><div className="award-photo"><img src="/hackathon-assets/award-bronze-ai.jpg" alt="铜色奖杯插画" /></div><h3>奖项名称 03</h3><p>请填写名额和评选方式</p><strong>权益待确认</strong></article>
        </div>
        <div className="special-awards" data-reveal>
          {["特别奖项 01", "特别奖项 02", "特别奖项 03", "特别奖项 04"].map((title) => <div key={title}><b>{title}</b><span>请填写评选条件</span><strong>权益待确认</strong></div>)}
        </div>
      </section>

      <section className="section resources-section" id="resources">
        <SectionTitle cn="活动回顾" en="Recap" />
        <div className="gallery" data-reveal>
          <div className="gallery-window">
            <div className="gallery-track" style={{ "--gallery-index": galleryIndex } as React.CSSProperties}>
              {gallery.map((item) => <figure key={item.title}><img src={item.image} alt={item.title} /><figcaption><b>{item.title}</b><span>{item.copy}</span></figcaption></figure>)}
            </div>
          </div>
          <div className="gallery-controls"><button disabled={galleryIndex === 0} onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}>向左</button><span>{String(galleryIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</span><button disabled={galleryIndex === gallery.length - 1} onClick={() => setGalleryIndex(Math.min(gallery.length - 1, galleryIndex + 1))}>向右</button></div>
        </div>

        <SectionTitle cn="更多信息" en="Learn More" compact />
        <div className="more-grid" data-reveal>
          <article><div><h3>赛事细则</h3><span>查看赛程、参赛规则、作品要求、评审与现场保障。</span></div><a href={rulesUrl} target="_blank" rel="noreferrer">查看详情</a></article>
          <article><div><h3>获奖信息</h3><span>查看活动获奖项目与奖项名单。</span></div><a href={awardsUrl} target="_blank" rel="noreferrer">查看详情</a></article>
        </div>

        <div className="partners" data-reveal>
          <p>联合主办与场地支持</p>
          <div><span>主办方</span><span>联合主办方</span><span>合作伙伴</span></div>
        </div>
      </section>

      <footer>
        <div><div className="footer-logo"><span>HK</span>HACKATHON</div><p>活动名称 · 城市 · 年份</p></div>
        <div className="footer-center"><button onClick={() => scrollTo("introduction")}>大赛介绍</button><button onClick={() => scrollTo("agenda")}>赛事日程</button><button onClick={() => scrollTo("judges")}>大赛评委</button></div>
        <div className="footer-right"><p>真实问题 · 可运行产品 · 48 小时交付</p><button onClick={openRegistration}>NEXT STOP →</button></div>
      </footer>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
            <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="关闭报名窗口">关闭</button>
            {submitted ? (
              <div className="success-state"><p className="modal-label">APPLICATION RECEIVED</p><h2>报名意向已收到</h2><p>信息已同步到组委会飞书报名表。下一站城市与时间确定后，我们会优先与你联系。</p><button className="primary-button" onClick={() => setModalOpen(false)}>完成</button></div>
            ) : (
              <>
                <p className="modal-label">NEXT STOP REGISTRATION</p>
                <h2 id="registration-title">报名下一站</h2>
                <p className="modal-intro">留下你的方向与项目构想。带 * 为必填项。</p>
                <form onSubmit={submitRegistration}>
                  <div className="form-grid">
                    <label>姓名 *<input ref={nameRef} name="name" required maxLength={40} placeholder="怎么称呼你" /></label>
                    <label>联系邮箱 *<input name="email" type="email" required maxLength={120} placeholder="name@example.com" /></label>
                    <label>手机号码<input name="phone" inputMode="tel" maxLength={30} placeholder="便于入选后联系" /></label>
                    <label>公司 / 学校<input name="organization" maxLength={100} placeholder="你的组织" /></label>
                    <label>你的角色 *<select name="role" required defaultValue=""><option value="" disabled>请选择</option><option>开发者</option><option>产品经理</option><option>设计师</option><option>创业者</option><option>学生</option><option>其他</option></select></label>
                    <label>意向赛道 *<select name="track" required defaultValue=""><option value="" disabled>请选择</option><option>赛道名称 01</option><option>赛道名称 02</option><option>赛道名称 03</option></select></label>
                    <label>队伍名称<input name="teamName" maxLength={80} placeholder="未组队可留空" /></label>
                    <label>参赛方式 *<select name="teamSize" required defaultValue="1"><option value="1">个人参赛</option><option value="2">2 人组队</option><option value="3">3 人组队</option></select></label>
                  </div>
                  <label className="full-field">项目构想 *<textarea name="projectIdea" required minLength={20} maxLength={1000} placeholder="你想解决什么问题？计划做出怎样的作品？" /></label>
                  <label className="consent"><input type="checkbox" required />我同意组委会仅将以上信息用于赛事筛选与联系。</label>
                  {formError && <p className="form-error" role="alert">{formError}</p>}
                  <button className="primary-button submit-button" type="submit" disabled={submitting}>{submitting ? "正在提交…" : "提交报名意向"}</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function SectionTitle({ cn, en, compact = false }: { cn: string; en: string; compact?: boolean }) {
  return <div className={`section-title ${compact ? "compact" : ""}`}><h2><PiSquaresFourFill aria-hidden="true" /><span>{cn}</span><PiSquaresFourFill aria-hidden="true" /></h2><p>&lt; {en} /&gt;</p></div>;
}

function HeroSpotlight() {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.52 };
    const smooth = { ...raw };
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    let raf = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (coarsePointer) return;
      raw.x = event.clientX;
      raw.y = event.clientY;
    };

    const animate = (time: number) => {
      if (coarsePointer) {
        raw.x = window.innerWidth * (0.5 + Math.sin(time / 2600) * 0.29);
        raw.y = window.innerHeight * (0.53 + Math.cos(time / 3300) * 0.14);
      }
      smooth.x += (raw.x - smooth.x) * 0.1;
      smooth.y += (raw.y - smooth.y) * 0.1;
      revealRef.current?.style.setProperty("--spot-x", `${smooth.x}px`);
      revealRef.current?.style.setProperty("--spot-y", `${smooth.y}px`);
      raf = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    raf = window.requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hero-terrain-stage">
      <div className="hero-terrain-base" />
      <div className="hero-terrain-reveal" ref={revealRef} />
    </div>
  );
}
