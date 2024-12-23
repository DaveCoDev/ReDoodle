-- schema.sql
CREATE TABLE IF NOT EXISTS guesses (
    player_id TEXT NOT NULL,
    puzzle_num INTEGER NOT NULL,
    guess_num INTEGER NOT NULL,
    image BLOB NOT NULL,
    guess_prompt TEXT NOT NULL,
    PRIMARY KEY (player_id, guess_num),
    FOREIGN KEY (player_id) REFERENCES user_state(player_id)
);

CREATE TABLE IF NOT EXISTS puzzles (
    puzzle_num INTEGER PRIMARY KEY,
    start_image BLOB NOT NULL,
    goal_image BLOB NOT NULL,
    start_prompt TEXT NOT NULL,
    goal_prompt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_state (
    player_id TEXT,
    finished_puzzle INTEGER NOT NULL,
    PRIMARY KEY (player_id, finished_puzzle),
    FOREIGN KEY (finished_puzzle) REFERENCES puzzles(puzzle_num)
);

CREATE INDEX IF NOT EXISTS idx_guesses_player ON guesses(player_id);
