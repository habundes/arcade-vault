import { createClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/supabase/queries";
import GamesGrid from "@/components/GamesGrid";

export default async function Home() {
  const supabase = await createClient();
  const games = await getGames(supabase);

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <GamesGrid games={games} />
    </div>
  );
}
