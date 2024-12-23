export type IPuzzleImage = {
  base64Image: string;
  caption: string;
  headingText: string;
  isLoading: boolean;
  displayPlaceholder: boolean;
};

// Main game state
export type IPuzzleState = {
  startImage: IPuzzleImage;
  goalImage: IPuzzleImage;
  guessImages: IPuzzleImage[];
  guessesTotal: number;
  puzzleName: string;
  currentSelectedGuessIndex: number;
  similarityScore: number | undefined;
  finalPrompt: string | undefined;
};

export type ApiPuzzleImage = {
  base64_image: string;
  prompt: string;
};

// This is the puzzle state returned from the API
export type ApiPuzzleState = {
  start_image: ApiPuzzleImage;
  goal_image: ApiPuzzleImage;
  guess_images: (ApiPuzzleImage | undefined)[];
  guesses_submitted: number;
  guesses_total: number;
  puzzle_num: number;
  similarity_score: number | undefined;
  final_prompt: string | undefined;
};
