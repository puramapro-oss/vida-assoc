import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { COLORS } from "../../src/constants/brand";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/stores/auth";

type Module = {
  id?: string;
  title?: string;
  duration?: number;
  content_url?: string;
};

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
  modules: Module[] | null;
};

export default function FormationDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [percent, setPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    const { data } = await supabase
      .schema("vida_assoc")
      .from("formations")
      .select(
        "id,slug,title,description,type,target_audience,duration_minutes,is_free,required_plan,modules"
      )
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return;
    const f = data as Formation;
    setFormation(f);
    if (user) {
      const { data: progress } = await supabase
        .schema("vida_assoc")
        .from("formation_progress")
        .select("percent_complete")
        .eq("user_id", user.id)
        .eq("formation_id", f.id)
        .maybeSingle();
      if (progress)
        setPercent((progress as { percent_complete: number }).percent_complete);
    }
  }, [slug, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function saveProgress(value: number) {
    if (!formation || !user || saving) return;
    setSaving(true);
    setPercent(value);
    try {
      await supabase
        .schema("vida_assoc")
        .from("formation_progress")
        .upsert(
          {
            user_id: user.id,
            formation_id: formation.id,
            percent_complete: value,
            completed_at: value >= 100 ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,formation_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  const planRank: Record<string, number> = { free: 0, one: 1, premium: 2 };
  const userPlan = profile?.plan ?? "free";
  const requiredPlan = formation?.required_plan ?? "free";
  const planOk =
    formation?.is_free || planRank[userPlan] >= planRank[requiredPlan];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: formation?.title ?? "Formation",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        {!formation ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Chargement de la formation…
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
                {formation.type} · {formation.target_audience}
              </Text>
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 22,
                  fontWeight: "800",
                  marginTop: 6,
                  lineHeight: 28,
                }}
              >
                {formation.title}
              </Text>
              {formation.description && (
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 14,
                    lineHeight: 21,
                    marginTop: 12,
                  }}
                >
                  {formation.description}
                </Text>
              )}

              <View
                style={{
                  marginTop: 18,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    backgroundColor: COLORS.green,
                  }}
                />
              </View>
              <Text
                style={{ color: COLORS.muted, fontSize: 12, marginTop: 6 }}
              >
                Progression : {percent}%
              </Text>

              {!planOk ? (
                <Text
                  style={{
                    marginTop: 14,
                    color: COLORS.amber,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Cette formation nécessite le plan {requiredPlan}.
                </Text>
              ) : (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <Button
                    title="+25 %"
                    variant="secondary"
                    size="sm"
                    onPress={() => saveProgress(Math.min(100, percent + 25))}
                    disabled={saving || percent >= 100}
                    style={{ flex: 1 }}
                    testID="formation-progress-25"
                  />
                  <Button
                    title="Terminer"
                    size="sm"
                    onPress={() => saveProgress(100)}
                    disabled={saving || percent >= 100}
                    style={{ flex: 1 }}
                    testID="formation-progress-100"
                  />
                </View>
              )}
            </Card>

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
                Modules
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                {(formation.modules ?? []).length === 0 ? (
                  <Text style={{ color: COLORS.dim, fontSize: 13 }}>
                    Cette formation est délivrée d&apos;un seul tenant.
                  </Text>
                ) : (
                  (formation.modules ?? []).map((m, i) => (
                    <View
                      key={`${m.id ?? i}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: "rgba(255,255,255,0.035)",
                        borderWidth: 1,
                        borderColor: COLORS.line,
                      }}
                    >
                      <Text
                        style={{
                          width: 24,
                          color: COLORS.green,
                          fontWeight: "800",
                        }}
                      >
                        {i + 1}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: COLORS.ink, fontWeight: "700" }}
                          numberOfLines={2}
                        >
                          {m.title ?? `Module ${i + 1}`}
                        </Text>
                        {m.duration ? (
                          <Text style={{ color: COLORS.dim, fontSize: 12 }}>
                            {m.duration} min
                          </Text>
                        ) : null}
                      </View>
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
