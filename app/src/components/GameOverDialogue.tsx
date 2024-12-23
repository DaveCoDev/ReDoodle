import { IPuzzleImage } from "../logic/types";
import { ImageDisplay } from "./GuessImages";

type GameOverDialogueProps = {
  isOpen: boolean;
  onClose: () => void;
  onNextPuzzle: () => void;
  similarityScore: number;
  goalImage: IPuzzleImage;
  finalGuessImage: IPuzzleImage;
};

export default function GameOverDialogue({
  isOpen,
  onClose,
  onNextPuzzle,
  similarityScore,
  goalImage,
  finalGuessImage,
}: GameOverDialogueProps) {
  if (!isOpen) return null;

  const handleNextPuzzle = () => {
    onNextPuzzle();
    onClose();
  };

  return (
    <div className="fixed bg-pastelGray bg-opacity-35 inset-0 flex items-center justify-center z-50 ">
      <div className="bg-pastelBlue rounded-3xl px-6 py-4 w-full max-w-lg mx-4">
        <div className="mb-3">
          <p className="font-semibold text-black text-center text-2xl">
            Your final image was {similarityScore.toFixed(1)}% similar!
          </p>
          <p className="text-xl text-pastelGray"></p>
        </div>

        {/* Image comparison section */}
        <div className="flex gap-4 mb-4 bg-pastelWhite rounded-3xl px-6 py-4">
          <div className="w-1/2">
            <p className="text-center text-black font-semibold mb-2">
              Your Final Guess
            </p>
            <ImageDisplay image={finalGuessImage} />
          </div>
          <div className="w-1/2">
            <p className="text-center text-black font-semibold mb-2">Goal</p>
            <ImageDisplay image={goalImage} />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 p-2 bg-pastelCoral hover:bg-pastelCoral-hover active:bg-pastelCoral-active transition-all duration-150 text-pastelGray rounded-full font-semibold text-lg border border-pastelWhite shadow-md"
          >
            Close
          </button>
          <button
            onClick={handleNextPuzzle}
            className="flex-1 p-2 bg-pastelCoral hover:bg-pastelCoral-hover active:bg-pastelCoral-active transition-all duration-150 text-pastelGray rounded-full font-semibold text-lg border border-pastelWhite shadow-md"
          >
            Next Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
