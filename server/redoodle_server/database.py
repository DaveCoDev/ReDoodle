from dataclasses import dataclass
from pathlib import Path
import sqlite3

from loguru import logger

from redoodle_server.constants import DEFAULT_NUM_GUESS_IMAGES
from redoodle_server.data_model import PuzzleImage, PuzzleState


@dataclass
class DBConfig:
    db_path: Path
    schema_path: Path


class Database:
    def __init__(self, config: DBConfig) -> None:
        self.db_path = config.db_path
        self.schema_path = config.schema_path
        self._init_db()

    def _init_db(self) -> None:
        """Initialize the database with schema if it doesn't exist."""
        with self.get_connection() as conn:
            if self.schema_path.exists():
                with self.schema_path.open() as f:
                    conn.executescript(f.read())
            conn.commit()

    def get_connection(self) -> sqlite3.Connection:
        """Get a database connection with Row factory enabled."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def save_puzzle(
        self,
        conn: sqlite3.Connection,
        puzzle_num: int,
        start_image: bytes,
        goal_image: bytes,
        start_prompt: str,
        goal_prompt: str,
    ) -> None:
        """Save a new puzzle to the database.
        To be used by the service creating puzzles, rather than the app server.
        """
        conn.execute(
            """
            INSERT INTO puzzles (puzzle_num, start_image, goal_image, start_prompt, goal_prompt)
            VALUES (?, ?, ?, ?, ?)
            """,
            (puzzle_num, start_image, goal_image, start_prompt, goal_prompt),
        )

    def submit_guess(self, conn: sqlite3.Connection, player_id: str, guess: str, guess_image: str) -> PuzzleState:
        """Handles submitting a guess for a puzzle."""
        # First check if there is an in progress puzzle
        result = conn.execute(
            """
            SELECT puzzle_num, MAX(guess_num) as max_guess
            FROM guesses
            WHERE player_id = ?
            AND puzzle_num = (
                SELECT MAX(puzzle_num) FROM guesses WHERE player_id = ?
            )
            GROUP BY puzzle_num
            """,
            (player_id, player_id),
        )
        row: sqlite3.Row | None = result.fetchone()
        if row:
            puzzle_num = row["puzzle_num"]
            guess_num = int(row["max_guess"]) + 1
            if guess_num >= DEFAULT_NUM_GUESS_IMAGES:
                return None
        else:
            # If not, get the current puzzle and submit the first guess for that puzzle.
            puzzle_num = self.get_current_puzzle_num(conn, player_id)
            guess_num = 0

        conn.execute(
            """
            INSERT INTO guesses (player_id, puzzle_num, guess_num, image, guess_prompt)
            VALUES (?, ?, ?, ?, ?)
            """,
            (player_id, puzzle_num, guess_num, guess_image, guess),
        )
        return self.get_puzzle(conn, player_id)

    def get_puzzle(self, conn: sqlite3.Connection, player_id: str) -> PuzzleState:
        """Gets the current puzzle state for the user."""
        # First check for any in progress puzzles (indicated by having guesses)
        result = conn.execute(
            """
            SELECT puzzles.start_image, puzzles.start_prompt, puzzles.goal_image, puzzles.goal_prompt,
                guesses.image, guesses.guess_prompt, guesses.guess_num, puzzles.puzzle_num
            FROM puzzles
            INNER JOIN guesses ON guesses.puzzle_num = puzzles.puzzle_num
            WHERE guesses.player_id = ?
            ORDER BY guesses.guess_num ASC
            """,
            (player_id,),
        )
        rows: list[sqlite3.Row] = result.fetchall()
        raw_data = [dict(row) for row in rows]
        if rows:
            # Figure out if that was the last guess
            last_guess_num = raw_data[-1]["guess_num"]
            is_last_guess = last_guess_num == (DEFAULT_NUM_GUESS_IMAGES - 1)
            goal_prompt = raw_data[0]["goal_prompt"] if is_last_guess else None

            guess_images = [PuzzleImage(base64_image=(row["image"]), prompt=row["guess_prompt"]) for row in raw_data]
            # For the rest, assume all the fields will be the same so we can just use the first row
            return PuzzleState(
                start_image=PuzzleImage(
                    base64_image=raw_data[0]["start_image"],
                    prompt=raw_data[0]["start_prompt"],
                ),
                goal_image=PuzzleImage(base64_image=raw_data[0]["goal_image"], prompt=goal_prompt),
                guess_images=guess_images,
                guesses_submitted=len(raw_data),
                guesses_total=DEFAULT_NUM_GUESS_IMAGES,
                puzzle_num=raw_data[0]["puzzle_num"],
                similarity_score=None,
                final_prompt=None,
            )
        else:
            # Otherwise, get number of the puzzle they are on
            current_puzzle_num = self.get_current_puzzle_num(conn, player_id)
            # Return the next puzzle
            result = conn.execute(
                """
                SELECT puzzle_num, start_image, start_prompt, goal_image
                FROM puzzles
                WHERE puzzle_num = ?
                """,
                (current_puzzle_num,),
            )
            row: sqlite3.Row | None = result.fetchone()
            if row:
                return PuzzleState(
                    start_image=PuzzleImage(base64_image=row["start_image"], prompt=row["start_prompt"]),
                    goal_image=PuzzleImage(base64_image=row["goal_image"], prompt=None),
                    guess_images=[],
                    guesses_submitted=0,
                    guesses_total=DEFAULT_NUM_GUESS_IMAGES,
                    puzzle_num=row["puzzle_num"],
                    similarity_score=None,
                    final_prompt=None,
                )
            else:
                logger.error("No puzzles found in `get_puzzle`")
                raise ValueError("No puzzles found in `get_puzzle`")

    def complete_puzzle(self, conn: sqlite3.Connection, player_id: str, finished_puzzle: int) -> None:
        """Inserts or updates the user state with the finished puzzle number and similarity score.

        Args:
            finished_puzzle: The puzzle number that the user has finished.
        """
        conn.execute(
            """
            INSERT OR REPLACE INTO user_state (player_id, finished_puzzle)
            VALUES (?, ?)
            """,
            (player_id, finished_puzzle),
        )

    def get_current_puzzle_num(self, conn: sqlite3.Connection, player_id: str) -> int:
        """Get the current puzzle number for the user.
        The current puzzle number is the first puzzle number that is higher than the last finished puzzle.
        If the user has no finished puzzles, get the first puzzle number.
        If there are no higher puzzle numbers, return the MAX puzzle number (keep repeating the last puzzle)
        """
        result = conn.execute(
            """
            -- Gets the last puzzle this player finished (if any)
            WITH last_finished AS (
                SELECT finished_puzzle 
                FROM user_state 
                WHERE player_id = ? 
                ORDER BY finished_puzzle DESC 
                LIMIT 1
            )
            SELECT 
                CASE 
                    -- For users with no finished puzzles, return the first puzzle
                    WHEN (SELECT finished_puzzle FROM last_finished) IS NULL 
                    THEN (SELECT MIN(puzzle_num) FROM puzzles)
                    ELSE (
                        COALESCE(
                            -- Try to get the next available puzzle number
                            (
                                SELECT MIN(puzzle_num)
                                FROM puzzles
                                WHERE puzzle_num > (SELECT finished_puzzle FROM last_finished)
                            ),
                            -- If no higher numbers exist, return the highest puzzle
                            (SELECT MAX(puzzle_num) FROM puzzles)
                        )
                    )
                END AS puzzle_num
            """,
            (player_id,),
        )
        row: sqlite3.Row | None = result.fetchone()
        if row:
            puzzle_num = row["puzzle_num"]
            return puzzle_num
        else:
            logger.error("No puzzles found in `get_current_puzzle_num`")
            raise ValueError("No puzzles found in `get_current_puzzle_num`")

    def get_next_puzzle_num(self, conn: sqlite3.Connection, player_id: str) -> int:
        """Get the next puzzle number for the user.
        If the user has no finished puzzles, get the first puzzle number.
        If there are no higher puzzle numbers, return the MAX puzzle number (keep repeating the last puzzle)
        """
        current_puzzle_num = self.get_current_puzzle_num(conn, player_id)
        result = conn.execute(
            """
            SELECT COALESCE(
                (
                    SELECT puzzles.puzzle_num
                    FROM puzzles
                    WHERE puzzles.puzzle_num > ?
                    ORDER BY puzzles.puzzle_num ASC
                    LIMIT 1
                ),
                (SELECT MAX(puzzle_num) FROM puzzles)
            ) AS puzzle_num
            """,
            (current_puzzle_num,),
        )
        row: sqlite3.Row | None = result.fetchone()
        if row:
            return row["puzzle_num"]
        else:
            logger.error("No puzzles found in `get_next_puzzle_num`")
            raise ValueError("No puzzles found in `get_next_puzzle_num`")

    def next_puzzle(self, conn: sqlite3.Connection, player_id: str) -> PuzzleState:
        """Handles the database changes when the user moves to the next puzzle."""
        # Get the current puzzle number to mark it as finished
        puzzle_num = self.get_current_puzzle_num(conn, player_id)
        # Get the next puzzle number before completing the current puzzle
        next_puzzle_num = self.get_next_puzzle_num(conn, player_id)
        self.complete_puzzle(conn, player_id, puzzle_num)
        # Delete all guesses for the player
        conn.execute(
            """
            DELETE FROM guesses WHERE player_id = ?
            """,
            (player_id,),
        )

        # Return the next puzzle
        result = conn.execute(
            """
            SELECT puzzle_num, start_image, start_prompt, goal_image
            FROM puzzles
            WHERE puzzle_num = ?
            """,
            (next_puzzle_num,),
        )
        row: sqlite3.Row | None = result.fetchone()
        if row:
            return PuzzleState(
                start_image=PuzzleImage(base64_image=row["start_image"], prompt=row["start_prompt"]),
                goal_image=PuzzleImage(base64_image=row["goal_image"], prompt=None),
                guess_images=[],
                guesses_submitted=0,
                guesses_total=DEFAULT_NUM_GUESS_IMAGES,
                puzzle_num=row["puzzle_num"],
                similarity_score=None,
                final_prompt=None,
            )
        else:
            logger.error("No puzzles found in `next_puzzle`")
            raise ValueError("No puzzles found in `next_puzzle`")

    def reset_puzzle(self, conn: sqlite3.Connection, player_id: str) -> PuzzleState:
        """Handles the database changes when the user resets a puzzle."""
        # Delete all guesses for the player
        conn.execute(
            """
            DELETE FROM guesses WHERE player_id = ?
            """,
            (player_id,),
        )

        # Get the puzzle state again
        return self.get_puzzle(conn, player_id)


def create_database() -> Database:
    """Create and return a database instance."""
    config = DBConfig(
        db_path=Path(__file__).parent / "puzzle_game.db",
        schema_path=Path(__file__).parent / "schema.sql",
    )
    return Database(config)


def reset_database() -> Database:
    """Reset the database by deleting all tables and recreating them."""
    config = DBConfig(
        db_path=Path(__file__).parent / "puzzle_game_test.db",
        schema_path=Path(__file__).parent / "schema.sql",
    )
    config.db_path.unlink(missing_ok=True)
    return Database(config)
