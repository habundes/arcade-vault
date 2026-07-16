import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { GameCategory, GameColor, ScoreRow } from "@/app/data/types";

type Client = SupabaseClient<Database>;

export type GameRow = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: GameColor;
};

export type GameWithStats = GameRow & { best: number; plays: number };

function toGameRow(row: Database["public"]["Tables"]["games"]["Row"]): GameRow {
  return {
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long_desc,
    cat: row.cat as GameCategory,
    cover: row.cover,
    color: row.color as GameColor,
  };
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export async function getGames(client: Client): Promise<GameRow[]> {
  const { data, error } = await client.from("games").select("*");
  if (error) throw error;
  return (data ?? []).map(toGameRow);
}

export async function getGame(
  client: Client,
  id: string,
): Promise<GameRow | null> {
  const { data, error } = await client
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toGameRow(data) : null;
}

export async function getGameWithStats(
  client: Client,
  id: string,
): Promise<GameWithStats | null> {
  const game = await getGame(client, id);
  if (!game) return null;

  const [{ data: bestRow, error: bestError }, { count, error: countError }] =
    await Promise.all([
      client
        .from("scores")
        .select("score")
        .eq("game_id", id)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("scores")
        .select("*", { count: "exact", head: true })
        .eq("game_id", id),
    ]);

  if (bestError) throw bestError;
  if (countError) throw countError;

  return {
    ...game,
    best: bestRow?.score ?? 0,
    plays: count ?? 0,
  };
}

export async function getTopScores(
  client: Client,
  gameId: string,
  limit: number,
): Promise<ScoreRow[]> {
  const { data, error } = await client
    .from("scores")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row, index) => ({
    rank: index + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.played_at),
  }));
}

export async function insertScore(
  client: Client,
  gameId: string,
  playerName: string,
  score: number,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName, score, user_id: userId });
  if (error) throw error;
}
