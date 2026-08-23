export type AvatarKey = "starlight" | "ember" | "sage" | "tide";

export const EXPLORER_AVATARS: Record<AvatarKey, { src: string; role: "girl" | "boy" }> = {
  starlight: { src: "/manus-storage/avatar-girl-luna_bd574766.webp", role: "girl" },
  ember: { src: "/manus-storage/avatar-girl-sana_eb2b43b4.png", role: "girl" },
  sage: { src: "/manus-storage/avatar-boy-omar_c1eb8ddc.png", role: "boy" },
  tide: { src: "/manus-storage/avatar-boy-yusuf_b5cd6995.png", role: "boy" },
};

export function ExplorerPortrait({ avatarKey, size = "md", alt = "", eager = false }: { avatarKey: string; size?: "sm" | "md" | "lg"; alt?: string; eager?: boolean }) {
  const avatar = EXPLORER_AVATARS[avatarKey as AvatarKey] ?? EXPLORER_AVATARS.starlight;
  return <span className={`explorer-portrait explorer-portrait-${size}`} data-role={avatar.role}><img src={avatar.src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" /></span>;
}
