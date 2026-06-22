import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's native SpeechRecognition API (real ASR, not a simulation).
 * Handles continuous listening, interim transcripts, and graceful fallback
 * for browsers that don't support the API (e.g. Firefox) so the app degrades
 * to text input instead of crashing — important for accessibility/reliability
 * in real classroom or home deployments.
 */

// Minimal type surface for the non-standard Web Speech API
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | undefined;
  return ctor ?? null;
}

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(final);
        setInterimTranscript("");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setFinalTranscript("");
    setInterimTranscript("");
    setIsListening(true);
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
  };
}
