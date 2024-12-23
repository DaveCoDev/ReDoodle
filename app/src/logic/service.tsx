import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ApiPuzzleState, IPuzzleState } from "./types";
import {
  GOAL_IMAGE_HEADING,
  IMAGE_PLACEHOLDER_CAPTION,
  ORIGINAL_IMAGE_HEADING,
} from "../constants";

export function getPlayerId(): string {
  const storedId = localStorage.getItem("playerId");
  if (storedId) return storedId;

  const newId = uuidv4();
  localStorage.setItem("playerId", newId);
  return newId;
}

function transformApiResponse(response: ApiPuzzleState): IPuzzleState {
  let currentSelectedGuessIndex = response.guess_images.length - 1;
  if (response.guess_images.length === 0) {
    currentSelectedGuessIndex = 0;
  }

  return {
    startImage: {
      base64Image: response.start_image.base64_image,
      caption: response.start_image.prompt,
      headingText: ORIGINAL_IMAGE_HEADING,
      isLoading: false,
      displayPlaceholder: false,
    },
    goalImage: {
      base64Image: response.goal_image.base64_image,
      caption: response.goal_image.prompt,
      headingText: GOAL_IMAGE_HEADING,
      isLoading: false,
      displayPlaceholder: false,
    },
    // Creates guess images. If the guess is undefined due to there being less guesses
    // made than the total expected for the puzzle then the guess image will be a placeholder
    guessImages: Array.from({ length: response.guesses_total }, (_, index) => {
      const guess = response.guess_images[index];
      if (guess) {
        return {
          base64Image: guess.base64_image,
          caption: guess.prompt,
          headingText: "",
          isLoading: false,
          displayPlaceholder: false,
        };
      }
      return {
        base64Image: "",
        caption: IMAGE_PLACEHOLDER_CAPTION,
        headingText: "",
        isLoading: false,
        displayPlaceholder: true,
      };
    }),
    guessesTotal: response.guesses_total,
    puzzleName: `Puzzle ${response.puzzle_num.toString()}`,
    currentSelectedGuessIndex,
    similarityScore: response.similarity_score,
    finalPrompt: response.final_prompt,
  };
}

export async function fetchPuzzle(playerId: string): Promise<IPuzzleState> {
  const response = await axios.get<ApiPuzzleState>("/puzzle", {
    params: {
      player_id: playerId,
    },
  });
  return transformApiResponse(response.data);
}

export async function resetPuzzle(playerId: string): Promise<IPuzzleState> {
  const response = await axios.get<ApiPuzzleState>("/reset_puzzle", {
    params: {
      player_id: playerId,
    },
  });
  return transformApiResponse(response.data);
}

export async function nextPuzzle(playerId: string): Promise<IPuzzleState> {
  const response = await axios.get<ApiPuzzleState>("/next_puzzle", {
    params: { player_id: playerId },
  });
  return transformApiResponse(response.data);
}

export async function submitGuess(
  playerId: string,
  guess: string,
): Promise<IPuzzleState> {
  const response = await axios.get<ApiPuzzleState>("/submit_guess", {
    params: { player_id: playerId, guess },
  });
  return transformApiResponse(response.data);
}
