import { useEffect, useState } from "react";
import { Text, View, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

type CaseType = "etudiant_rural" | "handicap" | "mere_isolee" | "senior" | "precarite" | "jeune_majeur" | "famille_nombreuse";

const LABELS: Record<CaseType, string> = {
  etudiant_rural: "Étudiant·e en zone rurale",
  handicap: "Situation de handicap",
  mere_isolee: "Parent isolé·e",
  senior: "Senior en précarité",
  precarite: "Précarité financière",
  jeune_majeur: "Jeune majeur·e",
  famille_nombreuse: "Famille nombreuse",
};

interface BourseCase {
  id: string;
  case_type: string;
  amount_requested_cents: number;
  status: string;
  created_at: string;
}

export default function Bourse() {
  const { session } = useAuth();
  const [cases, setCases] = useState<BourseCase[]>([]);
  const [selectedType, setSelectedType] = useState<CaseType>("precarite");
  const [amount, setAmount] = useState("50");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/bourse/apply`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const d = await res.json();
      if (!d.error) setCases(d.cases ?? []);
    } catch { /* network */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function submit() {
    if (reason.length < 50 || !session?.access_token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/bourse/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          case_type: selectedType,
          amount_requested_cents: Math.round(parseFloat(amount) * 100),
          reason,
          proof_urls: [],
        }),
      });
      const d = await res.json();
      if (!d.error) {
        setSent(true);
        setReason("");
        await load();
        setTimeout(() => setSent(false), 5000);
      }
    } catch { /* network */ }
    setSubmitting(false);
  }

  const hasPending = cases.some((c) => c.status === "pending" || c.status === "reviewing");

  return (
    <Screen>
      <Stack.Screen options={{ title: "Bourse d'inclusion", headerStyle: { backgroundColor: COLORS.bg } }} />
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        <Card>
          <Text style={{ color: COLORS.rose, fontSize: 12, textTransform: "uppercase" }}>Circuit Association PURAMA</Text>
          <Text style={{ color: COLORS.ink, fontSize: 20, fontWeight: "700", marginTop: 6 }}>Bourse d&apos;inclusion</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
            Financée par subventions + mécénat de l&apos;Association PURAMA. Réponse sous 7 jours.
          </Text>
        </Card>

        {sent && (
          <Card>
            <Text style={{ color: COLORS.green }}>✓ Dossier reçu. Notification sous 7 jours.</Text>
          </Card>
        )}

        {!hasPending && (
          <Card>
            <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 8 }}>Déposer un dossier</Text>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {(Object.keys(LABELS) as CaseType[]).map((k) => (
                <View key={k} style={{
                  paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, borderRadius: 100,
                  borderWidth: 1, borderColor: selectedType === k ? COLORS.rose : COLORS.line,
                  backgroundColor: selectedType === k ? "rgba(244,114,182,0.15)" : "transparent",
                }}>
                  <Text
                    onPress={() => setSelectedType(k)}
                    style={{ color: selectedType === k ? COLORS.rose : COLORS.muted, fontSize: 11 }}
                  >
                    {LABELS[k]}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Montant (€)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{
                backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line,
                color: COLORS.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
              }}
            />
            <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Ta situation ({reason.length}/2000, min 50)</Text>
            <TextInput
              value={reason}
              onChangeText={(v) => setReason(v.slice(0, 2000))}
              multiline
              numberOfLines={5}
              placeholder="Décris ta situation…"
              placeholderTextColor={COLORS.dim}
              style={{
                backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line,
                color: COLORS.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                minHeight: 100, textAlignVertical: "top",
              }}
            />
            <Button
              onPress={submit}
              disabled={submitting || reason.length < 50}
              title={submitting ? "Envoi…" : "Soumettre mon dossier"}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {hasPending && (
          <Card>
            <Text style={{ color: COLORS.amber, fontSize: 12 }}>
              ⏳ Un dossier est en cours. Tu pourras soumettre un nouveau dossier après traitement.
            </Text>
          </Card>
        )}

        {loading && <ActivityIndicator color={COLORS.rose} />}

        {cases.length > 0 && (
          <Card>
            <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 8 }}>Mes dossiers</Text>
            {cases.map((c) => (
              <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: COLORS.line }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: COLORS.ink, fontSize: 13 }}>{LABELS[c.case_type as CaseType] ?? c.case_type}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>{(c.amount_requested_cents / 100).toFixed(2)}€</Text>
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 2 }}>
                  {c.status} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
