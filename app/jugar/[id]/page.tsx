import { notFound } from "next/navigation";
import { getGame } from "@/app/data/games";
import GamePlayer from "@/components/GamePlayer";

export default async function GamePlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
