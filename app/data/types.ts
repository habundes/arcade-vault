export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export const CATEGORIES = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
] as const;

export interface Game {
  id: string; // slug, ej. "bloque-buster"
  title: string;
  short: string; // descripción de tarjeta
  long: string; // descripción de detalle
  cat: GameCategory;
  cover: string; // clase CSS de portada, ej. "cover-bricks"
  color: GameColor; // color del botón JUGAR
  best: number; // mejor puntuación global
  plays: string; // partidas, ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/2026"
}

export interface User {
  id: string;
  name: string; // iniciales/alias en mayúsculas, máx 10
}
