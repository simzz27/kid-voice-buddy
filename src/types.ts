export type BuddyState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface QARecord {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  flaggedForReview: boolean;
}

export interface SpeechRecognitionResultLike {
  transcript: string;
  isFinal: boolean;
}
