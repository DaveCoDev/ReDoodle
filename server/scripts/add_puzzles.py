from pathlib import Path

from redoodle_server.database import create_database
from redoodle_server.images import load_base64_image

PUZZLE_IMAGES_DIR = Path(__file__).parent.parent / "data" / "puzzle_images"
PROMPTS_FILE = PUZZLE_IMAGES_DIR / "prompts.txt"


def main() -> None:
    # Load the prompts
    with PROMPTS_FILE.open() as f:
        prompts = f.readlines()
    prompts = [prompt.strip() for prompt in prompts]

    # Load each of the image names in the folder in order of the file name
    image_paths: list[Path] = sorted(
        [p for p in PUZZLE_IMAGES_DIR.glob("*.png") if p.stem.isdigit()], key=lambda p: int(p.stem)
    )

    db = create_database()

    # Process images in pairs
    for i in range(0, len(image_paths) - 1, 2):
        start_image_path = image_paths[i]
        goal_image_path = image_paths[i + 1]

        # Get corresponding prompts (2 prompts per pair)
        prompt_index = i // 2 * 2  # Integer division to get prompt pairs
        if prompt_index + 1 >= len(prompts):
            # Skip if we don't have enough prompts
            continue

        start_prompt = prompts[prompt_index]
        goal_prompt = prompts[prompt_index + 1]

        with db.get_connection() as conn:
            db.save_puzzle(
                conn=conn,
                puzzle_num=(i // 2) + 1,  # Puzzle numbers start at 1
                start_image=load_base64_image(start_image_path),
                goal_image=load_base64_image(goal_image_path),
                start_prompt=start_prompt,
                goal_prompt=goal_prompt,
            )


if __name__ == "__main__":
    main()
