import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

interface Game {
  slug: string;
  name: string;
  description: string;
  ticket_cost: number;
  period: string;
}

export default function Karma() {
  const { session } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ won: boolean; points: number; cents: number } | null>(null);

  async function load() {
    queueMicrotask(() => setLoading(true));
    try {
      const res = await fetch(`${BRAND.appUrl}/api/karma/play`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const d = await res.json();
      if (!d.error) {
        queueMicrotask(() => {
          setGames(d.games ?? []);
          setTickets(d.tickets ?? 0);
        });
      }
    } catch { /* network */ }
    queueMicrotask(() => setLoading(false));
  }

  useEffect(() => { load(); }, [session]);

  async function play(slug: string) {
    if (!session?.access_token) return;
    setPlaying(slug);
    setLastResult(null);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/karma/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ game_slug: slug }),
      });
      const d = await res.json();
      if (!d.error) {
        setLastResult({
          won: d.play.outcome === "won",
          points: d.play.prize_points ?? 0,
          cents: d.play.prize_cents ?? 0,
        });
        await load();
      }
    } catch { /* network */ }
    setPlaying(null);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "KARMA", headerStyle: { backgroundColor: COLORS.bg } }} />
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        <Card>
          <Text style={{ color: COLORS.amber, fontSize: 12, textTransform: "uppercase" }}>6 jeux solidaires</Text>
          <Text style={{ color: COLORS.ink, fontSize: 20, fontWeight: "700", marginTop: 6 }}>KARMA</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
            Gagne des tickets en agissant — jamais en payant. Hors champ ANJ.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
            <View style={{ backgroundColor: "rgba(245,158,11,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ color: COLORS.amber, fontWeight: "700" }}>🎟️ {tickets} ticket{tickets > 1 ? "s" : ""}</Text>
            </View>
          </View>
        </Card>

        {lastResult && (
          <Card>
            <Text style={{ color: lastResult.won ? COLORS.green : COLORS.muted, fontWeight: "600", fontSize: 16 }}>
              {lastResult.won ? "🎉 Gagné !" : "🙏 Merci d'avoir joué."}
            </Text>
            {lastResult.points > 0 && <Text style={{ color: COLORS.amber, marginTop: 6 }}>+{lastResult.points} points</Text>}
            {lastResult.cents > 0 && <Text style={{ color: COLORS.green, marginTop: 4 }}>+{(lastResult.cents / 100).toFixed(2)}€</Text>}
          </Card>
        )}

        {loading && <ActivityIndicator color={COLORS.amber} />}

        {games.map((g) => (
          <Card key={g.slug}>
            <Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: "600" }}>{g.name}</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4, textTransform: "capitalize" }}>
              {g.period === "daily" ? "Quotidien" : g.period === "weekly" ? "Hebdo" : g.period === "monthly" ? "Mensuel" : "Saisonnier"} · {g.ticket_cost} ticket{g.ticket_cost > 1 ? "s" : ""}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 8 }}>{g.description}</Text>
            <Button
              onPress={() => play(g.slug)}
              disabled={playing === g.slug || tickets < g.ticket_cost}
              title={playing === g.slug ? "Tirage…" : "Jouer"}
              style={{ marginTop: 12 }}
            />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
