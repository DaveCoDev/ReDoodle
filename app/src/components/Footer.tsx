import { useState } from "react";

type FooterProps = {
  guessesSubmitted: number;
  guessesTotal: number;
  onReset: () => void;
  onNextPuzzle: () => void;
  onSubmitGuess: (guess: string) => Promise<void>;
};

export default function Footer({
  guessesSubmitted = 0,
  guessesTotal = 3,
  onReset,
  onNextPuzzle,
  onSubmitGuess,
}: FooterProps) {
  const [guess, setGuess] = useState<string>("");
  const isMaxGuesses = guessesSubmitted >= guessesTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim() && !isMaxGuesses) {
      try {
        await onSubmitGuess(guess.trim());
        setGuess("");
      } catch (error) {
        console.error("Failed to submit guess:", error);
      }
    }
  };

  return (
    <footer className="w-full max-w-xl space-y-2 px-2 py-3">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="flex flex-row items-center bg-pastelCoral p-4 rounded-full border border-pastelWhite shadow-md"
      >
        <input
          type="text"
          value={guess}
          maxLength={100}
          onChange={(e) => {
            setGuess(e.target.value);
          }}
          disabled={isMaxGuesses}
          placeholder={isMaxGuesses ? "" : "Enter your prompt"}
          className={`flex-grow rounded-full text-lg text-pastelGray font-semibold px-4 py-1 ${
            isMaxGuesses ? "opacity-100 cursor-not-allowed" : ""
          }`}
        />
        <p className="text-lg font-semibold ml-auto px-6">
          {guessesSubmitted}/{guessesTotal}
        </p>
      </form>
      <div className="flex space-x-4">
        <button
          onClick={onReset}
          className="flex-1 p-2 bg-pastelCoral hover:bg-pastelCoral-hover active:bg-pastelCoral-active active:transform active:scale-95 transition-all duration-150 text-pastelGray rounded-full font-semibold text-lg border border-pastelWhite shadow-md"
        >
          Reset
        </button>
        <button
          onClick={onNextPuzzle}
          className="flex-1 p-2 bg-pastelCoral hover:bg-pastelCoral-hover active:bg-pastelCoral-active active:transform active:scale-95 transition-all duration-150 text-pastelGray rounded-full font-semibold text-lg border border-pastelWhite shadow-md"
        >
          Next Puzzle
        </button>
      </div>
    </footer>
  );
}
