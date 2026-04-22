import { useEffect, useState } from "react";
import { Text, View, TextInput, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

interface TaxInfo {
  profile: string;
  label: string;
  cumul_annual_cents: number;
  message: { headline: string; body: string };
  should_escalate: boolean;
}

export default function Fiscal() {
  const { session } = useAuth();
  const [info, setInfo] = useState<TaxInfo | null>(null);
  const [siret, setSiret] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BRAND.appUrl}/api/tax/detect`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        const d = await res.json();
        if (!d.error) setInfo(d);
      } catch { /* network */ }
      setLoading(false);
    })();
  }, [session]);

  async function submitSiret() {
    if (!/^\d{14}$/.test(siret) || !session?.access_token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/tax/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ siret }),
      });
      const d = await res.json();
      if (!d.error) setInfo(d);
    } catch { /* network */ }
    setSubmitting(false);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Fiscalité", headerStyle: { backgroundColor: COLORS.bg } }} />
      <View style={{ gap: 12 }}>
        <Card>
          <Text style={{ color: COLORS.ink, fontSize: 20, fontWeight: "700" }}>Tu gagnes, Sangha déclare</Text>
          <Text style={{ color: COLORS.muted, marginTop: 6, fontSize: 13 }}>
            Sangha est tiers déclarant URSSAF. Zéro paperasse, zéro stress fiscal.
          </Text>
        </Card>

        {loading && <ActivityIndicator color={COLORS.green} />}

        {info && (
          <Card>
            <Text style={{ color: COLORS.cyan, fontSize: 12, textTransform: "uppercase" }}>{info.label}</Text>
            <Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: "600", marginTop: 6 }}>{info.message.headline}</Text>
            <Text style={{ color: COLORS.muted, marginTop: 6, fontSize: 13 }}>{info.message.body}</Text>
            {info.should_escalate && (
              <Text style={{ color: COLORS.amber, marginTop: 8, fontSize: 12 }}>
                ⚠️ Ton cumul dépasse le seuil. Déclare ton SIRET ci-dessous.
              </Text>
            )}
          </Card>
        )}

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 6 }}>Déclarer mon SIRET (optionnel)</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 10 }}>
            Pour auto-entrepreneurs et sociétés — génère Factur-X à ton nom.
          </Text>
          <TextInput
            value={siret}
            onChangeText={(v) => setSiret(v.replace(/\D/g, ""))}
            placeholder="14 chiffres"
            placeholderTextColor={COLORS.dim}
            keyboardType="numeric"
            maxLength={14}
            style={{
              backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line,
              color: COLORS.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
            }}
          />
          <Button
            onPress={submitSiret}
            disabled={submitting || !/^\d{14}$/.test(siret)}
            title={submitting ? "Vérification…" : "Valider mon SIRET"}
            style={{ marginTop: 12 }}
          />
        </Card>

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 6 }}>Cadre légal</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18 }}>
            • Stripe Connect Express (STEL, licence EMI PSD2){"\n"}
            • Sangha = tiers déclarant URSSAF{"\n"}
            • Factur-X conforme Chorus Pro (PDF/A-3 + XML){"\n"}
            • Données chiffrées, RGPD, conservation 10 ans
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
