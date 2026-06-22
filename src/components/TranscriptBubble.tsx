interface TranscriptBubbleProps {
  question: string;
  answer: string;
}

export function TranscriptBubble({ question, answer }: TranscriptBubbleProps) {
  if (!question && !answer) return null;

  return (
    <div className="transcript">
      {question && (
        <div className="transcript__bubble transcript__bubble--question">
          <span className="transcript__label">You asked</span>
          <p>{question}</p>
        </div>
      )}
      {answer && (
        <div className="transcript__bubble transcript__bubble--answer">
          <span className="transcript__label">Curio says</span>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
