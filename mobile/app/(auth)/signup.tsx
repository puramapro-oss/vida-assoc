import { useState } from "react";
import { Text, View } from "react-native";
import { Link, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../../src/components/Screen";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { supabase } from "../../src/lib/supabase";
import { signInWithGoogle } from "../../src/lib/oauth";
import { BRAND, COLORS } from "../../src/constants/brand";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function googleSignUp() {
    setError(null);
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (!res.ok) {
      if (!res.cancelled) setError(res.error);
      return;
    }
    router.replace("/(tabs)/");
  }

  async function signUp() {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Tous les champs sont nécessaires.");
      return;
    }
    if (password.length < 8) {
      setError("Mot de passe : 8 caractères minimum.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("already")
          ? "Cet email existe déjà. Connecte-toi plutôt."
          : error.message
      );
      return;
    }
    router.replace("/(tabs)/");
  }

  return (
    <Screen>
      <LinearGradient
        colors={["rgba(16,185,129,0.22)", "rgba(6,182,212,0.05)", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 320,
        }}
      />
      <View style={{ paddingTop: 48, gap: 6 }}>
        <Text
          style={{
            color: COLORS.green,
            fontSize: 12,
            letterSpacing: 2,
            fontWeight: "700",
            textTransform: "uppercase",
          }}
        >
          {BRAND.name}
        </Text>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 32,
            fontWeight: "800",
            lineHeight: 38,
          }}
        >
          Chaque geste compte.{"\n"}
          <Text style={{ color: COLORS.green }}>Allume la tienne.</Text>
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 6 }}>
          Rejoins une communauté qui transforme l’action en impact mesurable.
        </Text>
      </View>

      <View style={{ gap: 14, marginTop: 24 }}>
        <Input
          label="Prénom"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Alex"
          testID="signup-name"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="toi@exemple.fr"
          testID="signup-email"
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8 caractères minimum"
          testID="signup-password"
        />
        {error ? (
          <Text style={{ color: COLORS.amber, fontSize: 13 }}>{error}</Text>
        ) : null}
        <Button
          title="Créer mon compte"
          loading={loading}
          onPress={signUp}
          testID="signup-submit"
        />
        <Button
          title="Continuer avec Google"
          variant="secondary"
          loading={googleLoading}
          onPress={googleSignUp}
          testID="signup-google"
        />
      </View>

      <View style={{ marginTop: 24, alignItems: "center" }}>
        <Link href="/(auth)/login" asChild>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            Déjà un compte ?{" "}
            <Text style={{ color: COLORS.green, fontWeight: "700" }}>
              Se connecter
            </Text>
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
