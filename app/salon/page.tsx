import { createClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/supabase/queries";
import HallOfFame from "@/components/HallOfFame";

export default async function HallOfFamePage() {
  const supabase = await createClient();
  const games = await getGames(supabase);

  return <HallOfFame games={games} />;
}
