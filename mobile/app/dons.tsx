import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { COLORS, BRAND } from "../src/constants/brand";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/stores/auth";

type Asso = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
};

type Interval = "one_shot" | "monthly" | "yearly";

const PRESETS = [5, 10, 25, 50];

export default function Dons() {
  const { session } = useAuth();
  const [assos, setAssos] = useState<Asso[]>([]);
  const [selected, setSelected] = useState<Asso | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [interval, setInterval] = useState<Interval>("one_shot");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("associations")
      .select("id,slug,name,description,category,city,country")
      .eq("verified", true)
      .order("impact_score", { ascending: false })
      .limit(40);
    if (data) {
      setAssos(data as Asso[]);
      if (!selected && data.length) setSelected(data[0] as Asso);
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function donate() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/donations`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token
            ? { authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          association_id: selected.id,
          amount_cents: amount * 100,
          interval,
        }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (data.url) {
        await WebBrowser.openBrowserAsync(data.url);
      }
    } catch {
      // noop
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Dons",
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
            100 % à l'association
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
            Soutiens une cause{"\n"}qui te touche.
          </Text>
        </View>

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
            Association
          </Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {assos.length === 0 ? (
              <Text style={{ color: COLORS.dim, fontSize: 13 }}>
                Chargement…
              </Text>
            ) : (
              assos.slice(0, 8).map((a) => {
                const active = selected?.id === a.id;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setSelected(a)}
                    testID={`donate-asso-${a.slug}`}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active
                        ? "rgba(16,185,129,0.45)"
                        : COLORS.line,
                      backgroundColor: active
                        ? "rgba(16,185,129,0.10)"
                        : "rgba(255,255,255,0.035)",
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
                      {a.name}
                    </Text>
                    {(a.city || a.country) && (
                      <Text
                        style={{
                          color: COLORS.dim,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {[a.city, a.country].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
          <Pressable
            onPress={() => router.push("/associations")}
            style={({ pressed }) => ({
              marginTop: 14,
              opacity: pressed ? 0.7 : 1,
            })}
            testID="donate-see-all"
          >
            <Text
              style={{
                color: COLORS.green,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              Voir toutes les associations →
            </Text>
          </Pressable>
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
            Montant
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            {PRESETS.map((p) => {
              const active = amount === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setAmount(p)}
                  testID={`donate-amount-${p}`}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    paddingVertical: 12,
                    borderRadius: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: active
                      ? "rgba(16,185,129,0.45)"
                      : COLORS.line,
                    backgroundColor: active
                      ? "rgba(16,185,129,0.14)"
                      : "rgba(255,255,255,0.035)",
                  }}
                >
                  <Text
                    style={{
                      color: active ? COLORS.green : COLORS.ink,
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    {p} €
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginTop: 18,
            }}
          >
            Fréquence
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 12,
            }}
          >
            {(
              [
                { id: "one_shot", label: "Ponctuel" },
                { id: "monthly", label: "Mensuel" },
                { id: "yearly", label: "Annuel" },
              ] as { id: Interval; label: string }[]
            ).map((opt) => {
              const active = interval === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setInterval(opt.id)}
                  testID={`donate-interval-${opt.id}`}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: "center",
                    borderRadius: 12,
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
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            title={`Donner ${amount} €${
              interval === "monthly"
                ? " / mois"
                : interval === "yearly"
                ? " / an"
                : ""
            }`}
            onPress={donate}
            loading={submitting}
            disabled={!selected}
            style={{ marginTop: 18 }}
            testID="donate-submit"
          />
          <Text
            style={{
              color: COLORS.dim,
              fontSize: 11,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Paiement sécurisé via Stripe. 100 % reversé.
          </Text>
        </Card>

        <Pressable
          onPress={() => Linking.openURL(`${BRAND.appUrl}/aide`)}
          testID="donate-help"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Comment fonctionne le don Sangha ? →
          </Text>
        </Pressable>
      </Screen>
    </>
  );
}
