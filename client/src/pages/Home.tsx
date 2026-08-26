import { useAuth } from "@/_core/hooks/useAuth";
import { EXPLORER_AVATARS, ExplorerPortrait, type AvatarKey } from "@/components/ExplorerPortrait";
import { AdminPanel } from "@/components/AdminPanel";
import { useLocale } from "@/contexts/LocaleContext";
import { resolveParentEntryState } from "@/lib/entryFlow";
import { serializeMatchingAnswer, serializeOrderingAnswer, serializeVisualSelectionAnswer } from "@/lib/interactionAnswers";
import { enqueueAnswer, readQueuedAnswers, removeQueuedAnswers } from "@/lib/offlineQueue";
import { trpc } from "@/lib/trpc";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Award, Backpack, BarChart3, Check, ChevronDown, CircleHelp, Coins, Compass, Flame, Home as HomeIcon, Languages, LockKeyhole, Menu, Mountain, Play, Shield, Sparkles, Swords, Trees, UserRound, WandSparkles, X, Zap } from "@/components/AdventureArt";

type Screen = "home" | "map" | "lesson" | "battle" | "boss" | "parent" | "admin";
const iconForWorld = (key: string) => ({ "number-valley": Sparkles, "addition-forest": Trees, "subtraction-desert": Mountain }[key] ?? Compass);

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

function Onboarding({ onCreated }: { onCreated: (id: string) => void }) {
  const { t, locale, setLocale, number } = useLocale();
  const createChild = trpc.profile.createChild.useMutation({ onSuccess: child => onCreated(child.id) });
  const [name, setName] = useState("");
  const [age, setAge] = useState(7);
  const [grade, setGrade] = useState("");
  const [avatarKey, setAvatarKey] = useState<AvatarKey>("starlight");
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    createChild.mutate({ displayName: name, age, grade, avatarKey, locale });
  };
  return <div className="onboarding-shell"><LanguageToggle /><main className="onboarding-card">
    <section className="onboarding-intro"><p className="eyebrow"><UserRound size={15} />{t("onboarding.eyebrow")}</p><h1>{t("onboarding.title")}</h1><p>{t("onboarding.description")}</p><div className="onboarding-art"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><ExplorerPortrait avatarKey={avatarKey} size="lg" alt={t("onboarding.avatar")} eager /></div></section>
    <form onSubmit={submit} className="profile-form">
      <label><span>{t("onboarding.name")}</span><input required maxLength={32} value={name} onChange={event => setName(event.target.value)} /></label>
      <div className="form-row"><label><span>{t("onboarding.age")}</span><select value={age} onChange={event => setAge(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 6).map(value => <option value={value} key={value}>{number(value)}</option>)}</select></label><label><span>{t("onboarding.grade")}</span><input required maxLength={32} value={grade} placeholder={t("onboarding.gradePlaceholder")} onChange={event => setGrade(event.target.value)} /></label></div>
      <fieldset><legend>{t("onboarding.avatar")}</legend><div className="avatar-choices">{(Object.keys(EXPLORER_AVATARS) as AvatarKey[]).map(key => <button className={`avatar-choice ${avatarKey === key ? "is-selected" : ""}`} type="button" key={key} onClick={() => setAvatarKey(key)} aria-label={t("onboarding.avatar")}><ExplorerPortrait avatarKey={key} size="sm" alt="" />{avatarKey === key && <Check size={15} />}</button>)}</div></fieldset>
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

function RewardShelf({ child }: { child: any }) {
  const { t, number } = useLocale();
  const { data, refetch } = trpc.rewards.collection.useQuery({ childId: child.id });
  const redeem = trpc.rewards.redeemItem.useMutation({ onSuccess: () => refetch() });
  const unlock = trpc.rewards.unlockPet.useMutation({ onSuccess: () => refetch() });
  const ownedItems = new Set((data?.inventory ?? []).map((item: any) => item.itemKey));
  const ownedPets = new Set((data?.pets ?? []).map((pet: any) => pet.petKey));
  return <section className="reward-shelf"><div className="section-title"><div><p>{t("rewards.collection")}</p><h2>{t("rewards.companions")}</h2></div><Backpack size={20} /></div><div className="reward-grid">{(data?.petCatalog ?? []).map((pet: any) => <article key={pet.key}><span className="pet-orb">{pet.key === "pico-owl" ? "◉" : "✦"}</span><b>{t(pet.titleKey)}</b><small>{t(pet.descriptionKey)}</small><button disabled={ownedPets.has(pet.key) || unlock.isPending} onClick={() => unlock.mutate({ childId: child.id, petKey: pet.key })}>{ownedPets.has(pet.key) ? t("rewards.unlocked") : `${number(pet.unlockCoins)} ${t("dashboard.coins")}`}</button></article>)}</div><div className="cosmetic-row">{(data?.catalog ?? []).map((item: any) => <button key={item.key} disabled={ownedItems.has(item.key) || redeem.isPending} onClick={() => redeem.mutate({ childId: child.id, itemKey: item.key })}><span>{item.key === "star-cape" ? "✧" : item.key === "mint-trail" ? "⌁" : "▣"}</span><b>{t(item.titleKey)}</b><small>{ownedItems.has(item.key) ? t("rewards.unlocked") : `${number(item.costCoins)} ${t("dashboard.coins")}`}</small></button>)}</div></section>;
}

function ChildDashboard({ child, dashboard, curriculum, setScreen, startLesson, startBoss }: { child: any; dashboard: any; curriculum: any; setScreen: (screen: Screen) => void; startLesson: (skillKey: string, battle?: boolean) => void; startBoss: (worldKey: string) => void }) {
  const { t, number } = useLocale();
  const currentSkill = dashboard?.recommendationSkillKey ?? "count-to-20";
  const latestAchievement = dashboard?.achievements?.[dashboard.achievements.length - 1];
  return <main id="top" className="app-main child-home">
    <section className="welcome-row"><div><p className="eyebrow"><Sparkles size={15} />{t("common.welcome")}</p><h1>{t("dashboard.greeting")}</h1></div><ExplorerPortrait avatarKey={child.avatarKey} size="lg" alt={child.displayName} eager /></section>
    <section className="stats-strip"><StatChip icon={Award} value={number(child.level)} label={t("dashboard.level", { level: "" }).trim()} tint="lavender" /><StatChip icon={Zap} value={number(child.xp)} label={t("dashboard.xp")} tint="sky" /><StatChip icon={Coins} value={number(child.coins)} label={t("dashboard.coins")} tint="sun" /><StatChip icon={Flame} value={number(child.streakDays)} label={t("dashboard.streak", { count: "" }).trim()} tint="coral" /></section>
    <section className="continue-panel"><div className="continue-copy"><p className="eyebrow"><Play size={15} />{t("lesson.sessionIntro")}</p><h2>{t("dashboard.continueTitle")}</h2><p>{t("dashboard.continueDescription")}</p><button className="primary-button" onClick={() => startLesson(currentSkill)}><span>{t("common.continue")}</span><ArrowRight size={18} /></button></div><div className="continue-scene"><span className="scene-cloud cloud-one" /><span className="scene-cloud cloud-two" /><span className="scene-sun" /><div className="scene-hill" /><div className="scene-avatar"><ExplorerPortrait avatarKey={child.avatarKey} size="lg" alt={child.displayName} eager /></div><span className="scene-star one">✦</span><span className="scene-star two">✦</span></div></section>
    <section className="dashboard-grid"><article className="quest-card"><div className="card-heading"><span className="card-icon mint"><Compass size={19} /></span><div><p>{t("dashboard.dailyQuest")}</p><h3>{t(dashboard?.dailyQuest?.titleKey ?? "quests.dailyFive")}</h3></div></div><p className="muted">{t("dashboard.questDescription", { target: number(dashboard?.dailyQuest?.target ?? 5) })}</p><div className="progress-label"><span>{t("dashboard.progress", { progress: number(dashboard?.dailyQuest?.progress ?? 0), target: number(dashboard?.dailyQuest?.target ?? 5) })}</span><b>{Math.round(((dashboard?.dailyQuest?.progress ?? 0) / (dashboard?.dailyQuest?.target ?? 5)) * 100)}%</b></div><div className="meter"><i style={{ width: `${((dashboard?.dailyQuest?.progress ?? 0) / (dashboard?.dailyQuest?.target ?? 5)) * 100}%` }} /></div><div className="quest-rewards"><span><Zap size={14} />{number(dashboard?.dailyQuest?.rewardXp ?? 25)} {t("dashboard.xp")}</span><span><Coins size={14} />{number(dashboard?.dailyQuest?.rewardCoins ?? 10)}</span></div></article>
      <article className="focus-card"><div className="card-heading"><span className="card-icon sky"><WandSparkles size={19} /></span><div><p>{t("dashboard.skillFocus")}</p><h3>{t(`skills.${skillKeyToTranslation(currentSkill)}`)}</h3></div></div><p>{t(dashboard?.recommendationKey ?? "recommendations.startAdventure")}</p><button className="text-action" onClick={() => startLesson(currentSkill)}>{t("common.start")}<ArrowRight size={16} /></button></article>
      <article className="badge-card"><div className="card-heading"><span className="card-icon sun"><Award size={19} /></span><div><p>{t("dashboard.latestBadge")}</p><h3>{latestAchievement ? t(`achievements.${achievementKeyToTranslation(latestAchievement)}.title`) : t("dashboard.noBadge")}</h3></div></div><p>{latestAchievement ? t(`achievements.${achievementKeyToTranslation(latestAchievement)}.description`) : t("lesson.feedback")}</p><span className="badge-spark"><Sparkles size={26} /></span></article>
    </section>
    <section className="quick-actions"><button onClick={() => setScreen("map")}><Compass size={19} /><span><b>{t("dashboard.exploreMap")}</b><small>{curriculum?.worlds?.length ?? 3} {t("map.skills")}</small></span><ArrowRight size={17} /></button><button onClick={() => startBoss((dashboard?.worldProgress ?? []).find((world: any) => world.isUnlocked)?.worldKey ?? "number-valley")}><Swords size={19} /><span><b>{t("dashboard.startBattle")}</b><small>{t("lesson.battleIntro")}</small></span><ArrowRight size={17} /></button></section>
    <RewardShelf child={child} />
  </main>;
}

function skillKeyToTranslation(key: string) {
  return key.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase());
}

function achievementKeyToTranslation(key: string) {
  return ({ "first-spark": "firstSpark", "three-day-streak": "threeDayStreak", "number-explorer": "numberExplorer" } as Record<string, string>)[key] ?? "firstSpark";
}

function AdventureMap({ curriculum, childDashboard, startLesson, startBoss }: { curriculum: any; childDashboard: any; startLesson: (skillKey: string) => void; startBoss: (worldKey: string) => void }) {
  const { t, number } = useLocale();
  const progress = new Map<string, any>((childDashboard?.skillProgress ?? []).map((item: any) => [item.skillKey, item]));
  const worldProgress = new Map<string, any>((childDashboard?.worldProgress ?? []).map((item: any) => [item.worldKey, item]));
  return <main className="app-main map-page"><section className="map-heading"><p className="eyebrow"><Compass size={15} />{t("map.eyebrow")}</p><h1>{t("map.title")}</h1><p>{t("map.description")}</p></section><section className="world-trail">{curriculum?.worlds?.map((world: any, worldIndex: number) => {
    const WorldIcon = iconForWorld(world.key); const isLocked = !worldProgress.get(world.key)?.isUnlocked; const worldSkills = curriculum.skills.filter((skill: any) => skill.worldKey === world.key);
    return <article className={`world-panel world-${world.accent} ${isLocked ? "is-locked" : ""}`} key={world.key}><div className="world-panel-top"><span className="world-icon"><WorldIcon size={25} /></span><span><p>{number(world.order).padStart(2, "0")}</p><h2>{t(world.nameKey)}</h2></span>{isLocked ? <span className="locked-chip"><LockKeyhole size={14} />{t("common.locked")}</span> : <span className="ready-chip"><Check size={14} />{t("map.ready")}</span>}</div><p className="world-description">{t(world.descriptionKey)}</p><div className="skill-nodes">{worldSkills.map((skill: any, index: number) => { const item = progress.get(skill.key); const mastery = item?.mastery ?? 0; return <button disabled={isLocked} onClick={() => startLesson(skill.key)} className={`skill-node ${mastery >= 80 ? "is-mastered" : ""}`} key={skill.key}><span>{mastery >= 80 ? <Check size={15} /> : index + 1}</span><b>{t(`skills.${skillKeyToTranslation(skill.key)}`)}</b><small>{mastery ? `${number(mastery)}%` : t("common.start")}</small></button>; })}</div>{isLocked ? <p className="world-lock-note"><LockKeyhole size={14} />{t("map.lockedDescription")}</p> : <button className="secondary-button world-boss-button" onClick={() => startBoss(world.key)}><Swords size={16} /><span>{t("boss.title")}</span></button>}</article>; })}</section></main>;
}

function MatchingBoard({ presentation, disabled, onChange }: { presentation: any; disabled: boolean; onChange: (value: string | null) => void }) {
  const { t } = useLocale();
  const pairs = presentation.matchingPairs ?? [];
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  useEffect(() => { setActiveSource(null); setMatches({}); onChange(null); }, [presentation, onChange]);
  const selectTarget = (target: string) => {
    if (!activeSource || disabled) return;
    const next = { ...matches, [activeSource]: target };
    setMatches(next);
    setActiveSource(null);
    onChange(serializeMatchingAnswer(pairs, next));
  };
  const usedTargets = new Set(Object.values(matches));
  return <div className="matching-board" aria-label={t("lesson.matchPrompt")}><div className="matching-column"><b>{t("lesson.matchPrompt")}</b>{pairs.map((pair: any) => <button type="button" key={pair.source} disabled={disabled} className={activeSource === pair.source ? "is-selected" : matches[pair.source] ? "is-matched" : ""} onClick={() => setActiveSource(pair.source)}>{pair.source}<small>{matches[pair.source] ?? "…"}</small></button>)}</div><div className="matching-column"><b>{t("lesson.question")}</b>{(presentation.matchTargets ?? []).map((target: string) => <button type="button" key={target} disabled={disabled || usedTargets.has(target)} className={usedTargets.has(target) ? "is-used" : ""} onClick={() => selectTarget(target)}>{target}</button>)}</div></div>;
}

function VisualSelection({ options, selected, disabled, onChange }: { options: { key: string; value: number; label: string }[]; selected: string | null; disabled: boolean; onChange: (value: string) => void }) {
  const { t } = useLocale();
  return <div className="visual-selection" role="radiogroup" aria-label={t("lesson.question")}>{options.map(option => <button type="button" role="radio" aria-checked={selected === option.key} key={option.key} disabled={disabled} className={selected === option.key ? "is-selected" : ""} onClick={() => onChange(serializeVisualSelectionAnswer(option.key))}><span className="visual-selection-count" aria-hidden="true">{Array.from({ length: Math.min(10, option.value) }, (_, index) => <i key={index} />)}</span><b>{option.label}</b></button>)}</div>;
}

function LessonExperience({ childId, skillKey, isBattle, exit }: { childId: string; skillKey: string; isBattle: boolean; exit: () => void }) {
  const { t, number, locale } = useLocale();
  const nextQuestion = trpc.learning.nextQuestion.useMutation();
  const submitAnswer = trpc.learning.submitAnswer.useMutation();
  const startSession = trpc.learning.startSession.useMutation();
  const completeSession = trpc.learning.completeSession.useMutation();
  const tutorHint = trpc.tutor.hint.useMutation();
  const syncAnswers = trpc.sync.answers.useMutation();
  const [question, setQuestion] = useState<any>(null);
  const [learningSessionId, setLearningSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [orderedValues, setOrderedValues] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [round, setRound] = useState(0);
  const startedAt = useRef(Date.now());
  const sessionStartedAt = useRef(Date.now());
  const battleShield = Math.max(0, 100 - round * 34);

  const loadQuestion = () => {
    setSelected(null); setOrderedValues([]); setResult(null); setShowHint(false); tutorHint.reset(); startedAt.current = Date.now();
    nextQuestion.mutate({ childId, skillKey }, { onSuccess: data => setQuestion(data) });
  };
  useEffect(() => {
    loadQuestion();
    sessionStartedAt.current = Date.now();
    startSession.mutate({ childId, skillKey, mode: isBattle ? "battle" : "lesson" }, { onSuccess: data => setLearningSessionId(data.id) });
  }, [childId, isBattle, skillKey]);
  useEffect(() => {
    const flush = () => {
      const operations = readQueuedAnswers(childId);
      if (!operations.length || !navigator.onLine) return;
      syncAnswers.mutate({ childId, operations }, { onSuccess: data => removeQueuedAnswers(childId, data.results.filter(item => item.status !== "rejected").map(item => item.idempotencyKey)) });
    };
    window.addEventListener("online", flush);
    flush();
    return () => window.removeEventListener("online", flush);
  }, [childId]);
  const exitSession = () => {
    if (learningSessionId) completeSession.mutate({ childId, sessionId: learningSessionId, durationSeconds: Math.round((Date.now() - sessionStartedAt.current) / 1000) });
    exit();
  };
  const prompt = useMemo(() => {
    if (!question?.presentation) return null;
    const item = question.presentation;
    if (item.interaction === "visual") return <>{item.kind === "count" ? <div className="star-count">{Array.from({ length: item.amount }, (_, index) => <Sparkles key={index} size={29} />)}</div> : item.kind === "fraction" ? <div className="fraction-visual"><b>{number(item.visual?.numerator ?? 1)}</b><i /><b>{number(item.visual?.denominator ?? 2)}</b></div> : <div className="shape-visual">△</div>}<h2>{item.kind === "count" ? t("lesson.countPrompt") : item.kind === "fraction" ? t("lesson.fractionPrompt") : t("lesson.geometryPrompt")}</h2><VisualSelection options={item.visualOptions ?? []} selected={selected} disabled={Boolean(result)} onChange={setSelected} /></>;
    if (item.kind === "count") return <><div className="star-count">{Array.from({ length: item.amount }, (_, index) => <Sparkles key={index} size={29} />)}</div><h2>{t("lesson.countPrompt")}</h2></>;
    if (item.kind === "compare") return <><div className="math-expression"><b>{number(item.left)}</b><span>?</span><b>{number(item.right)}</b></div><h2>{t("lesson.comparePrompt")}</h2></>;
    if (item.kind === "sequence") return <><div className="math-expression sequence">{item.values.map((value: number | null, index: number) => <b key={index}>{value === null ? "?" : number(value)}</b>)}</div><h2>{t("lesson.sequencePrompt")}</h2></>;
    if (item.kind === "fraction" && item.interaction === "matching") return <><div className="fraction-visual"><b>{number(item.visual?.numerator ?? 1)}</b><i /><b>{number(item.visual?.denominator ?? 2)}</b></div><h2>{t("lesson.matchPrompt")}</h2><MatchingBoard presentation={item} disabled={Boolean(result)} onChange={setSelected} /></>;
    if (item.kind === "fraction") return <><div className="fraction-visual"><b>{number(item.visual?.numerator ?? 1)}</b><i /><b>{number(item.visual?.denominator ?? 2)}</b></div><h2>{t("lesson.fractionPrompt")}</h2></>;
    if (item.kind === "logic") return <><div className="logic-visual"><span>{item.visual?.shape === "pattern" ? "● ▲ ● ▲" : "● ▲ ▲ ●"}</span></div><h2>{t("lesson.logicPrompt")}</h2></>;
    if (item.kind === "geometry") return <><div className="shape-visual">△</div><h2>{t("lesson.geometryPrompt")}</h2></>;
    const operator = item.kind === "addition" ? "+" : item.kind === "subtraction" ? "−" : item.kind === "multiplication" ? "×" : item.kind === "division" ? "÷" : "+";
    return <><div className="math-expression"><b>{number(item.left)}</b><span>{operator}</span><b>{number(item.right)}</b><span>=</span><b>?</b></div><h2>{item.kind === "wordProblem" ? t("lesson.wordProblemPrompt") : t("lesson.equationPrompt")}</h2></>;
  }, [number, question?.presentation, result, selected, t]);
  const answer = () => {
    if (!selected || !question || result) return;
    const payload = { childId, questionSessionId: question.questionSessionId, answer: selected, responseTimeMs: Date.now() - startedAt.current, usedHint: showHint };
    submitAnswer.mutate(payload, { onSuccess: data => { setResult(data); if (data.isCorrect) setRound(value => value + 1); }, onError: () => { if (!navigator.onLine) enqueueAnswer(childId, { ...payload, idempotencyKey: crypto.randomUUID() }); } });
  };
  const feedbackTitle = result?.isCorrect ? t("lesson.correct") : t("lesson.incorrect");
  return <main className={`lesson-page ${isBattle ? "battle-page" : ""}`}><header className="lesson-header"><button type="button" onClick={exitSession} className="icon-button" aria-label={t("common.back")}><ArrowLeft size={20} /></button><div><p>{isBattle ? t("navigation.battle") : t("lesson.eyebrow")}</p><b>{t(`skills.${skillKeyToTranslation(skillKey)}`)}</b></div><span className="question-count">{number(Math.min(round + 1, 3))} / {number(3)}</span></header>
    {isBattle && <section className="battle-stage"><div className="guardian"><Shield size={56} /><span><i /></span></div><div className="shield-readout"><span>{t("lesson.shield")}</span><div className="meter"><i style={{ width: `${battleShield}%` }} /></div><b>{number(battleShield)}%</b></div></section>}
    <section className="lesson-card"><p className="eyebrow"><WandSparkles size={15} />{isBattle ? t("lesson.battleIntro") : t("lesson.sessionIntro")}</p>{nextQuestion.isPending && <div className="lesson-loading"><Sparkles size={28} /><p>{t("common.loading")}</p></div>}{nextQuestion.error && <div className="empty-state"><CircleHelp size={28} /><p>{t("common.error")}</p><button onClick={loadQuestion}>{t("common.retry")}</button></div>}{question && <><div className="prompt-area">{prompt}</div>{question.presentation.timeLimitSeconds && <p className="timed-question">{t("lesson.timedQuestion", { seconds: number(question.presentation.timeLimitSeconds) })}</p>}<p className="choose-label">{question.presentation.interaction === "numeric" || question.presentation.interaction === "timed" ? t("lesson.enterAnswer") : question.presentation.interaction === "ordering" ? t("lesson.orderPrompt") : question.presentation.interaction === "matching" ? t("lesson.matchPrompt") : t("lesson.question")}</p>{question.presentation.interaction === "numeric" || question.presentation.interaction === "timed" ? <input className="numeric-answer" inputMode="numeric" value={selected ?? ""} onChange={event => setSelected(event.target.value)} disabled={Boolean(result)} aria-label={t("lesson.enterAnswer")} /> : question.presentation.interaction === "ordering" ? <><div className="order-tray">{orderedValues.map((value, index) => <button type="button" key={`${value}-${index}`} onClick={() => { const next = orderedValues.filter((_, itemIndex) => itemIndex !== index); setOrderedValues(next); setSelected(serializeOrderingAnswer(next)); }}>{value}</button>)}</div><div className="answer-grid ordering-grid">{(question.presentation.choices ?? []).filter((choice: string) => !orderedValues.includes(choice)).map((choice: string) => <button disabled={Boolean(result)} onClick={() => { const next = [...orderedValues, choice]; setOrderedValues(next); setSelected(serializeOrderingAnswer(next)); }} key={choice}>{choice}</button>)}</div></> : question.presentation.interaction === "visual" ? null : <div className={`answer-grid ${question.presentation.interaction === "matching" ? "matching-grid" : ""}`}>{question.presentation.interaction === "matching" && <div className="match-source">{question.presentation.matchSource}</div>}{(question.presentation.choices ?? []).map((choice: string) => <button disabled={Boolean(result)} className={`${selected === choice ? "is-selected" : ""} ${result && choice === selected ? (result.isCorrect ? "is-correct" : "is-wrong") : ""}`} onClick={() => setSelected(choice)} key={choice}>{choice === "true" ? t("lesson.true") : choice === "false" ? t("lesson.false") : choice}</button>)}</div>}<button type="button" className="hint-button" onClick={() => { const next = !showHint; setShowHint(next); if (next) tutorHint.mutate({ childId, skillKey, presentation: question.presentation, locale }); }}><CircleHelp size={16} />{t("lesson.hint")}</button>{showHint && <p className="hint-text">{tutorHint.data?.hint ?? (tutorHint.isPending ? t("common.loading") : t("lesson.hintText"))}</p>}{!result ? <button disabled={!selected || submitAnswer.isPending} className="primary-button lesson-action" onClick={answer}><span>{t("lesson.check")}</span><Check size={18} /></button> : <div className={`feedback-card ${result.isCorrect ? "correct" : "incorrect"}`}><span>{result.isCorrect ? <Sparkles size={24} /> : <WandSparkles size={24} />}</span><div><h3>{feedbackTitle}</h3><p>{t(question.explanationKey)}</p><b>{t("lesson.earned", { xp: number(result.rewards.xp), coins: number(result.rewards.coins) })}</b></div>{round >= 3 && result.isCorrect ? <button className="primary-button" onClick={exitSession}><span>{isBattle ? t("lesson.battleWin") : t("lesson.lessonWin")}</span><ArrowRight size={18} /></button> : <button className="secondary-button" onClick={loadQuestion}><span>{t("lesson.next")}</span><ArrowRight size={18} /></button>}</div>}</>}</section></main>;
}

function BossQuestionVisual({ presentation, number }: { presentation: any; number: (value: number) => string }) {
  if (presentation.kind === "count") return <div className="star-count">{Array.from({ length: presentation.amount ?? 0 }, (_, index) => <Sparkles key={index} size={29} />)}</div>;
  if (presentation.kind === "fraction") return <div className="fraction-visual"><b>{number(presentation.visual?.numerator ?? 1)}</b><i /><b>{number(presentation.visual?.denominator ?? 2)}</b></div>;
  if (presentation.kind === "logic") return <div className="logic-visual"><span>{presentation.visual?.shape === "pattern" ? "● ▲ ● ▲" : "● ▲ ▲ ●"}</span></div>;
  const operator = presentation.bossOperator ?? (presentation.kind === "multiplication" ? "×" : presentation.kind === "division" ? "÷" : presentation.kind === "subtraction" ? "−" : "+");
  return <div className="math-expression"><b>{number(presentation.left ?? 0)}</b><span>{operator}</span><b>{number(presentation.right ?? 0)}</b><span>=</span><b>?</b></div>;
}

function BossExperience({ childId, worldKey, exit }: { childId: string; worldKey: string; exit: () => void }) {
  const { t, number } = useLocale();
  const start = trpc.learning.boss.start.useMutation();
  const nextQuestion = trpc.learning.boss.nextQuestion.useMutation();
  const submit = trpc.learning.boss.submitAnswer.useMutation();
  const [attempt, setAttempt] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answerValue, setAnswerValue] = useState("");
  const [result, setResult] = useState<any>(null);
  const startedAt = useRef(Date.now());
  const load = (attemptId: string) => { setAnswerValue(""); setResult(null); startedAt.current = Date.now(); nextQuestion.mutate({ childId, bossAttemptId: attemptId }, { onSuccess: setQuestion }); };
  useEffect(() => { start.mutate({ childId, worldKey }, { onSuccess: data => { setAttempt(data); load(data.id); } }); }, [childId, worldKey]);
  const send = () => { if (!answerValue || !question || !attempt) return; submit.mutate({ childId, bossAttemptId: attempt.id, questionSessionId: question.questionSessionId, answer: answerValue, responseTimeMs: Date.now() - startedAt.current, usedHint: false }, { onSuccess: setResult }); };
  const health = result?.boss?.healthRemaining ?? question?.healthRemaining ?? attempt?.healthRemaining ?? 100;
  const choices = question?.presentation?.choices ?? [];
  return <main className="lesson-page battle-page"><header className="lesson-header"><button type="button" onClick={exit} className="icon-button" aria-label={t("common.back")}><ArrowLeft size={20} /></button><div><p>{t("boss.title")}</p><b>{t(`bosses.${worldKey}`)}</b></div><span className="question-count">{number(health)}%</span></header><section className="battle-stage"><div className="guardian"><Shield size={56} /><span><i /></span></div><div className="shield-readout"><span>{t("lesson.shield")}</span><div className="meter"><i style={{ width: `${health}%` }} /></div><b>{number(health)}%</b></div></section><section className="lesson-card">{(start.isPending || nextQuestion.isPending) && <div className="lesson-loading"><Sparkles size={28} /><p>{t("common.loading")}</p></div>}{(start.error || nextQuestion.error) && <div className="empty-state"><CircleHelp size={28} /><p>{t("common.error")}</p><button onClick={exit}>{t("common.back")}</button></div>}{question && <><div className="prompt-area"><BossQuestionVisual presentation={question.presentation} number={number} /><h2>{t(`boss.challenges.${question.presentation.bossChallengeKey ?? "count"}`)}</h2></div>{choices.length ? <div className="answer-grid">{choices.map((choice: string) => <button key={choice} disabled={Boolean(result)} className={answerValue === choice ? "is-selected" : ""} onClick={() => setAnswerValue(choice)}>{choice === "true" ? t("lesson.true") : choice === "false" ? t("lesson.false") : choice}</button>)}</div> : <input className="numeric-answer" inputMode="numeric" value={answerValue} onChange={event => setAnswerValue(event.target.value)} aria-label={t("lesson.enterAnswer")} />}{!result ? <button className="primary-button lesson-action" onClick={send} disabled={!answerValue || submit.isPending}><span>{t("lesson.check")}</span><Check size={18} /></button> : <div className={`feedback-card ${result.isCorrect ? "correct" : "incorrect"}`}><span>{result.isCorrect ? <Sparkles size={24} /> : <WandSparkles size={24} />}</span><div><h3>{result.boss.completed ? t("boss.complete") : result.isCorrect ? t("boss.hit") : t("lesson.incorrect")}</h3><p>{t(question.explanationKey)}</p></div>{result.boss.completed ? <button className="primary-button" onClick={exit}><span>{t("lesson.finish")}</span><ArrowRight size={18} /></button> : <button className="secondary-button" onClick={() => load(attempt.id)}><span>{t("lesson.next")}</span><ArrowRight size={18} /></button>}</div>}</>}</section></main>;
}

function ParentDashboard({ child, children, dashboard, curriculum, onEdit, onSelectChild }: { child: any; children: any[]; dashboard: any; curriculum: any; onEdit: () => void; onSelectChild: (childId: string) => void }) {
  const { t, number } = useLocale();
  const { data: weekly } = trpc.profile.weeklyReport.useQuery({ childId: child.id });
  const { data: preferences } = trpc.profile.preferences.useQuery();
  const updatePreferences = trpc.profile.updatePreferences.useMutation();
  const exportChild = trpc.profile.exportChild.useQuery({ childId: child.id }, { enabled: false });
  const downloadExport = async () => { const response = await exportChild.refetch(); if (!response.data) return; const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${child.displayName}-learning-data.json`; link.click(); URL.revokeObjectURL(url); };
  const skillRows = (dashboard?.skillProgress ?? []).slice(0, 5);
  const learningMinutes = Math.max(0, Math.round((dashboard?.learningSeconds ?? 0) / 60));
  const skill = dashboard?.recommendationSkillKey ?? "count-to-20";
  return <main className="app-main parent-page"><section className="parent-heading"><div><p className="eyebrow"><BarChart3 size={15} />{t("parent.eyebrow")}</p><h1>{t("parent.title")}</h1><label className="child-switcher"><span>{t("parent.childSelect")}</span><select value={child.id} onChange={event => onSelectChild(event.target.value)}>{children.map(profile => <option value={profile.id} key={profile.id}>{profile.displayName}</option>)}</select></label></div><button className="secondary-button" onClick={onEdit}><span>{t("parent.manageProfile")}</span><UserRound size={16} /></button></section>
    <section className="parent-summary"><article><span className="card-icon sky"><Play size={18} /></span><p>{t("parent.learningTime")}</p><b>{number(learningMinutes)} <small>{t("common.minutes")}</small></b></article><article><span className="card-icon lavender"><CircleHelp size={18} /></span><p>{t("parent.questions")}</p><b>{number(dashboard?.totalAttempts ?? 0)}</b></article><article><span className="card-icon mint"><Check size={18} /></span><p>{t("parent.accuracy")}</p><b>{dashboard?.accuracy === null || dashboard?.accuracy === undefined ? "—" : `${number(dashboard.accuracy)}%`}</b></article><article><span className="card-icon coral"><Flame size={18} /></span><p>{t("parent.streak")}</p><b>{number(child.streakDays)}</b></article></section>
    <section className="parent-grid"><article className="progress-card"><div className="section-title"><div><p>{t("parent.summary")}</p><h2>{t("parent.skillProgress")}</h2></div><BarChart3 size={20} /></div>{skillRows.length ? <div className="progress-list">{skillRows.map((item: any) => <div key={item.skillKey}><div><span>{t(`skills.${skillKeyToTranslation(item.skillKey)}`)}</span><b>{number(item.mastery)}%</b></div><div className="meter"><i style={{ width: `${item.mastery}%` }} /></div></div>)}</div> : <div className="empty-inline"><Backpack size={24} /><p>{t("parent.emptyProgress")}</p></div>}</article><article className="recommendation-card"><span className="recommendation-star"><WandSparkles size={22} /></span><p>{t("parent.recommendation")}</p><h2>{t(`skills.${skillKeyToTranslation(skill)}`)}</h2><p>{t("parent.recommendationDetail", { skill: t(`skills.${skillKeyToTranslation(skill)}`) })}</p><span className="recommendation-line" /></article><article className="activity-card"><div className="section-title"><div><p>{t("parent.summary")}</p><h2>{t("parent.activity")}</h2></div><ClockIcon /></div>{dashboard?.recentAttempts?.length ? <div className="activity-list">{dashboard.recentAttempts.slice(0, 4).map((attempt: any) => <div key={attempt.id}><span className={attempt.isCorrect ? "activity-good" : "activity-try"}>{attempt.isCorrect ? <Check size={15} /> : <WandSparkles size={15} />}</span><div><b>{t(`skills.${skillKeyToTranslation(attempt.skillKey)}`)}</b><small>{attempt.isCorrect ? t("rewards.correctAnswer") : t("rewards.braveTry")}</small></div></div>)}</div> : <div className="empty-inline"><Compass size={24} /><p>{t("parent.noActivity")}</p></div>}</article><article className="privacy-card"><LockKeyhole size={21} /><div><b>{t("parent.privacy")}</b><p>{t("parent.privacyDetail")}</p></div></article></section><section className="parent-controls"><div><p>{t("parent.weeklyReport")}</p><b>{number(weekly?.summary?.accuracy ?? 0)}% {t("parent.accuracy")}</b><small>{number(weekly?.summary?.attempts ?? 0)} {t("parent.questions")}</small></div><label><input type="checkbox" checked={preferences?.weeklyReportEnabled ?? true} onChange={event => updatePreferences.mutate({ weeklyReportEnabled: event.target.checked })} />{t("parent.weeklyReminder")}</label><label><input type="checkbox" checked={preferences?.learningReminderEnabled ?? false} onChange={event => updatePreferences.mutate({ learningReminderEnabled: event.target.checked })} />{t("parent.learningReminder")}</label><label><input type="checkbox" checked={preferences?.dataExportAllowed ?? true} onChange={event => updatePreferences.mutate({ dataExportAllowed: event.target.checked })} />{t("parent.allowDataExport")}</label><button className="secondary-button" onClick={downloadExport} disabled={exportChild.isFetching || preferences?.dataExportAllowed === false}><span>{t("parent.exportData")}</span><ArrowRight size={16} /></button></section>
  </main>;
}

function ClockIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>; }

function AccessDenied({ returnHome }: { returnHome: () => void }) {
  const { t } = useLocale();
  return <main className="app-main"><section className="empty-state rounded-[24px] border border-[#e4deee] bg-white shadow-[0_8px_22px_rgba(67,48,113,.09)]"><LockKeyhole size={30} /><h1 className="text-[28px]">{t("common.accessDenied")}</h1><p>{t("common.accessDeniedDetail")}</p><button className="secondary-button" onClick={returnHome}>{t("common.returnHome")}</button></section></main>;
}

function AppFailure({ retry }: { retry: () => void }) {
  const { t } = useLocale();
  return <main className="app-main"><section className="empty-state rounded-[24px] border border-[#e4deee] bg-white shadow-[0_8px_22px_rgba(67,48,113,.09)]"><CircleHelp size={30} /><h1 className="text-[28px]">{t("common.error")}</h1><p>{t("offline.offlineDetail")}</p><button className="secondary-button" onClick={retry}>{t("common.retry")}</button></section></main>;
}

function AdventureLoadingSkeleton() {
  const { t } = useLocale();
  return <div className="skeleton-shell" aria-busy="true" aria-live="polite"><header className="skeleton-header"><span className="skeleton-brand-mark" /><b>{t("brand.name")}</b><span className="skeleton-header-line" /></header><main className="skeleton-main"><section className="skeleton-welcome"><div><span className="skeleton-kicker" /><span className="skeleton-title" /><span className="skeleton-copy" /></div><span className="skeleton-orb" /></section><section className="skeleton-card-grid"><i /><i /><i /></section><p>{t("common.loading")}</p></main></div>;
}

function LegacyAdminPanel({ curriculum }: { curriculum: any }) {
  const { t, number } = useLocale();
  const seed = trpc.admin.seedStarterContent.useMutation();
  const { data: analytics } = trpc.admin.analytics.useQuery();
  const content = trpc.admin.content.useQuery();
  const refreshContent = () => { content.refetch(); };
  const saveWorld = trpc.admin.saveWorld.useMutation({ onSuccess: refreshContent });
  const saveSkill = trpc.admin.saveSkill.useMutation({ onSuccess: refreshContent });
  const saveTemplate = trpc.admin.saveQuestionTemplate.useMutation({ onSuccess: refreshContent });
  const saveQuest = trpc.admin.saveQuest.useMutation({ onSuccess: refreshContent });
  const saveReward = trpc.admin.saveReward.useMutation({ onSuccess: refreshContent });
  const [worldDraft, setWorldDraft] = useState({ key: "", order: 1, nameKey: "", descriptionKey: "", accent: "sky", iconKey: "stars", isPublished: true });
  const [skillDraft, setSkillDraft] = useState({ key: "", worldKey: "number-valley", order: 1, nameKey: "", generatorKey: "count", isPublished: true });
  const [templateDraft, setTemplateDraft] = useState({ key: "", skillKey: "count-to-20", kind: "count", difficulty: 1, isEnabled: true });
  const [questDraft, setQuestDraft] = useState({ key: "", titleKey: "", target: 5, rewardXp: 25, rewardCoins: 10, isDaily: true, isEnabled: true });
  const [rewardDraft, setRewardDraft] = useState<{ key: string; titleKey: string; category: "outfit" | "accessory" | "backpack" | "effect" | "pet"; costCoins: number; assetKey: string; isPublished: boolean }>({ key: "", titleKey: "", category: "effect", costCoins: 10, assetKey: "", isPublished: true });
  const loadDraft = <T,>(value: T, setValue: (draft: T) => void) => setValue(value);
  return <main className="app-main admin-page"><section className="parent-heading"><div><p className="eyebrow"><Backpack size={15} />{t("admin.title")}</p><h1>{t("admin.contentStudio")}</h1><p>{t("admin.manageDetail")}</p></div></section><section className="admin-grid"><article className="admin-summary-card"><span className="recommendation-star"><Sparkles size={22} /></span><p>{t("admin.curriculum")}</p><h2>{number(curriculum?.worlds?.length ?? 0)} {t("admin.worlds")}</h2><div className="admin-counts"><span>{number(curriculum?.skills?.length ?? 0)} {t("admin.skills")}</span><span>{number(curriculum?.lessons?.length ?? 0)} {t("admin.lessons")}</span></div><button className="primary-button" onClick={() => seed.mutate()} disabled={seed.isPending}><span>{seed.isPending ? t("common.loading") : t("admin.seed")}</span><Sparkles size={17} /></button>{seed.isSuccess && <p className="admin-success"><Check size={14} />{t("admin.saved")}</p>}</article><article className="admin-list-card"><div className="section-title"><div><p>{t("admin.analytics")}</p><h2>{t("admin.productHealth")}</h2></div><BarChart3 size={20} /></div><div className="admin-counts admin-metrics"><span>{number(analytics?.activeChildren ?? 0)} {t("admin.children")}</span><span>{number(analytics?.accuracy ?? 0)}% {t("parent.accuracy")}</span><span>{number(analytics?.attempts ?? 0)} {t("parent.questions")}</span></div></article></section><section className="admin-grid">{content.isLoading ? <div className="lesson-loading"><Sparkles size={25} /><p>{t("common.loading")}</p></div> : <><article className="admin-list-card"><h2>{t("admin.worldEditor")}</h2><select value="" onChange={event => { const item = content.data?.worlds.find((row: any) => row.key === event.target.value); if (item) loadDraft(item, setWorldDraft); }}><option value="">{t("admin.selectWorld")}</option>{content.data?.worlds.map((item: any) => <option key={item.key} value={item.key}>{item.key}</option>)}</select><form className="profile-form" onSubmit={event => { event.preventDefault(); saveWorld.mutate(worldDraft); }}><label><span>{t("admin.key")}</span><input required value={worldDraft.key} onChange={event => setWorldDraft({ ...worldDraft, key: event.target.value })} /></label><div className="form-row"><label><span>{t("admin.order")}</span><input type="number" min="1" value={worldDraft.order} onChange={event => setWorldDraft({ ...worldDraft, order: Number(event.target.value) })} /></label><label><span>{t("admin.published")}</span><input type="checkbox" checked={worldDraft.isPublished} onChange={event => setWorldDraft({ ...worldDraft, isPublished: event.target.checked })} /></label></div><label><span>{t("admin.nameKey")}</span><input required value={worldDraft.nameKey} onChange={event => setWorldDraft({ ...worldDraft, nameKey: event.target.value })} /></label><label><span>{t("admin.descriptionKey")}</span><input required value={worldDraft.descriptionKey} onChange={event => setWorldDraft({ ...worldDraft, descriptionKey: event.target.value })} /></label><label><span>{t("admin.key")}</span><input required value={worldDraft.iconKey} onChange={event => setWorldDraft({ ...worldDraft, iconKey: event.target.value })} /></label><button className="secondary-button" disabled={saveWorld.isPending}><span>{t("admin.saveWorld")}</span><Check size={16} /></button></form></article><article className="admin-list-card"><h2>{t("admin.skillEditor")}</h2><select value="" onChange={event => { const item = content.data?.skills.find((row: any) => row.key === event.target.value); if (item) loadDraft(item, setSkillDraft); }}><option value="">{t("admin.selectSkill")}</option>{content.data?.skills.map((item: any) => <option key={item.key} value={item.key}>{item.key}</option>)}</select><form className="profile-form" onSubmit={event => { event.preventDefault(); saveSkill.mutate(skillDraft); }}><label><span>{t("admin.key")}</span><input required value={skillDraft.key} onChange={event => setSkillDraft({ ...skillDraft, key: event.target.value })} /></label><label><span>{t("admin.worldEditor")}</span><select value={skillDraft.worldKey} onChange={event => setSkillDraft({ ...skillDraft, worldKey: event.target.value })}>{content.data?.worlds.map((item: any) => <option key={item.key} value={item.key}>{item.key}</option>)}</select></label><div className="form-row"><label><span>{t("admin.order")}</span><input type="number" min="1" value={skillDraft.order} onChange={event => setSkillDraft({ ...skillDraft, order: Number(event.target.value) })} /></label><label><span>{t("admin.published")}</span><input type="checkbox" checked={skillDraft.isPublished} onChange={event => setSkillDraft({ ...skillDraft, isPublished: event.target.checked })} /></label></div><label><span>{t("admin.nameKey")}</span><input required value={skillDraft.nameKey} onChange={event => setSkillDraft({ ...skillDraft, nameKey: event.target.value })} /></label><label><span>{t("admin.generator")}</span><input required value={skillDraft.generatorKey} onChange={event => setSkillDraft({ ...skillDraft, generatorKey: event.target.value })} /></label><button className="secondary-button" disabled={saveSkill.isPending}><span>{t("admin.saveSkill")}</span><Check size={16} /></button></form></article><article className="admin-list-card"><h2>{t("admin.templateEditor")}</h2><select value="" onChange={event => { const item = content.data?.questionTemplates.find((row: any) => row.key === event.target.value); if (item) loadDraft(item, setTemplateDraft); }}><option value="">{t("admin.selectTemplate")}</option>{content.data?.questionTemplates.map((item: any) => <option key={item.key} value={item.key}>{item.key}</option>)}</select><form className="profile-form" onSubmit={event => { event.preventDefault(); saveTemplate.mutate(templateDraft); }}><label><span>{t("admin.key")}</span><input required value={templateDraft.key} onChange={event => setTemplateDraft({ ...templateDraft, key: event.target.value })} /></label><label><span>{t("admin.skillEditor")}</span><select value={templateDraft.skillKey} onChange={event => setTemplateDraft({ ...templateDraft, skillKey: event.target.value })}>{content.data?.skills.map((item: any) => <option key={item.key} value={item.key}>{item.key}</option>)}</select></label><div className="form-row"><label><span>{t("admin.kind")}</span><input required value={templateDraft.kind} onChange={event => setTemplateDraft({ ...templateDraft, kind: event.target.value })} /></label><label><span>{t("admin.difficulty")}</span><input type="number" min="1" max="5" value={templateDraft.difficulty} onChange={event => setTemplateDraft({ ...templateDraft, difficulty: Number(event.target.value) })} /></label></div><label><span>{t("admin.enabled")}</span><input type="checkbox" checked={templateDraft.isEnabled} onChange={event => setTemplateDraft({ ...templateDraft, isEnabled: event.target.checked })} /></label><button className="secondary-button" disabled={saveTemplate.isPending}><span>{t("admin.saveTemplate")}</span><Check size={16} /></button></form></article><article className="admin-list-card"><h2>{t("admin.questEditor")}</h2><select value="" onChange={event => { const item = content.data?.quests.find((row: any) => row.key === event.target.value); if (item) loadDraft(item, setQuestDraft); }}><option value="">{t("admin.selectQuest")}</option>{content.data?.quests.map((item: any) => <option key={item.key} value={item.key}>{item.key}</option>)}</select><form className="profile-form" onSubmit={event => { event.preventDefault(); saveQuest.mutate(questDraft); }}><label><span>{t("admin.key")}</span><input required value={questDraft.key} onChange={event => setQuestDraft({ ...questDraft, key: event.target.value })} /></label><label><span>{t("admin.nameKey")}</span><input required value={questDraft.titleKey} onChange={event => setQuestDraft({ ...questDraft, titleKey: event.target.value })} /></label><div className="form-row"><label><span>{t("admin.target")}</span><input type="number" min="1" value={questDraft.target} onChange={event => setQuestDraft({ ...questDraft, target: Number(event.target.value) })} /></label><label><span>{t("admin.daily")}</span><input type="checkbox" checked={questDraft.isDaily} onChange={event => setQuestDraft({ ...questDraft, isDaily: event.target.checked })} /></label></div><div className="form-row"><label><span>{t("admin.rewardXp")}</span><input type="number" min="0" value={questDraft.rewardXp} onChange={event => setQuestDraft({ ...questDraft, rewardXp: Number(event.target.value) })} /></label><label><span>{t("admin.rewardCoins")}</span><input type="number" min="0" value={questDraft.rewardCoins} onChange={event => setQuestDraft({ ...questDraft, rewardCoins: Number(event.target.value) })} /></label></div><button className="secondary-button" disabled={saveQuest.isPending}><span>{t("admin.saveQuest")}</span><Check size={16} /></button></form></article></>}</section></main>;
}

function ProfileEditor({ child, close, saved, removed }: { child: any; close: () => void; saved: () => void; removed: () => void }) {
  const { t, locale, number } = useLocale();
  const updateChild = trpc.profile.updateChild.useMutation({ onSuccess: () => { saved(); close(); } });
  const deleteChild = trpc.profile.deleteChild.useMutation({ onSuccess: () => { removed(); close(); } });
  const [name, setName] = useState(child.displayName); const [age, setAge] = useState(child.age); const [grade, setGrade] = useState(child.grade); const [avatarKey, setAvatarKey] = useState<AvatarKey>(child.avatarKey as AvatarKey);
  return <div className="modal-scrim"><form className="profile-modal" onSubmit={event => { event.preventDefault(); updateChild.mutate({ childId: child.id, displayName: name, age, grade, avatarKey, locale }); }}><button className="modal-close" type="button" onClick={close} aria-label={t("common.close")}><X size={19} /></button><p className="eyebrow"><UserRound size={15} />{t("parent.manageProfile")}</p><h2>{child.displayName}</h2><label><span>{t("onboarding.name")}</span><input value={name} onChange={event => setName(event.target.value)} /></label><div className="form-row"><label><span>{t("onboarding.age")}</span><select value={age} onChange={event => setAge(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => index + 6).map(value => <option value={value} key={value}>{number(value)}</option>)}</select></label><label><span>{t("onboarding.grade")}</span><input value={grade} onChange={event => setGrade(event.target.value)} /></label></div><fieldset><legend>{t("onboarding.avatar")}</legend><div className="avatar-choices">{(Object.keys(EXPLORER_AVATARS) as AvatarKey[]).map(key => <button className={`avatar-choice ${avatarKey === key ? "is-selected" : ""}`} type="button" key={key} onClick={() => setAvatarKey(key)}><ExplorerPortrait avatarKey={key} size="sm" alt="" /></button>)}</div></fieldset><button className="primary-button form-submit" type="submit" disabled={updateChild.isPending}><span>{t("common.save")}</span><Check size={17} /></button><button className="text-action danger-action" type="button" disabled={deleteChild.isPending} onClick={() => { if (window.confirm(t("parent.deleteConfirm"))) deleteChild.mutate({ childId: child.id }); }}>{t("parent.deleteChild")}</button></form></div>;
}

function AppExperience({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const { t } = useLocale();
  const { user, loading, isAuthenticated, logout } = auth;
  const { data: children, isLoading: childrenLoading, error: childrenError, refetch: refetchChildren } = trpc.profile.listChildren.useQuery(undefined, { enabled: isAuthenticated });
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [lessonSkill, setLessonSkill] = useState("count-to-20");
  const [bossWorld, setBossWorld] = useState("number-valley");
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
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = trpc.learning.dashboard.useQuery({ childId: activeChild?.id ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(activeChild?.id) });
  const { data: curriculum, error: curriculumError, refetch: refetchCurriculum } = trpc.learning.curriculum.useQuery(undefined, { enabled: Boolean(activeChild?.id) });
  const beginLesson = (skillKey: string, battle = false) => { if (skillKey.startsWith("boss:")) { setBossWorld(skillKey.slice(5)); setScreen("boss"); return; } setLessonSkill(skillKey); setIsBattle(battle); setScreen(battle ? "battle" : "lesson"); };
  const beginBoss = (worldKey: string) => { setBossWorld(worldKey); setScreen("boss"); };
  const exitLesson = () => { refetchDashboard(); refetchChildren(); setScreen("home"); };
  const entryState = resolveParentEntryState({ authLoading: loading, authenticated: isAuthenticated, childrenLoading, hasChildrenError: Boolean(childrenError), childCount: children?.length ?? 0 });
  if (entryState === "loading") return <AdventureLoadingSkeleton />;
  if (entryState === "landing") return null;
  if (entryState === "error") return <AppFailure retry={() => refetchChildren()} />;
  if (entryState === "onboarding" || !activeChild) return <Onboarding onCreated={id => { setActiveChildId(id); refetchChildren(); }} />;
  if (screen === "lesson" || screen === "battle") return <LessonExperience childId={activeChild.id} skillKey={lessonSkill} isBattle={isBattle} exit={exitLesson} />;
  if (screen === "boss") return <BossExperience childId={activeChild.id} worldKey={bossWorld} exit={exitLesson} />;
  const retryProtectedData = () => { refetchDashboard(); refetchCurriculum(); };
  return <div className="app-shell"><Navigation screen={screen} setScreen={setScreen} onSignOut={logout} isAdmin={user?.role === "admin"} installPrompt={installPrompt} onInstall={requestInstall} />{dashboardLoading ? <AdventureLoadingSkeleton /> : (dashboardError || curriculumError) ? <AppFailure retry={retryProtectedData} /> : <>{screen === "home" && <ChildDashboard child={activeChild} dashboard={dashboard} curriculum={curriculum} setScreen={setScreen} startLesson={beginLesson} startBoss={beginBoss} />}{screen === "map" && <AdventureMap curriculum={curriculum} childDashboard={dashboard} startLesson={beginLesson} startBoss={beginBoss} />}{screen === "parent" && <ParentDashboard child={activeChild} children={children ?? []} dashboard={dashboard} curriculum={curriculum} onEdit={() => setEditing(true)} onSelectChild={setActiveChildId} />}{screen === "admin" && (user?.role === "admin" ? <AdminPanel curriculum={curriculum} /> : <AccessDenied returnHome={() => setScreen("home")} />)}</>}{editing && <ProfileEditor child={activeChild} close={() => setEditing(false)} saved={() => { refetchChildren(); refetchDashboard(); }} removed={() => { setActiveChildId(null); refetchChildren(); }} />}</div>;
}

function StandaloneAdventure() {
  const auth = useAuth();
  return <AppExperience auth={auth} />;
}

export default function Home({ auth }: { auth?: ReturnType<typeof useAuth> }) {
  return auth ? <AppExperience auth={auth} /> : <StandaloneAdventure />;
}
