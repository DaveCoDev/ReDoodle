from pydantic import BaseModel


class PuzzleImage(BaseModel):
    base64_image: str
    prompt: str | None


class PuzzleState(BaseModel):
    start_image: PuzzleImage
    goal_image: PuzzleImage
    guess_images: list[PuzzleImage]
    guesses_submitted: int
    guesses_total: int
    puzzle_num: int
    similarity_score: float | None = None
    final_prompt: str | None = None
