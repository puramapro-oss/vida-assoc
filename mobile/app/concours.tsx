import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { COLORS } from "../src/constants/brand";
import { supabase } from "../src/lib/supabase";

type Contest = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  total_pool_cents: number;
  start_date: string;
  end_date: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  image_url: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
  special: "Spécial",
};

function formatPool(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
  })} €`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function Concours() {
  const [live, setLive] = useState<Contest[]>([]);
  const [upcoming, setUpcoming] = useState<Contest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("contests")
      .select(
        "id,title,description,type,total_pool_cents,start_date,end_date,status,image_url"
      )
      .in("status", ["live", "upcoming"])
      .order("end_date", { ascending: true })
      .limit(30);
    if (data) {
      const c = data as Contest[];
      setLive(c.filter((x) => x.status === "live"));
      setUpcoming(c.filter((x) => x.status === "upcoming"));
    }
  }, []);

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
          title: "Concours",
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
            10 gagnants par concours
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
            Plus tu agis,{"\n"}plus tu rayonnes.
          </Text>
        </View>

        {live.length > 0 && (
          <Card padding={0}>
            <View
              style={{
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.line,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: COLORS.green,
                }}
              />
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                EN COURS
              </Text>
            </View>
            {live.map((c, i) => (
              <View
                key={c.id}
                style={{
                  padding: 20,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: COLORS.line,
                }}
              >
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {TYPE_LABEL[c.type] ?? c.type}
                </Text>
                <Text
                  style={{
                    color: COLORS.ink,
                    fontSize: 18,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  {c.title}
                </Text>
                {c.description && (
                  <Text
                    style={{
                      color: COLORS.muted,
                      fontSize: 13,
                      marginTop: 6,
                      lineHeight: 19,
                    }}
                  >
                    {c.description}
                  </Text>
                )}
                <View
                  style={{
                    marginTop: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ color: COLORS.dim, fontSize: 11 }}>
                      Cagnotte
                    </Text>
                    <Text
                      style={{
                        color: COLORS.green,
                        fontSize: 22,
                        fontWeight: "800",
                      }}
                    >
                      {formatPool(c.total_pool_cents)}
                    </Text>
                  </View>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    Jusqu'au {formatDate(c.end_date)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

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
            À venir
          </Text>
          <View style={{ gap: 12, marginTop: 14 }}>
            {upcoming.length === 0 ? (
              <Text style={{ color: COLORS.dim, fontSize: 13 }}>
                Aucun concours programmé pour l'instant. Reviens vite ✨
              </Text>
            ) : (
              upcoming.map((c) => (
                <View
                  key={c.id}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.035)",
                    borderWidth: 1,
                    borderColor: COLORS.line,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.muted,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {TYPE_LABEL[c.type] ?? c.type}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.ink,
                      fontSize: 15,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {c.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: COLORS.green, fontSize: 13 }}>
                      {formatPool(c.total_pool_cents)}
                    </Text>
                    <Text style={{ color: COLORS.dim, fontSize: 12 }}>
                      Démarre {formatDate(c.start_date)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>

        <Card>
          <Text style={{ color: COLORS.ink, fontSize: 14, fontWeight: "700" }}>
            Comment gagner des tickets ?
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {[
              "Réaliser une mission validée → +1 ticket",
              "Inviter une âme via parrainage → +1 ticket",
              "Participer à un rituel collectif → +1 ticket",
              "Partager une victoire en communauté → +1 ticket",
            ].map((line, i) => (
              <Text
                key={i}
                style={{ color: COLORS.muted, fontSize: 13, lineHeight: 19 }}
              >
                • {line}
              </Text>
            ))}
          </View>
        </Card>
      </Screen>
    </>
  );
}
