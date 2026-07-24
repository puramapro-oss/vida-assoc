import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { COLORS, BRAND } from "../src/constants/brand";
import { useAuth } from "../src/stores/auth";

type Plan = "one" | "premium";
type Interval = "monthly" | "yearly";

const PLANS: {
  id: Plan;
  label: string;
  emoji: string;
  monthly: number;
  yearly: number;
  perks: string[];
}[] = [
  {
    id: "one",
    label: "Sangha One",
    emoji: "🌱",
    monthly: 3,
    yearly: 25.2,
    perks: [
      "Toutes les missions essentielles",
      "Wallet & retraits IBAN",
      "Communauté + rituels live",
    ],
  },
  {
    id: "premium",
    label: "Sangha Premium",
    emoji: "✨",
    monthly: 6.9,
    yearly: 57.98,
    perks: [
      "Tout Sangha One",
      "Formations Premium illimitées",
      "Accès anticipé concours spéciaux",
      "Multiplicateur d'impact ×1.5",
    ],
  },
];

function priceText(amount: number) {
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export default function Upgrade() {
  const { session } = useAuth();
  const [plan, setPlan] = useState<Plan>("premium");
  const [interval, setInterval] = useState<Interval>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token
            ? { authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ plan, interval }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Stripe est indisponible. Réessaie.");
        return;
      }
      await WebBrowser.openBrowserAsync(data.url);
    } catch {
      setError("Connexion impossible avec Stripe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Passer à Sangha Premium",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen>
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
            14 jours offerts
          </Text>
          <Text
            style={{
              color: COLORS.ink,
              fontSize: 28,
              fontWeight: "800",
              marginTop: 4,
              lineHeight: 34,
            }}
          >
            Choisis ton{"\n"}rythme d&apos;engagement.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["monthly", "yearly"] as Interval[]).map((opt) => {
            const active = interval === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setInterval(opt)}
                testID={`upgrade-interval-${opt}`}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderRadius: 14,
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
                    fontSize: 13,
                  }}
                >
                  {opt === "monthly" ? "Mensuel" : "Annuel −30 %"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {PLANS.map((p) => {
          const active = plan === p.id;
          const price = interval === "monthly" ? p.monthly : p.yearly;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPlan(p.id)}
              testID={`upgrade-plan-${p.id}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card
                style={{
                  borderColor: active
                    ? "rgba(16,185,129,0.55)"
                    : COLORS.line,
                  backgroundColor: active
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(255,255,255,0.035)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.ink,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      {p.label}
                    </Text>
                    <Text style={{ color: COLORS.dim, fontSize: 12 }}>
                      {interval === "monthly"
                        ? "Sans engagement"
                        : "1 mois offert"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: COLORS.green,
                        fontSize: 22,
                        fontWeight: "800",
                      }}
                    >
                      {priceText(price)} €
                    </Text>
                    <Text style={{ color: COLORS.dim, fontSize: 11 }}>
                      / {interval === "monthly" ? "mois" : "an"}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 14, gap: 8 }}>
                  {p.perks.map((perk) => (
                    <Text
                      key={perk}
                      style={{ color: COLORS.muted, fontSize: 13, lineHeight: 19 }}
                    >
                      • {perk}
                    </Text>
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {error && (
          <Text style={{ color: COLORS.amber, fontSize: 13 }}>{error}</Text>
        )}

        <Button
          title="Démarrer mon essai gratuit"
          loading={loading}
          onPress={checkout}
          testID="upgrade-checkout"
        />
        <Text
          style={{
            color: COLORS.dim,
            fontSize: 11,
            textAlign: "center",
          }}
        >
          Paiement sécurisé Stripe · Annulation à tout instant
        </Text>
      </Screen>
    </>
  );
}
