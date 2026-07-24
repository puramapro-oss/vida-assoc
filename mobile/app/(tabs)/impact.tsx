import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/stores/auth";
import { COLORS } from "../../src/constants/brand";

type GlobalStats = {
  total_co2_kg: number;
  total_waste_kg: number;
  total_water_l: number;
  total_trees: number;
  total_people_helped: number;
  total_hours_volunteered: number;
};

const EMPTY_STATS: GlobalStats = {
  total_co2_kg: 0,
  total_waste_kg: 0,
  total_water_l: 0,
  total_trees: 0,
  total_people_helped: 0,
  total_hours_volunteered: 0,
};

export default function Impact() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<GlobalStats>(EMPTY_STATS);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("impact_global")
      .select(
        "total_co2_kg,total_waste_kg,total_water_l,total_trees,total_people_helped,total_hours_volunteered"
      )
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();
    queueMicrotask(() => setStats((data as GlobalStats | null) ?? EMPTY_STATS));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const level = profile?.consciousness_level ?? "Graine";
  const impact = Math.round(profile?.impact_score ?? 0);
  const missionsDone = profile?.total_missions_completed ?? 0;

  const metrics = [
    { icon: "🌬️", label: "CO₂ évité", value: `${stats.total_co2_kg} kg` },
    {
      icon: "♻️",
      label: "Déchets collectés",
      value: `${stats.total_waste_kg} kg`,
    },
    { icon: "💧", label: "Eau préservée", value: `${stats.total_water_l} L` },
    { icon: "🌳", label: "Arbres plantés", value: `${stats.total_trees}` },
    {
      icon: "🤝",
      label: "Personnes aidées",
      value: `${stats.total_people_helped}`,
    },
    {
      icon: "⏳",
      label: "Heures bénévoles",
      value: `${stats.total_hours_volunteered} h`,
    },
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ paddingTop: 20, gap: 6 }}>
        <Text
          style={{
            color: COLORS.green,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Ton impact
        </Text>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 32,
            fontWeight: "800",
            lineHeight: 36,
          }}
        >
          {level}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14 }}>
          {impact} pts · {missionsDone} missions accomplies
        </Text>
      </View>

      <Card>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          🌍 La communauté Sangha
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
          Chaque action, multipliée par tous.
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 16,
          }}
        >
          {metrics.map((m) => (
            <View
              key={m.label}
              style={{
                width: "48%",
                padding: 14,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.035)",
                borderWidth: 1,
                borderColor: COLORS.line,
              }}
            >
              <Text style={{ fontSize: 22 }}>{m.icon}</Text>
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 20,
                  fontWeight: "800",
                  marginTop: 6,
                }}
              >
                {m.value}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: "700" }}>
          Fil de Vie
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Chaque mission validée écrit une ligne dans ton histoire. Reviens
          chaque soir : on célèbre les gestes, pas les chiffres.
        </Text>
      </Card>
    </Screen>
  );
}
