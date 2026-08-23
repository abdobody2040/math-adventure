import type { ReactElement, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & { size?: number };
type IconName = "arrow-left" | "arrow-right" | "award" | "backpack" | "chart" | "check" | "chevron" | "help" | "coins" | "compass" | "flame" | "home" | "language" | "lock" | "menu" | "mountain" | "play" | "shield" | "sparkles" | "swords" | "trees" | "user" | "wand" | "close" | "bolt";

function AdventureGlyph({ name, size = 20, ...props }: IconProps & { name: IconName }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, ReactElement> = {
    "arrow-left": <><path d="M19 12H5m6-6-6 6 6 6"/></>, "arrow-right": <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    award: <><circle cx="12" cy="9" r="5"/><path d="m8.5 13.2-1.3 7 4.8-2.2 4.8 2.2-1.3-7"/><path d="m10 9 1.3 1.3L14.5 7"/></>,
    backpack: <><path d="M7 8V6a5 5 0 0 1 10 0v2"/><rect x="4" y="8" width="16" height="13" rx="3"/><path d="M9 12h6v4H9z"/></>,
    chart: <><path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/><path d="m5 9 5-4 5 7 4-5"/></>,
    check: <path d="m5 12 4.2 4.2L19 6.5"/>, chevron: <path d="m7 10 5 5 5-5"/>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.7 2.7 0 1 1 4 2.4c-.9.5-1.5 1.1-1.5 2.4"/><path d="M12 17h.01"/></>,
    coins: <><ellipse cx="12" cy="6" rx="6.5" ry="3"/><path d="M5.5 6v7c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3V6"/><path d="M5.5 10c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3"/><path d="M5.5 14c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z"/><path d="M12 3v1m0 16v1m9-9h-1M4 12H3"/></>,
    flame: <path d="M12 21c4.1 0 6.8-2.8 6.8-6.5 0-3.8-3-5.8-4.1-9-2.2 1-4 3.1-4 5.3-1.1-.9-1.6-2-1.6-3.3C6.4 10.1 5.2 12.6 5.2 15c0 3.5 2.6 6 6.8 6Z"/>,
    home: <><path d="m3.5 11 8.5-7 8.5 7v9H4z"/><path d="M9 20v-5h6v5"/></>, language: <><path d="M4 5h9M8.5 3v2c0 5-2.1 8.3-5.5 10"/><path d="M5 11c1.8 1.7 3.9 2.6 6.5 2.8"/><path d="m18.5 6 4 12m-6.2-4h6.3"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></>, menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    mountain: <><path d="m3 20 6.5-12 3.1 5.1 2.2-3.5L21 20H3Z"/><path d="m8 11.2 1.5 1.7 1.3-1.4"/></>, play: <path d="M7 4.5v15l12-7.5-12-7.5Z"/>,
    shield: <><path d="M12 3 19 6v5c0 5-3 8.4-7 10-4-1.6-7-5-7-10V6l7-3Z"/><path d="m8.5 12 2.2 2.2 4.7-5"/></>,
    sparkles: <><path d="M12 2.8c.8 5.8 2.6 7.6 8.4 8.4-5.8.8-7.6 2.6-8.4 8.4-.8-5.8-2.6-7.6-8.4-8.4 5.8-.8 7.6-2.6 8.4-8.4Z"/><path d="M19 3v3m1.5-1.5h-3"/></>,
    swords: <><path d="m6 4 14 14M18 4 4 18"/><path d="m4 4 3 3M17 17l3 3M20 4l-3 3M7 17l-3 3"/></>,
    trees: <><path d="M7 21v-5m10 5v-6"/><path d="m2.5 15 4.5-10 4.5 10H2.5ZM12.5 15 17 3l4.5 12h-9Z"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.7-4 3.1-6 7-6s6.3 2 7 6"/></>, wand: <><path d="m5 19 12-12"/><path d="m15 4 1-2m2 5 2-1m-5 4 1 2"/><path d="M4 20h.01"/></>, close: <path d="m6 6 12 12M18 6 6 18"/>, bolt: <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/>,
  };
  return <svg {...common} {...props}>{paths[name]}</svg>;
}

const make = (name: IconName) => (props: IconProps) => <AdventureGlyph {...props} name={name} />;
export const ArrowLeft = make("arrow-left"); export const ArrowRight = make("arrow-right"); export const Award = make("award"); export const Backpack = make("backpack"); export const BarChart3 = make("chart"); export const Check = make("check"); export const ChevronDown = make("chevron"); export const CircleHelp = make("help"); export const Coins = make("coins"); export const Compass = make("compass"); export const Flame = make("flame"); export const Home = make("home"); export const Languages = make("language"); export const LockKeyhole = make("lock"); export const Menu = make("menu"); export const Mountain = make("mountain"); export const Play = make("play"); export const Shield = make("shield"); export const Sparkles = make("sparkles"); export const Swords = make("swords"); export const Trees = make("trees"); export const UserRound = make("user"); export const WandSparkles = make("wand"); export const X = make("close"); export const Zap = make("bolt");
