/**
 * Reads text aloud using the browser's SpeechSynthesis API, tuned for a
 * friendly, slightly slower pace appropriate for young children.
 */
export function speak(text: string, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel(); // stop any prior utterance first

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.15;
  utterance.lang = "en-US";

  const voices = window.speechSynthesis.getVoices();
  const friendlyVoice = voices.find((v) => /female|child|samantha/i.test(v.name));
  if (friendlyVoice) utterance.voice = friendlyVoice;

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
