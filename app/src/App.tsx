import "./App.css";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import GameImages from "./components/GameImages";
import {
  fetchPuzzle,
  resetPuzzle,
  nextPuzzle,
  submitGuess,
} from "./logic/service";
import { IPuzzleState } from "./logic/types";
import { getPlayerId } from "./logic/service";
import GuessImages from "./components/GuessImages";
import GameOverDialogue from "./components/GameOverDialogue";
import {
  DEFAULT_NUM_GUESS_IMAGES,
  GOAL_IMAGE_HEADING,
  IMAGE_PLACEHOLDER_CAPTION,
  ORIGINAL_IMAGE_HEADING,
} from "./constants";

const initialPuzzleState: IPuzzleState = {
  startImage: {
    base64Image: "",
    caption: "Loading...",
    headingText: ORIGINAL_IMAGE_HEADING,
    isLoading: true,
    displayPlaceholder: true,
  },
  goalImage: {
    base64Image: "",
    caption: "Loading...",
    headingText: GOAL_IMAGE_HEADING,
    isLoading: true,
    displayPlaceholder: true,
  },
  guessImages: Array(DEFAULT_NUM_GUESS_IMAGES)
    .fill(null)
    .map(() => ({
      base64Image: "",
      caption: IMAGE_PLACEHOLDER_CAPTION,
      headingText: "",
      isLoading: true,
      displayPlaceholder: true,
    })),
  guessesTotal: DEFAULT_NUM_GUESS_IMAGES,
  puzzleName: "Loading...",
  currentSelectedGuessIndex: 0,
  similarityScore: undefined,
  finalPrompt: undefined,
};

export default function App() {
  const [puzzleState, setPuzzleState] =
    useState<IPuzzleState>(initialPuzzleState);
  const [isGameOverDialogueOpen, setIsGameOverDialogueOpen] = useState(false);

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const playerId = getPlayerId();
        const newPuzzleState = await fetchPuzzle(playerId);
        setPuzzleState(newPuzzleState);
      } catch (err) {
        console.error(err);
      }
    };
    void loadPuzzle();
  }, []);

  // Handles changing the shown image in the carousel based on if the user clicks on a guess indicator
  const handleGuessSelect = (index: number) => {
    setPuzzleState({
      ...puzzleState,
      currentSelectedGuessIndex: index,
    });
  };

  const handleReset = () => {
    void (async () => {
      try {
        setPuzzleState(initialPuzzleState);
        const playerId = getPlayerId();
        const resetState = await resetPuzzle(playerId);
        setPuzzleState(resetState);
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const handleNextPuzzle = () => {
    void (async () => {
      try {
        setPuzzleState(initialPuzzleState);
        const playerId = getPlayerId();
        const nextPuzzleState = await nextPuzzle(playerId);
        setPuzzleState(nextPuzzleState);
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const handleSubmitGuess = () => {
    return async (guess: string) => {
      try {
        const playerId = getPlayerId();
        const nextImageIndex = puzzleState.guessImages.filter(
          (img) => !img.displayPlaceholder,
        ).length;

        // Update the state so that the next image is set as loading (so the animation plays)
        // and set the currentlySelectedGuessIndex to that so we will show the next image
        setPuzzleState((prevState) => ({
          ...prevState,
          guessImages: prevState.guessImages.map((img, idx) =>
            idx === nextImageIndex ? { ...img, isLoading: true } : img,
          ),
          currentSelectedGuessIndex: nextImageIndex,
        }));

        const newPuzzleState = await submitGuess(playerId, guess);
        setPuzzleState(newPuzzleState);

        if (
          newPuzzleState.similarityScore !== undefined &&
          newPuzzleState.finalPrompt !== undefined &&
          newPuzzleState.guessImages.filter((img) => !img.displayPlaceholder)
            .length >= newPuzzleState.guessesTotal
        ) {
          setIsGameOverDialogueOpen(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative">
      <Header puzzleName={puzzleState.puzzleName} />

      <main className="w-full max-w-xl px-4 mt-18">
        <GameImages puzzleState={puzzleState} />
        <div className="py-1"></div> {/* Add spacing */}
        <GuessImages
          puzzleState={puzzleState}
          onGuessSelect={handleGuessSelect}
        />
      </main>

      <Footer
        guessesSubmitted={
          puzzleState.guessImages.filter((img) => !img.displayPlaceholder)
            .length
        }
        guessesTotal={puzzleState.guessesTotal}
        onReset={handleReset}
        onNextPuzzle={handleNextPuzzle}
        onSubmitGuess={handleSubmitGuess()}
      />

      <GameOverDialogue
        isOpen={isGameOverDialogueOpen}
        onClose={() => {
          setIsGameOverDialogueOpen(false);
        }}
        onNextPuzzle={handleNextPuzzle}
        similarityScore={puzzleState.similarityScore ?? 0}
        goalImage={puzzleState.goalImage}
        finalGuessImage={puzzleState.guessImages[puzzleState.guessesTotal - 1]}
      />
    </div>
  );
}
