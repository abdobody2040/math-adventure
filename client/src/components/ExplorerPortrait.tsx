export type AvatarKey = "starlight" | "ember" | "sage" | "tide";

export const EXPLORER_AVATARS: Record<AvatarKey, { src: string; role: "girl" | "boy" }> = {
  starlight: { src: "/manus-storage/avatar-girl-luna_bd574766.webp", role: "girl" },
  ember: { src: "", role: "girl" },
  sage: { src: "/manus-storage/avatar-boy-omar_c1eb8ddc.png", role: "boy" },
  tide: { src: "/manus-storage/avatar-boy-yusuf_b5cd6995.png", role: "boy" },
};

export function ExplorerPortrait({ avatarKey, size = "md", alt = "", eager = false }: { avatarKey: string; size?: "sm" | "md" | "lg"; alt?: string; eager?: boolean }) {
  const avatar = EXPLORER_AVATARS[avatarKey as AvatarKey] ?? EXPLORER_AVATARS.starlight;
  const [failed, setFailed] = useState(false);
  return <span className={`explorer-portrait explorer-portrait-${size}`} data-role={avatar.role}>{failed || !avatar.src ? <svg aria-hidden="true" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill={avatar.role === "girl" ? "#9f8deb" : "#70c7b0"}/><circle cx="50" cy="42" r="21" fill="#744d39"/><path d="M24 91c3-21 16-32 26-32s23 11 26 32" fill="#fff6d6"/><path d="M36 38c1-16 28-21 31 0-7-6-24-6-31 0Z" fill="#3c2b53"/><circle cx="42" cy="45" r="2" fill="#fff"/><circle cx="58" cy="45" r="2" fill="#fff"/><path d="M43 54c5 4 9 4 14 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg> : <img src={avatar.src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />}</span>;
}
import { useState } from "react";
