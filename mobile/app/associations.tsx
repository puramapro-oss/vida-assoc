import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { COLORS } from "../src/constants/brand";
import { supabase } from "../src/lib/supabase";

type Asso = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  impact_score: number;
  missions_count: number;
};

export default function Associations() {
  const [list, setList] = useState<Asso[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("associations")
      .select(
        "id,slug,name,description,category,city,country,impact_score,missions_count"
      )
      .eq("verified", true)
      .order("impact_score", { ascending: false })
      .limit(100);
    if (data) setList(data as Asso[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Associations",
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
            Annuaire vérifié
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
            {list.length} associations{"\n"}prêtes à recevoir ta lumière.
          </Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une association…"
          placeholderTextColor={COLORS.dim}
          testID="associations-search"
          style={{
            color: COLORS.ink,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: COLORS.line,
            borderRadius: 14,
            padding: 14,
            fontSize: 14,
          }}
        />

        {filtered.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Aucune association ne correspond à ta recherche.
            </Text>
          </Card>
        ) : (
          filtered.map((a) => (
            <Pressable
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: "/associations/[slug]",
                  params: { slug: a.slug },
                })
              }
              testID={`asso-${a.slug}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 16,
                      backgroundColor: "rgba(16,185,129,0.14)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>💚</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.ink,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                      numberOfLines={1}
                    >
                      {a.name}
                    </Text>
                    {a.description && (
                      <Text
                        style={{
                          color: COLORS.dim,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                        numberOfLines={2}
                      >
                        {a.description}
                      </Text>
                    )}
                    <View
                      style={{
                        marginTop: 6,
                        flexDirection: "row",
                        gap: 10,
                      }}
                    >
                      <Text style={{ color: COLORS.green, fontSize: 11 }}>
                        ✨ {a.impact_score}
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                        🌍 {a.missions_count} missions
                      </Text>
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
