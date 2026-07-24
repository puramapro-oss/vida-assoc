import { useCallback, useEffect, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { useAuth } from "../../src/stores/auth";
import { supabase } from "../../src/lib/supabase";
import { COLORS } from "../../src/constants/brand";

type Mission = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  impact_points: number;
  reward_credits: number;
};

export default function Home() {
  const { profile, refreshProfile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMissions = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("missions")
      .select("id,slug,title,category,difficulty,impact_points,reward_credits")
      .eq("is_active", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) queueMicrotask(() => setMissions(data as Mission[]));
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMissions(), refreshProfile()]);
    setRefreshing(false);
  }, [loadMissions, refreshProfile]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "lumière";
  const impact = profile?.impact_score ?? 0;
  const missionsDone = profile?.total_missions_completed ?? 0;
  const credits = profile?.vida_credits ?? 0;
  const level = profile?.consciousness_level ?? "Graine";

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <LinearGradient
        colors={["rgba(16,185,129,0.18)", "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
      />

      <View style={{ paddingTop: 20, gap: 4 }}>
        <Text
          style={{
            color: COLORS.green,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Namaste, {firstName}
        </Text>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 28,
            fontWeight: "800",
            lineHeight: 34,
          }}
        >
          Ton cœur lumineux{"\n"}brille à {Math.round(impact)} points.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1 }} padding={16}>
          <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "600" }}>
            NIVEAU
          </Text>
          <Text
            style={{
              color: COLORS.ink,
              fontSize: 18,
              fontWeight: "800",
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {level}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>conscience</Text>
        </Card>
        <Card style={{ flex: 1 }} padding={16}>
          <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "600" }}>
            MISSIONS
          </Text>
          <Text
            style={{
              color: COLORS.ink,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {missionsDone}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>accomplies</Text>
        </Card>
        <Card style={{ flex: 1 }} padding={16}>
          <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "600" }}>
            CRÉDITS
          </Text>
          <Text
            style={{
              color: COLORS.green,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {credits}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>Sangha</Text>
        </Card>
      </View>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 18, fontWeight: "700" }}>
          Missions du jour
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
          5 gestes concrets, validés par preuve réelle.
        </Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          {missions.length === 0 ? (
            <Text style={{ color: COLORS.dim, fontSize: 13 }}>
              Chargement des missions…
            </Text>
          ) : (
            missions.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => router.push(`/missions/${m.id}`)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.035)",
                  borderWidth: 1,
                  borderColor: COLORS.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "rgba(16,185,129,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>
                    {m.category === "dechets"
                      ? "🧹"
                      : m.category === "arbre"
                      ? "🌳"
                      : m.category === "eau"
                      ? "💧"
                      : m.category === "energie"
                      ? "⚡️"
                      : m.category === "benevolat"
                      ? "🤝"
                      : "🌱"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: COLORS.ink,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    +{m.impact_points} impact · +{m.reward_credits} Sangha
                  </Text>
                </View>
                <Text style={{ color: COLORS.green, fontSize: 20 }}>→</Text>
              </Pressable>
            ))
          )}
        </View>
        <Button
          title="Voir toutes les missions"
          variant="secondary"
          onPress={() => router.push("/(tabs)/missions")}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: "700" }}>
          💫 Rituel de ce soir
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Connecte-toi à la communauté Sangha pour un moment de gratitude partagé.
        </Text>
        <Button
          title="Rejoindre le cercle"
          variant="secondary"
          onPress={() => router.push("/rituels")}
          style={{ marginTop: 14 }}
        />
      </Card>
    </Screen>
  );
}
