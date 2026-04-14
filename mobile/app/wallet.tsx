import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { Input } from "../src/components/ui/Input";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

type Tx = {
  id: string;
  amount_cents: number;
  type: string;
  description: string | null;
  created_at: string;
};

export default function WalletScreen() {
  const { profile, session, refreshProfile } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .schema("vida_assoc")
      .from("wallet_transactions")
      .select("id,amount_cents,type,description,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setTxs(data as Tx[]);
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function withdraw() {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!cents || cents < 500) {
      Alert.alert("Montant invalide", "Minimum 5 € pour un retrait.");
      return;
    }
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(iban.replace(/\s/g, ""))) {
      Alert.alert("IBAN invalide", "Entre un IBAN correct (ex : FR76…).");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/wallet/withdraw`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          amount_cents: cents,
          iban: iban.replace(/\s/g, ""),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Impossible d'envoyer la demande.");
      }
      Alert.alert("Demande envoyée", "Ton virement sera traité sous 5 jours.");
      setAmount("");
      setIban("");
      await Promise.all([load(), refreshProfile()]);
    } catch (err) {
      Alert.alert(
        "Erreur",
        err instanceof Error ? err.message : "Réessaie plus tard."
      );
    } finally {
      setSending(false);
    }
  }

  const balance = (profile?.wallet_balance_cents ?? 0) / 100;

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Wallet",
          headerTintColor: COLORS.ink,
        }}
      />
      <View style={{ paddingTop: 40 }}>
        <Text
          style={{ color: COLORS.muted, fontSize: 12, fontWeight: "600" }}
        >
          SOLDE DISPONIBLE
        </Text>
        <Text
          style={{
            color: COLORS.green,
            fontSize: 44,
            fontWeight: "900",
            marginTop: 4,
          }}
        >
          {balance.toFixed(2)} €
        </Text>
      </View>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}>
          Retrait IBAN
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
          Dès 5 € · arrive sous 5 jours ouvrés.
        </Text>
        <View style={{ gap: 12, marginTop: 14 }}>
          <Input
            label="Montant"
            value={amount}
            onChangeText={setAmount}
            placeholder="5.00"
            keyboardType="decimal-pad"
            testID="wallet-amount"
          />
          <Input
            label="IBAN"
            value={iban}
            onChangeText={setIban}
            placeholder="FR76 …"
            autoCapitalize="characters"
            testID="wallet-iban"
          />
          <Button
            title="Demander le retrait"
            onPress={withdraw}
            loading={sending}
            testID="wallet-submit"
          />
        </View>
      </Card>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}>
          Historique
        </Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          {txs.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Aucun mouvement pour le moment.
            </Text>
          ) : (
            txs.map((t) => (
              <View
                key={t.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.line,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.ink, fontSize: 13, fontWeight: "600" }}>
                    {t.description ?? t.type}
                  </Text>
                  <Text style={{ color: COLORS.dim, fontSize: 11 }}>
                    {new Date(t.created_at).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                <Text
                  style={{
                    color: t.amount_cents >= 0 ? COLORS.green : COLORS.danger,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {t.amount_cents >= 0 ? "+" : ""}
                  {(t.amount_cents / 100).toFixed(2)} €
                </Text>
              </View>
            ))
          )}
        </View>
      </Card>
    </Screen>
  );
}
