interface MicButtonProps {
  isListening: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function MicButton({ isListening, disabled, onPress }: MicButtonProps) {
  return (
    <button
      className={`mic-button ${isListening ? "mic-button--active" : ""}`}
      onClick={onPress}
      disabled={disabled}
      aria-label={isListening ? "Stop listening" : "Start talking to Curio"}
    >
      <svg viewBox="0 0 24 24" className="mic-button__icon" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0 0 19 11h-2Z"
        />
      </svg>
      <span className="mic-button__text">
        {isListening ? "Listening..." : "Tap to talk"}
      </span>
    </button>
  );
}
