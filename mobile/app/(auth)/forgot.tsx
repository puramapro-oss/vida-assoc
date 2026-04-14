import { useState } from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { supabase } from "../../src/lib/supabase";
import { BRAND, COLORS } from "../../src/constants/brand";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (!email.trim()) {
      setError("Entre ton email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${BRAND.appUrl}/auth/callback`,
      }
    );
    setLoading(false);
    if (error) {
      setError("On n’a pas pu envoyer le lien. Réessaie dans un instant.");
      return;
    }
    setSent(true);
  }

  return (
    <Screen>
      <View style={{ paddingTop: 48, gap: 6 }}>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 30,
            fontWeight: "800",
            lineHeight: 36,
          }}
        >
          Réinitialiser{"\n"}ton mot de passe
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 6 }}>
          On t’envoie un lien magique pour en créer un nouveau.
        </Text>
      </View>
      <View style={{ gap: 14, marginTop: 24 }}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="toi@exemple.fr"
        />
        {error ? (
          <Text style={{ color: COLORS.amber, fontSize: 13 }}>{error}</Text>
        ) : null}
        {sent ? (
          <Text style={{ color: COLORS.green, fontSize: 13 }}>
            Lien envoyé ! Vérifie ta boîte mail.
          </Text>
        ) : null}
        <Button
          title={sent ? "Envoyé ✓" : "Envoyer le lien"}
          loading={loading}
          disabled={sent}
          onPress={send}
        />
      </View>
      <View style={{ marginTop: 24, alignItems: "center" }}>
        <Link href="/(auth)/login" asChild>
          <Text style={{ color: COLORS.cyan, fontSize: 13 }}>Retour à la connexion</Text>
        </Link>
      </View>
    </Screen>
  );
}
