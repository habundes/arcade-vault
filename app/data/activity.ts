import { seededScores } from "./players";
import { GAMES } from "./games";
import type { GameColor } from "./types";

export interface RecentScore {
  player: string; // de PLAYERS
  game: string; // title de GAMES
  score: number; // de seededScores
  time: string; // etiqueta fija: "hace 2 min", "hace 5 min", …
  color: GameColor; // g.color del juego, para el neón
}

export interface TopPlayer {
  rank: number; // 1..5
  player: string;
  score: number;
}

const TICKER_TIME_LABELS = [
  "hace 2 min",
  "hace 5 min",
  "hace 8 min",
  "hace 12 min",
  "hace 18 min",
  "hace 24 min",
  "hace 31 min",
];

export const RECENT_SCORES: RecentScore[] = seededScores(11, 7).map((row, i) => {
  const game = GAMES[i % GAMES.length];
  return {
    player: row.name,
    game: game.title,
    score: row.score,
    time: TICKER_TIME_LABELS[i],
    color: game.color,
  };
});

export const TOP_TODAY: TopPlayer[] = seededScores(29, 5).map((row) => ({
  rank: row.rank,
  player: row.name,
  score: row.score,
}));
