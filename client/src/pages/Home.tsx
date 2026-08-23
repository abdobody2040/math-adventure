import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Award, Backpack, BarChart3, Check, ChevronDown, CircleHelp, Coins, Compass, Flame, Home as HomeIcon, Languages, LockKeyhole, Menu, Mountain, Play, Shield, Sparkles, Swords, Trees, UserRound, WandSparkles, X, Zap } from "lucide-react";

type Screen = "home" | "map" | "lesson" | "battle" | "parent" | "admin";
type AvatarKey = "starlight" | "ember" | "sage" | "tide";

const avatarStyles: Record<AvatarKey, { label: string; className: string }> = {
  starlight: { label: "A", className: "avatar-starlight" },
  ember: { label: "B", className: "avatar-ember" },
  sage: { label: "C", className: "avatar-sage" },
  tide: { label: "D", className: "avatar-tide" },
};

const iconForWorld = (key: string) => ({ "number-valley": Sparkles, "addition-forest": Trees, "subtraction-desert": Mountain }[key] ?? Compass);

function IconAvatar({ avatarKey, size = "md" }: { avatarKey: string; size?: "sm" | "md" | "lg" }) {
  const avatar = avatarStyles[avatarKey as AvatarKey] ?? avatarStyles.starlight;
  return <div aria-hidden="true" className={`avatar ${avatar.className} avatar-${size}`}><span>{avatar.label}</span><i /></div>;
}

function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  return <button type="button" className="language-toggle" onClick={() => setLocale(locale === "en" ? "ar" : "en")} aria-label={t("common.continue")}><Languages size={17} /><span>{locale === "en" ? "العربية" : "English"}</span></button>;
}

function OfflineIndicator() {
  const { t } = useLocale();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  return <span className={`sync-status ${online ? "is-online" : "is-offline"}`}><i />{online ? t("offline.online") : t("offline.offline")}</span>;
}

function Landing() {
  const { t } = useLocale();
  return <div className="landing-page">
    <header className="landing-header"><a className="brand" href="#top"><span className="brand-mark"><Sparkles size={20} /></span><span>{t("brand.name")}</span></a><LanguageToggle /></header>
    <main id="top" className="landing-main">
      <section className="landing-copy">
        <p className="eyebrow"><Sparkles size={15} />{t("landing.eyebrow")}</p>
        <h1>{t("landing.title")}</h1>
        <p className="landing-description">{t("landing.description")}</p>
        <button type="button" className="primary-button landing-cta" onClick={startLogin}><span>{t("landing.primaryCta")}</span><ArrowRight size={18} /></button>
        <div className="safety-note"><LockKeyhole size={17} /><span><b>{t("landing.safety")}</b>{t("landing.safetyDetail")}</span></div>
      </section>
      <section className="adventure-preview" aria-label={t("brand.name")}>
        <div className="moon-orb" /><div className="hill hill-far" /><div className="hill hill-near" />
        <div className="path-dots"><i /><i /><i /></div>
        <div className="preview-card preview-card-top"><span className="mini-icon mint"><Compass size={19} /></span><span><small>{t("dashboard.dailyQuest")}</small><b>{t("quests.dailyFive")}</b></span><strong>5</strong></div>
        <div className="preview-card preview-card-bottom"><IconAvatar avatarKey="starlight" /><span><small>{t("dashboard.level", { level: 4 })}</small><b>{t("skills.countTo20")}</b><em><i /></em></span></div>
        <div className="landing-character"><IconAvatar avatarKey="ember" size="lg" /></div>
      </section>
    </main>
    <section className="landing-features"><p><Zap size={19} />{t("landing.featureOne")}</p><p><WandSparkles size={19} />{t("landing.featureTwo")}</p><p><BarChart3 size={19} />{t("landing.featureThree")}</p></section>
  </div>;
}

function Onboarding({ onCreated }: { onCreated: (id: string) => void }) {
  const { t, locale, setLocale, number } = useLocale();
  const createChild = trpc.profile.createChild.useMutation({ onSuccess: child => onCreated(child.id) });
  const [name, setName] = useState("");
  const [age, setAge] = useState(7);
  const [grade, setGrade] = useState("");
  const [avatarKey, setAvatarKey] = useState<AvatarKey>("starlight");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    createChild.mutate({ displayName: name, age, grade, avatarKey, locale });
  };
  return <div className="onboarding-shell"><LanguageToggle /><main className="onboarding-card">
    <section className="onboarding-intro"><p className="eyebrow"><UserRound size={15} />{t("onboarding.eyebrow")}</p><h1>{t("onboarding.title")}</h1><p>{t("onboarding.description")}</p><div className="onboarding-art"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><IconAvatar avatarKey={avatarKey} size="lg" /></div></section>
    <form onSubmit={submit} className="profile-form">
      <label><span>{t("onboarding.name")}</span><input required maxLength={32} value={name} onChange={event => setName(event.target.value)} /></label>
      <div className="form-row"><label><span>{t("onboarding.age")}</span><select value={age} onChange={event => setAge(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 6).map(value => <option value={value} key={value}>{number(value)}</option>)}</select></label><label><span>{t("onboarding.grade")}</span><input required maxLength={32} value={grade} placeholder={t("onboarding.gradePlaceholder")} onChange={event => setGrade(event.target.value)} /></label></div>
      <fieldset><legend>{t("onboarding.avatar")}</legend><div className="avatar-choices">{(Object.keys(avatarStyles) as AvatarKey[]).map(key => <button className={`avatar-choice ${avatarKey === key ? "is-selected" : ""}`} type="button" key={key} onClick={() => setAvatarKey(key)} aria-label={key}><IconAvatar avatarKey={key} />{avatarKey === key && <Check size={15} />}</button>)}</div></fieldset>
      {createChild.error && <p className="form-error">{t("common.error")}</p>}
      <button className="primary-button form-submit" disabled={createChild.isPending} type="submit"><span>{createChild.isPending ? t("common.loading") : t("onboarding.create")}</span><ArrowRight size={18} /></button>
    </form>
  </main></div>;
}

function Navigation({ screen, setScreen, onSignOut, isAdmin, installPrompt, onInstall }: { screen: Screen; setScreen: (screen: Screen) => void; onSignOut: () => void; isAdmin: boolean; installPrompt: any; onInstall: () => void }) {
  const { t, direction } = useLocale();
  const [open, setOpen] = useState(false);
  const items: { screen: Screen; icon: typeof HomeIcon; label: string }[] = [{ screen: "home", icon: HomeIcon, label: t("navigation.home") }, { screen: "map", icon: Compass, label: t("navigation.map") }, { screen: "parent", icon: BarChart3, label: t("navigation.parent") }];
  if (isAdmin) items.push({ screen: "admin", icon: Backpack, label: t("admin.title") });
  return <header className="app-header"><a className="brand" href="#top" onClick={event => { event.preventDefault(); setScreen("home"); }}><span className="brand-mark"><Sparkles size={19} /></span><span>{t("brand.name")}</span></a>
    <nav className="desktop-nav">{items.map(item => { const Icon = item.icon; return <button onClick={() => setScreen(item.screen)} className={screen === item.screen ? "active" : ""} key={item.screen}><Icon size={16} />{item.label}</button>; })}</nav>
    <div className="header-actions"><OfflineIndicator />{installPrompt && <button type="button" className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#c8bee9] bg-[#f4f1ff] px-2.5 text-[10.5px] font-extrabold text-[#4c3f9f] hover:bg-[#ebe6ff]" onClick={onInstall}><Sparkles size={15} /><span>{t("pwa.install")}</span></button>}<LanguageToggle /><div className="account-menu"><button type="button" onClick={() => setOpen(!open)} aria-label={t("common.parentView")}><UserRound size={18} /><ChevronDown size={15} /></button>{open && <div className={`account-popover ${direction === "rtl" ? "rtl-popover" : ""}`}><button onClick={onSignOut}>{t("common.signOut")}</button></div>}</div><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={t("navigation.home")}><Menu size={21} /></button></div>
  </header>;
}

function StatChip({ icon: Icon, value, label, tint }: { icon: typeof Award; value: string; label: string; tint: string }) {
  return <div className={`stat-chip ${tint}`}><span><Icon size={16} /></span><b>{value}</b><small>{label}</small></div>;
}

function ChildDashboard({ child, dashboard, curriculum, setScreen, startLesson }: { child: any; dashboard: any; curriculum: any; setScreen: (screen: Screen) => void; startLesson: (skillKey: string, battle?: boolean) => void }) {
  const { t, number } = useLocale();
  const currentSkill = dashboard?.recommendationSkillKey ?? "count-to-20";
  const latestAchievement = dashboard?.achievements?.[dashboard.achievements.length - 1];
  return <main id="top" className="app-main child-home">
    <section className="welcome-row"><div><p className="eyebrow"><Sparkles size={15} />{t("common.welcome")}</p><h1>{t("dashboard.greeting")}</h1></div><IconAvatar avatarKey={child.avatarKey} size="lg" /></section>
    <section className="stats-strip"><StatChip icon={Award} value={number(child.level)} label={t("dashboard.level", { level: "" }).trim()} tint="lavender" /><StatChip icon={Zap} value={number(child.xp)} label={t("dashboard.xp")} tint="sky" /><StatChip icon={Coins} value={number(child.coins)} label={t("dashboard.coins")} tint="sun" /><StatChip icon={Flame} value={number(child.streakDays)} label={t("dashboard.streak", { count: "" }).trim()} tint="coral" /></section>
    <section className="continue-panel"><div className="continue-copy"><p className="eyebrow"><Play size={15} />{t("lesson.sessionIntro")}</p><h2>{t("dashboard.continueTitle")}</h2><p>{t("dashboard.continueDescription")}</p><button className="primary-button" onClick={() => startLesson(currentSkill)}><span>{t("common.continue")}</span><ArrowRight size={18} /></button></div><div className="continue-scene"><span className="scene-cloud cloud-one" /><span className="scene-cloud cloud-two" /><span className="scene-sun" /><div className="scene-hill" /><div className="scene-avatar"><IconAvatar avatarKey={child.avatarKey} size="lg" /></div><span className="scene-star one">✦</span><span className="scene-star two">✦</span></div></section>
    <section className="dashboard-grid"><article className="quest-card"><div className="card-heading"><span className="card-icon mint"><Compass size={19} /></span><div><p>{t("dashboard.dailyQuest")}</p><h3>{t(dashboard?.dailyQuest?.titleKey ?? "quests.dailyFive")}</h3></div></div><p className="muted">{t("dashboard.questDescription", { target: number(dashboard?.dailyQuest?.target ?? 5) })}</p><div className="progress-label"><span>{t("dashboard.progress", { progress: number(dashboard?.dailyQuest?.progress ?? 0), target: number(dashboard?.dailyQuest?.target ?? 5) })}</span><b>{Math.round(((dashboard?.dailyQuest?.progress ?? 0) / (dashboard?.dailyQuest?.target ?? 5)) * 100)}%</b></div><div className="meter"><i style={{ width: `${((dashboard?.dailyQuest?.progress ?? 0) / (dashboard?.dailyQuest?.target ?? 5)) * 100}%` }} /></div><div className="quest-rewards"><span><Zap size={14} />{number(dashboard?.dailyQuest?.rewardXp ?? 25)} {t("dashboard.xp")}</span><span><Coins size={14} />{number(dashboard?.dailyQuest?.rewardCoins ?? 10)}</span></div></article>
      <article className="focus-card"><div className="card-heading"><span className="card-icon sky"><WandSparkles size={19} /></span><div><p>{t("dashboard.skillFocus")}</p><h3>{t(`skills.${skillKeyToTranslation(currentSkill)}`)}</h3></div></div><p>{t(dashboard?.recommendationKey ?? "recommendations.startAdventure")}</p><button className="text-action" onClick={() => startLesson(currentSkill)}>{t("common.start")}<ArrowRight size={16} /></button></article>
      <article className="badge-card"><div className="card-heading"><span className="card-icon sun"><Award size={19} /></span><div><p>{t("dashboard.latestBadge")}</p><h3>{latestAchievement ? t(`achievements.${achievementKeyToTranslation(latestAchievement)}.title`) : t("dashboard.noBadge")}</h3></div></div><p>{latestAchievement ? t(`achievements.${achievementKeyToTranslation(latestAchievement)}.description`) : t("lesson.feedback")}</p><span className="badge-spark"><Sparkles size={26} /></span></article>
    </section>
    <section className="quick-actions"><button onClick={() => setScreen("map")}><Compass size={19} /><span><b>{t("dashboard.exploreMap")}</b><small>{curriculum?.worlds?.length ?? 3} {t("map.skills")}</small></span><ArrowRight size={17} /></button><button onClick={() => startLesson(currentSkill, true)}><Swords size={19} /><span><b>{t("dashboard.startBattle")}</b><small>{t("lesson.battleIntro")}</small></span><ArrowRight size={17} /></button></section>
  </main>;
}

function skillKeyToTranslation(key: string) {
  return ({ "count-to-20": "countTo20", "number-recognition": "numberRecognition", "compare-numbers": "compareNumbers", "number-sequences": "numberSequences", "add-within-10": "addWithin10", "make-ten": "makeTen", "add-within-20": "addWithin20", "subtract-within-10": "subtractWithin10", "subtract-within-20": "subtractWithin20", "number-bonds": "numberBonds" } as Record<string, string>)[key] ?? "countTo20";
}

function achievementKeyToTranslation(key: string) {
  return ({ "first-spark": "firstSpark", "three-day-streak": "threeDayStreak", "number-explorer": "numberExplorer" } as Record<string, string>)[key] ?? "firstSpark";
}

function AdventureMap({ curriculum, childDashboard, startLesson }: { curriculum: any; childDashboard: any; startLesson: (skillKey: string) => void }) {
  const { t, number } = useLocale();
  const progress = new Map<string, any>((childDashboard?.skillProgress ?? []).map((item: any) => [item.skillKey, item]));
  const worldProgress = new Map<string, any>((childDashboard?.worldProgress ?? []).map((item: any) => [item.worldKey, item]));
  return <main className="app-main map-page"><section className="map-heading"><p className="eyebrow"><Compass size={15} />{t("map.eyebrow")}</p><h1>{t("map.title")}</h1><p>{t("map.description")}</p></section><section className="world-trail">{curriculum?.worlds?.map((world: any, worldIndex: number) => {
    const WorldIcon = iconForWorld(world.key); const isLocked = !worldProgress.get(world.key)?.isUnlocked; const worldSkills = curriculum.skills.filter((skill: any) => skill.worldKey === world.key);
    return <article className={`world-panel world-${world.accent} ${isLocked ? "is-locked" : ""}`} key={world.key}><div className="world-panel-top"><span className="world-icon"><WorldIcon size={25} /></span><span><p>{number(world.order).padStart(2, "0")}</p><h2>{t(world.nameKey)}</h2></span>{isLocked ? <span className="locked-chip"><LockKeyhole size={14} />{t("common.locked")}</span> : <span className="ready-chip"><Check size={14} />{t("map.ready")}</span>}</div><p className="world-description">{t(world.descriptionKey)}</p><div className="skill-nodes">{worldSkills.map((skill: any, index: number) => { const item = progress.get(skill.key); const mastery = item?.mastery ?? 0; return <button disabled={isLocked} onClick={() => startLesson(skill.key)} className={`skill-node ${mastery >= 80 ? "is-mastered" : ""}`} key={skill.key}><span>{mastery >= 80 ? <Check size={15} /> : index + 1}</span><b>{t(`skills.${skillKeyToTranslation(skill.key)}`)}</b><small>{mastery ? `${number(mastery)}%` : t("common.start")}</small></button>; })}</div>{isLocked && <p className="world-lock-note"><LockKeyhole size={14} />{t("map.lockedDescription")}</p>}</article>; })}</section></main>;
}

function LessonExperience({ childId, skillKey, isBattle, exit }: { childId: string; skillKey: string; isBattle: boolean; exit: () => void }) {
  const { t, number } = useLocale();
  const nextQuestion = trpc.learning.nextQuestion.useMutation();
  const submitAnswer = trpc.learning.submitAnswer.useMutation();
  const startSession = trpc.learning.startSession.useMutation();
  const completeSession = trpc.learning.completeSession.useMutation();
  const [question, setQuestion] = useState<any>(null);
  const [learningSessionId, setLearningSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [round, setRound] = useState(0);
  const startedAt = useRef(Date.now());
  const sessionStartedAt = useRef(Date.now());
  const battleShield = Math.max(0, 100 - round * 34);

  const loadQuestion = () => {
    setSelected(null); setResult(null); setShowHint(false); startedAt.current = Date.now();
    nextQuestion.mutate({ childId, skillKey, difficulty: 1 }, { onSuccess: data => setQuestion(data) });
  };
  useEffect(() => {
    loadQuestion();
    sessionStartedAt.current = Date.now();
    startSession.mutate({ childId, skillKey, mode: isBattle ? "battle" : "lesson" }, { onSuccess: data => setLearningSessionId(data.id) });
  }, [childId, isBattle, skillKey]);
  const exitSession = () => {
    if (learningSessionId) completeSession.mutate({ childId, sessionId: learningSessionId, durationSeconds: Math.round((Date.now() - sessionStartedAt.current) / 1000) });
    exit();
  };
  const prompt = useMemo(() => {
    if (!question?.presentation) return null;
    const item = question.presentation;
    if (item.kind === "count") return <><div className="star-count">{Array.from({ length: item.amount }, (_, index) => <Sparkles key={index} size={29} />)}</div><h2>{t("lesson.countPrompt")}</h2></>;
    if (item.kind === "compare") return <><div className="math-expression"><b>{number(item.left)}</b><span>?</span><b>{number(item.right)}</b></div><h2>{t("lesson.comparePrompt")}</h2></>;
    if (item.kind === "sequence") return <><div className="math-expression sequence">{item.values.map((value: number | null, index: number) => <b key={index}>{value === null ? "?" : number(value)}</b>)}</div><h2>{t("lesson.sequencePrompt")}</h2></>;
    const operator = item.kind === "addition" ? "+" : "−";
    return <><div className="math-expression"><b>{number(item.left)}</b><span>{operator}</span><b>{number(item.right)}</b><span>=</span><b>?</b></div><h2>{t("lesson.equationPrompt")}</h2></>;
  }, [number, question?.presentation, t]);
  const answer = () => {
    if (!selected || !question || result) return;
    submitAnswer.mutate({ childId, questionSessionId: question.questionSessionId, answer: selected, responseTimeMs: Date.now() - startedAt.current, usedHint: showHint }, { onSuccess: data => { setResult(data); if (data.isCorrect) setRound(value => value + 1); } });
  };
  const feedbackTitle = result?.isCorrect ? t("lesson.correct") : t("lesson.incorrect");
  return <main className={`lesson-page ${isBattle ? "battle-page" : ""}`}><header className="lesson-header"><button type="button" onClick={exitSession} className="icon-button" aria-label={t("common.back")}><ArrowLeft size={20} /></button><div><p>{isBattle ? t("navigation.battle") : t("lesson.eyebrow")}</p><b>{t(`skills.${skillKeyToTranslation(skillKey)}`)}</b></div><span className="question-count">{number(Math.min(round + 1, 3))} / {number(3)}</span></header>
    {isBattle && <section className="battle-stage"><div className="guardian"><Shield size={56} /><span><i /></span></div><div className="shield-readout"><span>{t("lesson.shield")}</span><div className="meter"><i style={{ width: `${battleShield}%` }} /></div><b>{number(battleShield)}%</b></div></section>}
    <section className="lesson-card"><p className="eyebrow"><WandSparkles size={15} />{isBattle ? t("lesson.battleIntro") : t("lesson.sessionIntro")}</p>{nextQuestion.isPending && <div className="lesson-loading"><Sparkles size={28} /><p>{t("common.loading")}</p></div>}{nextQuestion.error && <div className="empty-state"><CircleHelp size={28} /><p>{t("common.error")}</p><button onClick={loadQuestion}>{t("common.retry")}</button></div>}{question && <><div className="prompt-area">{prompt}</div><p className="choose-label">{t("lesson.question")}</p><div className="answer-grid">{question.presentation.choices.map((choice: string) => <button disabled={Boolean(result)} className={`${selected === choice ? "is-selected" : ""} ${result && choice === selected ? (result.isCorrect ? "is-correct" : "is-wrong") : ""}`} onClick={() => setSelected(choice)} key={choice}>{choice}</button>)}</div><button type="button" className="hint-button" onClick={() => setShowHint(!showHint)}><CircleHelp size={16} />{t("lesson.hint")}</button>{showHint && <p className="hint-text">{t("lesson.hintText")}</p>}{!result ? <button disabled={!selected || submitAnswer.isPending} className="primary-button lesson-action" onClick={answer}><span>{t("lesson.check")}</span><Check size={18} /></button> : <div className={`feedback-card ${result.isCorrect ? "correct" : "incorrect"}`}><span>{result.isCorrect ? <Sparkles size={24} /> : <WandSparkles size={24} />}</span><div><h3>{feedbackTitle}</h3><p>{t(question.explanationKey)}</p><b>{t("lesson.earned", { xp: number(result.rewards.xp), coins: number(result.rewards.coins) })}</b></div>{round >= 3 && result.isCorrect ? <button className="primary-button" onClick={exitSession}><span>{isBattle ? t("lesson.battleWin") : t("lesson.lessonWin")}</span><ArrowRight size={18} /></button> : <button className="secondary-button" onClick={loadQuestion}><span>{t("lesson.next")}</span><ArrowRight size={18} /></button>}</div>}</>}</section></main>;
}

function ParentDashboard({ child, dashboard, curriculum, onEdit }: { child: any; dashboard: any; curriculum: any; onEdit: () => void }) {
  const { t, number } = useLocale();
  const skillRows = (dashboard?.skillProgress ?? []).slice(0, 5);
  const learningMinutes = Math.max(0, Math.round((dashboard?.learningSeconds ?? 0) / 60));
  const skill = dashboard?.recommendationSkillKey ?? "count-to-20";
  return <main className="app-main parent-page"><section className="parent-heading"><div><p className="eyebrow"><BarChart3 size={15} />{t("parent.eyebrow")}</p><h1>{t("parent.title")}</h1><p>{t("parent.childSelect")} <b>{child.displayName}</b></p></div><button className="secondary-button" onClick={onEdit}><span>{t("parent.manageProfile")}</span><UserRound size={16} /></button></section>
    <section className="parent-summary"><article><span className="card-icon sky"><Play size={18} /></span><p>{t("parent.learningTime")}</p><b>{number(learningMinutes)} <small>{t("common.minutes")}</small></b></article><article><span className="card-icon lavender"><CircleHelp size={18} /></span><p>{t("parent.questions")}</p><b>{number(dashboard?.totalAttempts ?? 0)}</b></article><article><span className="card-icon mint"><Check size={18} /></span><p>{t("parent.accuracy")}</p><b>{dashboard?.accuracy === null || dashboard?.accuracy === undefined ? "—" : `${number(dashboard.accuracy)}%`}</b></article><article><span className="card-icon coral"><Flame size={18} /></span><p>{t("parent.streak")}</p><b>{number(child.streakDays)}</b></article></section>
    <section className="parent-grid"><article className="progress-card"><div className="section-title"><div><p>{t("parent.summary")}</p><h2>{t("parent.skillProgress")}</h2></div><BarChart3 size={20} /></div>{skillRows.length ? <div className="progress-list">{skillRows.map((item: any) => <div key={item.skillKey}><div><span>{t(`skills.${skillKeyToTranslation(item.skillKey)}`)}</span><b>{number(item.mastery)}%</b></div><div className="meter"><i style={{ width: `${item.mastery}%` }} /></div></div>)}</div> : <div className="empty-inline"><Backpack size={24} /><p>{t("parent.emptyProgress")}</p></div>}</article><article className="recommendation-card"><span className="recommendation-star"><WandSparkles size={22} /></span><p>{t("parent.recommendation")}</p><h2>{t(`skills.${skillKeyToTranslation(skill)}`)}</h2><p>{t("parent.recommendationDetail", { skill: t(`skills.${skillKeyToTranslation(skill)}`) })}</p><span className="recommendation-line" /></article><article className="activity-card"><div className="section-title"><div><p>{t("parent.summary")}</p><h2>{t("parent.activity")}</h2></div><ClockIcon /></div>{dashboard?.recentAttempts?.length ? <div className="activity-list">{dashboard.recentAttempts.slice(0, 4).map((attempt: any) => <div key={attempt.id}><span className={attempt.isCorrect ? "activity-good" : "activity-try"}>{attempt.isCorrect ? <Check size={15} /> : <WandSparkles size={15} />}</span><div><b>{t(`skills.${skillKeyToTranslation(attempt.skillKey)}`)}</b><small>{attempt.isCorrect ? t("rewards.correctAnswer") : t("rewards.braveTry")}</small></div></div>)}</div> : <div className="empty-inline"><Compass size={24} /><p>{t("parent.noActivity")}</p></div>}</article><article className="privacy-card"><LockKeyhole size={21} /><div><b>{t("parent.privacy")}</b><p>{t("parent.privacyDetail")}</p></div></article></section>
  </main>;
}

function ClockIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>; }

function AccessDenied({ returnHome }: { returnHome: () => void }) {
  const { t } = useLocale();
  return <main className="app-main"><section className="empty-state rounded-[24px] border border-[#e4deee] bg-white shadow-[0_8px_22px_rgba(67,48,113,.09)]"><LockKeyhole size={30} /><h1 className="text-[28px]">{t("common.accessDenied")}</h1><p>{t("common.accessDeniedDetail")}</p><button className="secondary-button" onClick={returnHome}>{t("common.returnHome")}</button></section></main>;
}

function AdminPanel({ curriculum }: { curriculum: any }) {
  const { t, number } = useLocale();
  const seed = trpc.admin.seedStarterContent.useMutation();
  return <main className="app-main admin-page"><section className="parent-heading"><div><p className="eyebrow"><Backpack size={15} />{t("admin.title")}</p><h1>{t("admin.title")}</h1><p>{t("admin.description")}</p></div></section><section className="admin-grid"><article className="admin-summary-card"><span className="recommendation-star"><Sparkles size={22} /></span><p>{t("admin.curriculum")}</p><h2>{number(curriculum?.worlds?.length ?? 0)} {t("admin.worlds")}</h2><div className="admin-counts"><span>{number(curriculum?.skills?.length ?? 0)} {t("admin.skills")}</span><span>{number(curriculum?.lessons?.length ?? 0)} {t("admin.lessons")}</span></div><button className="primary-button" onClick={() => seed.mutate()} disabled={seed.isPending}><span>{seed.isPending ? t("common.loading") : t("admin.seed")}</span><Sparkles size={17} /></button>{seed.isSuccess && <p className="admin-success"><Check size={14} />{t("admin.saved")}</p>}</article><article className="admin-list-card"><div className="section-title"><div><p>{t("admin.curriculum")}</p><h2>{t("map.title")}</h2></div><Compass size={20} /></div><div className="admin-world-list">{curriculum?.worlds?.map((world: any) => <div key={world.key}><span className={`card-icon ${world.accent === "mint" ? "mint" : world.accent === "sun" ? "sun" : "sky"}`}>{number(world.order)}</span><div><b>{t(world.nameKey)}</b><small>{t(world.descriptionKey)}</small></div><strong>{number(curriculum?.skills?.filter((skill: any) => skill.worldKey === world.key).length ?? 0)}</strong></div>)}</div></article></section></main>;
}

function ProfileEditor({ child, close, saved }: { child: any; close: () => void; saved: () => void }) {
  const { t, locale, number } = useLocale();
  const updateChild = trpc.profile.updateChild.useMutation({ onSuccess: () => { saved(); close(); } });
  const [name, setName] = useState(child.displayName); const [age, setAge] = useState(child.age); const [grade, setGrade] = useState(child.grade); const [avatarKey, setAvatarKey] = useState<AvatarKey>(child.avatarKey as AvatarKey);
  return <div className="modal-scrim"><form className="profile-modal" onSubmit={event => { event.preventDefault(); updateChild.mutate({ childId: child.id, displayName: name, age, grade, avatarKey, locale }); }}><button className="modal-close" type="button" onClick={close} aria-label={t("common.close")}><X size={19} /></button><p className="eyebrow"><UserRound size={15} />{t("parent.manageProfile")}</p><h2>{child.displayName}</h2><label><span>{t("onboarding.name")}</span><input value={name} onChange={event => setName(event.target.value)} /></label><div className="form-row"><label><span>{t("onboarding.age")}</span><select value={age} onChange={event => setAge(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 6).map(value => <option value={value} key={value}>{number(value)}</option>)}</select></label><label><span>{t("onboarding.grade")}</span><input value={grade} onChange={event => setGrade(event.target.value)} /></label></div><fieldset><legend>{t("onboarding.avatar")}</legend><div className="avatar-choices">{(Object.keys(avatarStyles) as AvatarKey[]).map(key => <button className={`avatar-choice ${avatarKey === key ? "is-selected" : ""}`} type="button" key={key} onClick={() => setAvatarKey(key)}><IconAvatar avatarKey={key} /></button>)}</div></fieldset><button className="primary-button form-submit" type="submit" disabled={updateChild.isPending}><span>{t("common.save")}</span><Check size={17} /></button></form></div>;
}

function AppExperience() {
  const { t } = useLocale();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: children, isLoading: childrenLoading, refetch: refetchChildren } = trpc.profile.listChildren.useQuery(undefined, { enabled: isAuthenticated });
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [lessonSkill, setLessonSkill] = useState("count-to-20");
  const [isBattle, setIsBattle] = useState(false);
  const [editing, setEditing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  useEffect(() => {
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    const clearPrompt = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", clearPrompt);
    return () => { window.removeEventListener("beforeinstallprompt", capturePrompt); window.removeEventListener("appinstalled", clearPrompt); };
  }, []);
  const requestInstall = async () => { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); };
  useEffect(() => { if (!activeChildId && children?.[0]) setActiveChildId(children[0].id); }, [activeChildId, children]);
  const activeChild = children?.find(child => child.id === activeChildId) ?? children?.[0];
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = trpc.learning.dashboard.useQuery({ childId: activeChild?.id ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(activeChild?.id) });
  const { data: curriculum } = trpc.learning.curriculum.useQuery(undefined, { enabled: Boolean(activeChild?.id) });
  const beginLesson = (skillKey: string, battle = false) => { setLessonSkill(skillKey); setIsBattle(battle); setScreen(battle ? "battle" : "lesson"); };
  const exitLesson = () => { refetchDashboard(); refetchChildren(); setScreen("home"); };
  if (loading || (isAuthenticated && childrenLoading)) return <div className="app-loading"><Sparkles size={28} /><p>{t("common.loading")}</p></div>;
  if (!isAuthenticated) return <Landing />;
  if (!activeChild) return <Onboarding onCreated={id => { setActiveChildId(id); refetchChildren(); }} />;
  if (screen === "lesson" || screen === "battle") return <LessonExperience childId={activeChild.id} skillKey={lessonSkill} isBattle={isBattle} exit={exitLesson} />;
  return <div className="app-shell"><Navigation screen={screen} setScreen={setScreen} onSignOut={logout} isAdmin={user?.role === "admin"} installPrompt={installPrompt} onInstall={requestInstall} />{dashboardLoading ? <div className="app-loading"><Sparkles size={28} /><p>{t("common.loading")}</p></div> : <>{screen === "home" && <ChildDashboard child={activeChild} dashboard={dashboard} curriculum={curriculum} setScreen={setScreen} startLesson={beginLesson} />}{screen === "map" && <AdventureMap curriculum={curriculum} childDashboard={dashboard} startLesson={beginLesson} />}{screen === "parent" && <ParentDashboard child={activeChild} dashboard={dashboard} curriculum={curriculum} onEdit={() => setEditing(true)} />}{screen === "admin" && (user?.role === "admin" ? <AdminPanel curriculum={curriculum} /> : <AccessDenied returnHome={() => setScreen("home")} />)}</>}{editing && <ProfileEditor child={activeChild} close={() => setEditing(false)} saved={() => { refetchChildren(); refetchDashboard(); }} />}</div>;
}

export default function Home() { return <AppExperience />; }
