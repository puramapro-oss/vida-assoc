import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { COLORS } from "../src/constants/brand";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { supabase } from "../src/lib/supabase";

type Formation = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  target_audience: string;
  duration_minutes: number | null;
  is_free: boolean;
  required_plan: string | null;
  thumbnail_url: string | null;
};

const TYPE_EMOJI: Record<string, string> = {
  video: "🎬",
  livre: "📖",
  papier: "📄",
  audio: "🎧",
  interactive: "🪐",
};

const AUDIENCE_LABEL: Record<string, string> = {
  adulte: "Adulte",
  enfant: "Enfant",
  handicap_visuel: "Handicap visuel",
  handicap_auditif: "Handicap auditif",
  handicap_moteur: "Handicap moteur",
  senior: "Senior",
  tous: "Tous",
};

export default function Formations() {
  const [list, setList] = useState<Formation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("tous");

  const load = useCallback(async () => {
    let q = supabase
      .schema("vida_assoc")
      .from("formations")
      .select(
        "id,slug,title,description,type,target_audience,duration_minutes,is_free,required_plan,thumbnail_url"
      )
      .order("created_at", { ascending: false })
      .limit(60);
    if (filter !== "tous") q = q.eq("target_audience", filter);
    const { data } = await q;
    if (data) queueMicrotask(() => setList(data as Formation[]));
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Formations",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <View>
          <Text
            style={{
              color: COLORS.green,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Apprendre · Élever
          </Text>
          <Text
            style={{
              color: COLORS.ink,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 4,
              lineHeight: 32,
            }}
          >
            Formations Sangha{"\n"}pour grandir en conscience.
          </Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.entries(AUDIENCE_LABEL)}
          keyExtractor={([k]) => k}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          renderItem={({ item: [k, label] }) => {
            const active = filter === k;
            return (
              <Pressable
                onPress={() => setFilter(k)}
                testID={`formation-filter-${k}`}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active
                    ? "rgba(16,185,129,0.45)"
                    : COLORS.line,
                  backgroundColor: active
                    ? "rgba(16,185,129,0.14)"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    color: active ? COLORS.green : COLORS.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          }}
        />

        {list.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Aucune formation pour ce filtre. Essaie un autre public.
            </Text>
          </Card>
        ) : (
          list.map((f) => (
            <Pressable
              key={f.id}
              onPress={() =>
                router.push({
                  pathname: "/formations/[slug]",
                  params: { slug: f.slug },
                })
              }
              testID={`formation-${f.slug}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      backgroundColor: "rgba(16,185,129,0.14)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>
                      {TYPE_EMOJI[f.type] ?? "🌿"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.muted,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {AUDIENCE_LABEL[f.target_audience] ?? f.target_audience}
                      {f.duration_minutes ? ` · ${f.duration_minutes} min` : ""}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.ink,
                        fontSize: 15,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                      numberOfLines={2}
                    >
                      {f.title}
                    </Text>
                    {f.description && (
                      <Text
                        style={{
                          color: COLORS.dim,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                        numberOfLines={2}
                      >
                        {f.description}
                      </Text>
                    )}
                    <View
                      style={{
                        marginTop: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {f.is_free ? (
                        <Text
                          style={{
                            color: COLORS.green,
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          Offert
                        </Text>
                      ) : (
                        <Text
                          style={{
                            color: COLORS.amber,
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          Plan {f.required_plan ?? "premium"}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={{ color: COLORS.green, fontSize: 22 }}>→</Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </>
  );
}
