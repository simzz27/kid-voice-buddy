import { useEffect, useRef, useState } from "react";
import { BuddyAvatar } from "./components/BuddyAvatar";
import { MicButton } from "./components/MicButton";
import { TranscriptBubble } from "./components/TranscriptBubble";
import { useSpeechRecognition } from "./services/useSpeechRecognition";
import { askCurio } from "./services/gemini";
import { speak, stopSpeaking } from "./services/speech";
import { logExchange } from "./services/firebase";
import type { BuddyState } from "./types";
import "./styles.css";

function makeSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [buddyState, setBuddyState] = useState<BuddyState>("idle");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const sessionIdRef = useRef(makeSessionId());

  const {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Reflect listening state into the buddy's visual state
  useEffect(() => {
    if (isListening) {
      setBuddyState("listening");
      setCurrentAnswer("");
    }
  }, [isListening]);

  // When the child finishes speaking, send the transcript to Curio
  useEffect(() => {
    if (!finalTranscript) return;

    const question = finalTranscript.trim();
    setCurrentQuestion(question);
    setBuddyState("thinking");

    askCurio(question).then(({ answer, flaggedForReview }) => {
      setCurrentAnswer(answer);
      setBuddyState("speaking");

      void logExchange(
        {
          question,
          answer,
          timestamp: Date.now(),
          flaggedForReview,
        },
        sessionIdRef.current
      );

      speak(answer, () => setBuddyState("idle"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTranscript]);

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
      return;
    }
    stopSpeaking();
    setCurrentQuestion("");
    setCurrentAnswer("");
    startListening();
  };

  if (!isSupported) {
    return (
      <div className="app app--unsupported">
        <p>
          This browser doesn&rsquo;t support voice input yet. Please try Curio
          in Chrome or Edge!
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Curio</h1>
        <p className="app__tagline">Your curious learning buddy</p>
      </header>

      <main className="app__main">
        <BuddyAvatar state={buddyState} />

        <MicButton
          isListening={isListening}
          disabled={buddyState === "thinking" || buddyState === "speaking"}
          onPress={handleMicPress}
        />

        {isListening && interimTranscript && (
          <p className="app__interim">&ldquo;{interimTranscript}&rdquo;</p>
        )}

        <TranscriptBubble question={currentQuestion} answer={currentAnswer} />
      </main>

      <footer className="app__footer">
        <p>Curio is a research prototype. A grown-up is always nearby. 💛</p>
      </footer>
    </div>
  );
}
