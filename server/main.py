from fastapi import FastAPI, Query
import timm
import uvicorn

from redoodle_server.constants import DEFAULT_NUM_GUESS_IMAGES
from redoodle_server.data_model import PuzzleState
from redoodle_server.database import create_database
from redoodle_server.image_ai import compute_similarity_score, generate_image
from redoodle_server.images import add_url_encoding

db = create_database()

similarity_model = timm.create_model(
    "vit_large_patch14_dinov2.lvd142m",
    pretrained=True,
    num_classes=0,
)
similarity_model = similarity_model.eval()

app = FastAPI()


def convert_state(state: PuzzleState) -> PuzzleState:
    """URL encode all the images in the state."""
    for guess_image in state.guess_images:
        guess_image.base64_image = add_url_encoding(guess_image.base64_image)
    state.start_image.base64_image = add_url_encoding(state.start_image.base64_image)
    state.goal_image.base64_image = add_url_encoding(state.goal_image.base64_image)
    return state


@app.get("/puzzle", response_model=PuzzleState)
async def get_puzzle(player_id: str = Query(...)):
    """Load a new puzzle or the state of an existing puzzle the user is working on."""
    with db.get_connection() as conn:
        puzzle_state = db.get_puzzle(conn, player_id)
    return convert_state(puzzle_state)


@app.get("/submit_guess", response_model=PuzzleState)
async def submit_guess(player_id: str = Query(...), guess: str = Query(...)):
    """Submit a guess for the puzzle.

    - Gets the current puzzle the user is on to get the image (and num previous guesses) needed for image to image.
    - Generates the image
    - If the user is on the last guess, then we also need to generate a similarity score and return the final prompt.
    """
    # Limit guess to 100 characters
    guess = guess[:100]

    with db.get_connection() as conn:
        puzzle: PuzzleState = db.get_puzzle(conn, player_id)
    initial_image = puzzle.guess_images[-1].base64_image if puzzle.guess_images else puzzle.start_image.base64_image
    # If this is the first guess, set steps = 3 and the initial prompt gets added to the guess
    # Otherwise, set steps = 4 and leave the guess as is
    if len(puzzle.guess_images) == 0:
        steps = 3
        modified_guess = f"{guess}\n{puzzle.start_image.prompt}"
    else:
        steps = 4
        modified_guess = guess
    new_image = generate_image(initial_image, modified_guess, steps=steps)

    with db.get_connection() as conn:
        puzzle_state = db.submit_guess(conn, player_id, guess, new_image)

        # Check if this is the last guess
        if puzzle_state.guesses_submitted == DEFAULT_NUM_GUESS_IMAGES:
            similarity_score = compute_similarity_score(initial_image, new_image, similarity_model)
            puzzle_state.similarity_score = similarity_score

    return convert_state(puzzle_state)


@app.get("/next_puzzle", response_model=PuzzleState)
async def next_puzzle(player_id: str = Query(...)):
    """Request the next puzzle."""
    with db.get_connection() as conn:
        puzzle_state = db.next_puzzle(conn, player_id)
    return convert_state(puzzle_state)


@app.get("/reset_puzzle", response_model=PuzzleState)
async def reset_puzzle(player_id: str = Query(...)):
    """Reset the current puzzle to the initial state."""
    with db.get_connection() as conn:
        puzzle_state = db.reset_puzzle(conn, player_id)
    return convert_state(puzzle_state)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
