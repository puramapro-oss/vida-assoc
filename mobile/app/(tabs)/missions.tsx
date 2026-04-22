import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { supabase } from "../../src/lib/supabase";
import { COLORS } from "../../src/constants/brand";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  impact_points: number;
  reward_credits: number;
  duration_min: number | null;
};

const CATS = [
  { key: "all", label: "Tout" },
  { key: "dechets", label: "Déchets" },
  { key: "arbre", label: "Nature" },
  { key: "eau", label: "Eau" },
  { key: "energie", label: "Énergie" },
  { key: "benevolat", label: "Bénévolat" },
];

export default function MissionsList() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    let q = supabase
      .schema("vida_assoc")
      .from("missions")
      .select(
        "id,title,description,category,difficulty,impact_points,reward_credits,duration_min"
      )
      .eq("is_active", true)
      .eq("is_public", true)
      .order("impact_points", { ascending: false })
      .limit(60);
    if (cat !== "all") q = q.eq("category", cat);
    const { data } = await q;
    if (data) setMissions(data as Mission[]);
  }, [cat]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = missions.filter((m) =>
    query.trim()
      ? (m.title + " " + (m.description ?? ""))
          .toLowerCase()
          .includes(query.toLowerCase())
      : true
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={{ paddingBottom: 140, gap: 12 }}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 14 }}>
            <Text
              style={{
                color: COLORS.ink,
                fontSize: 30,
                fontWeight: "800",
                paddingTop: 12,
              }}
            >
              Missions
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>
              Choisis ton geste, prouve-le, illumine.
            </Text>
            <Input
              placeholder="Rechercher une mission"
              value={query}
              onChangeText={setQuery}
              testID="missions-search"
            />
            <FlatList
              data={CATS}
              horizontal
              keyExtractor={(c) => c.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setCat(item.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor:
                      cat === item.key
                        ? "rgba(16,185,129,0.18)"
                        : "rgba(255,255,255,0.04)",
                    borderWidth: 1,
                    borderColor:
                      cat === item.key ? COLORS.green : COLORS.line,
                  }}
                >
                  <Text
                    style={{
                      color: cat === item.key ? COLORS.green : COLORS.ink,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>
              Aucune mission ne correspond. Essaie une autre catégorie.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/missions/${item.id}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
          >
            <Card padding={18}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text
                  style={{
                    color: COLORS.green,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  {item.category}
                </Text>
                <Text style={{ color: COLORS.dim, fontSize: 11 }}>·</Text>
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 11,
                    textTransform: "uppercase",
                    fontWeight: "600",
                  }}
                >
                  {item.difficulty}
                </Text>
              </View>
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 17,
                  fontWeight: "800",
                  marginTop: 6,
                }}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text
                  style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  gap: 14,
                  marginTop: 12,
                }}
              >
                <Text style={{ color: COLORS.cyan, fontSize: 12 }}>
                  ✨ +{item.impact_points} impact
                </Text>
                <Text style={{ color: COLORS.green, fontSize: 12 }}>
                  + {item.reward_credits} Sangha
                </Text>
                {item.duration_min ? (
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    ⏱ {item.duration_min}min
                  </Text>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
