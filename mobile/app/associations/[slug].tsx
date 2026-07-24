import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { COLORS } from "../../src/constants/brand";
import { supabase } from "../../src/lib/supabase";

type Asso = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  mission_statement: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  impact_score: number;
  missions_count: number;
  donations_received_cents: number;
  volunteers_count: number;
  website: string | null;
};

type Mission = {
  id: string;
  slug: string;
  title: string;
  category: string;
  reward_credits: number;
  impact_points: number;
};

export default function AssociationDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [asso, setAsso] = useState<Asso | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    const { data } = await supabase
      .schema("vida_assoc")
      .from("associations")
      .select(
        "id,slug,name,description,mission_statement,category,city,country,region,impact_score,missions_count,donations_received_cents,volunteers_count,website"
      )
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return;
    const a = data as Asso;
    queueMicrotask(() => setAsso(a));
    const { data: m } = await supabase
      .schema("vida_assoc")
      .from("missions")
      .select("id,slug,title,category,reward_credits,impact_points")
      .eq("association_id", a.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (m) queueMicrotask(() => setMissions(m as Mission[]));
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    queueMicrotask(() => setRefreshing(true));
    await load();
    queueMicrotask(() => setRefreshing(false));
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: asso?.name ?? "Association",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        {!asso ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Chargement…
            </Text>
          </Card>
        ) : (
          <>
            <Card>
              <Text
                style={{
                  color: COLORS.green,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                }}
              >
                {asso.category ?? "Association"}
              </Text>
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 24,
                  fontWeight: "800",
                  marginTop: 6,
                  lineHeight: 30,
                }}
              >
                {asso.name}
              </Text>
              {(asso.city || asso.region || asso.country) && (
                <Text
                  style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}
                >
                  {[asso.city, asso.region, asso.country]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              )}
              {asso.mission_statement && (
                <Text
                  style={{
                    color: COLORS.ink,
                    fontSize: 14,
                    lineHeight: 21,
                    marginTop: 16,
                    fontStyle: "italic",
                  }}
                >
                  « {asso.mission_statement} »
                </Text>
              )}
              {asso.description && (
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 13,
                    lineHeight: 20,
                    marginTop: 12,
                  }}
                >
                  {asso.description}
                </Text>
              )}
            </Card>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Card style={{ flex: 1 }} padding={14}>
                <Text style={{ color: COLORS.dim, fontSize: 11 }}>Impact</Text>
                <Text
                  style={{
                    color: COLORS.green,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {asso.impact_score}
                </Text>
              </Card>
              <Card style={{ flex: 1 }} padding={14}>
                <Text style={{ color: COLORS.dim, fontSize: 11 }}>Missions</Text>
                <Text
                  style={{
                    color: COLORS.ink,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {asso.missions_count}
                </Text>
              </Card>
              <Card style={{ flex: 1 }} padding={14}>
                <Text style={{ color: COLORS.dim, fontSize: 11 }}>Reçu</Text>
                <Text
                  style={{
                    color: COLORS.ink,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                  numberOfLines={1}
                >
                  {(asso.donations_received_cents / 100).toLocaleString(
                    "fr-FR",
                    { maximumFractionDigits: 0 }
                  )}{" "}
                  €
                </Text>
              </Card>
            </View>

            <Button
              title="Soutenir cette association"
              onPress={() => router.push("/dons")}
              testID="asso-support"
            />

            <Card>
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Missions liées
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                {missions.length === 0 ? (
                  <Text style={{ color: COLORS.dim, fontSize: 13 }}>
                    Aucune mission active.
                  </Text>
                ) : (
                  missions.map((m) => (
                    <View
                      key={m.id}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: "rgba(255,255,255,0.035)",
                        borderWidth: 1,
                        borderColor: COLORS.line,
                      }}
                    >
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
                      <Text
                        style={{
                          color: COLORS.muted,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        +{m.impact_points} impact · +{m.reward_credits} Sangha
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}
