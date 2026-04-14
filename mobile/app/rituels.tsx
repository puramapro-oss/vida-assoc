import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

type Ritual = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  duration_min: number | null;
  participants_count: number | null;
  status: string;
};

export default function Rituels() {
  const { session } = useAuth();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [joining, setJoining] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("rituals")
      .select("id,title,description,starts_at,duration_min,participants_count,status")
      .in("status", ["upcoming", "live"])
      .order("starts_at", { ascending: true })
      .limit(20);
    if (data) setRituals(data as Ritual[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function join(id: string) {
    if (!session) return;
    setJoining(id);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/rituals/join`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ritual_id: id }),
      });
      if (!res.ok) throw new Error("Impossible de rejoindre");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Tu y es ✨", "On se retrouve dans le cercle.");
      await load();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Oups", e instanceof Error ? e.message : "Réessaie plus tard.");
    } finally {
      setJoining(null);
    }
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Rituels",
          headerTintColor: COLORS.ink,
        }}
      />
      <View style={{ paddingTop: 40 }}>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 30,
            fontWeight: "800",
          }}
        >
          Cercles de lumière
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Rejoins la communauté pour un moment partagé.
        </Text>
      </View>

      {rituals.length === 0 ? (
        <Card>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            Aucun rituel à venir. Reviens demain 🌙
          </Text>
        </Card>
      ) : (
        rituals.map((r) => (
          <Card key={r.id}>
            <Text
              style={{
                color: r.status === "live" ? COLORS.amber : COLORS.green,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              {r.status === "live" ? "En direct" : "À venir"}
            </Text>
            <Text
              style={{
                color: COLORS.ink,
                fontSize: 18,
                fontWeight: "800",
                marginTop: 6,
              }}
            >
              {r.title}
            </Text>
            {r.description ? (
              <Text
                style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}
                numberOfLines={2}
              >
                {r.description}
              </Text>
            ) : null}
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 8 }}>
              {new Date(r.starts_at).toLocaleString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {r.duration_min ?? 15} min
              {" · "}
              {r.participants_count ?? 0} participants
            </Text>
            <Pressable
              onPress={() => join(r.id)}
              disabled={joining === r.id}
              style={({ pressed }) => ({
                marginTop: 14,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: COLORS.green,
                alignItems: "center",
                opacity: joining === r.id ? 0.6 : pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#041612", fontWeight: "700" }}>
                {joining === r.id ? "…" : "Je rejoins"}
              </Text>
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
}
