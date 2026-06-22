import type { BuddyState } from "../types";

interface BuddyAvatarProps {
  state: BuddyState;
}

const STATE_LABELS: Record<BuddyState, string> = {
  idle: "Tap the button and ask me anything!",
  listening: "I'm listening...",
  thinking: "Let me think...",
  speaking: "...",
  error: "I didn't quite catch that — try again?",
};

export function BuddyAvatar({ state }: BuddyAvatarProps) {
  return (
    <div className={`buddy-avatar buddy-avatar--${state}`} aria-live="polite">
      <div className="buddy-avatar__face">
        <div className="buddy-avatar__eye buddy-avatar__eye--left" />
        <div className="buddy-avatar__eye buddy-avatar__eye--right" />
        <div className="buddy-avatar__mouth" />
      </div>
      <p className="buddy-avatar__label">{STATE_LABELS[state]}</p>
    </div>
  );
}
