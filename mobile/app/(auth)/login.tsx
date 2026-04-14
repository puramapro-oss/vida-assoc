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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function googleSignIn() {
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

  async function signIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("invalid")
          ? "Identifiants incorrects. Réessaie ou crée un compte."
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
            fontSize: 34,
            fontWeight: "800",
            lineHeight: 40,
          }}
        >
          Bon retour parmi {"\n"}les lumières vivantes.
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 6 }}>
          Connecte-toi pour reprendre tes missions et suivre ton impact.
        </Text>
      </View>

      <View style={{ gap: 14, marginTop: 24 }}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="toi@exemple.fr"
          testID="login-email"
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          testID="login-password"
        />
        {error ? (
          <Text style={{ color: COLORS.amber, fontSize: 13 }}>{error}</Text>
        ) : null}
        <Button
          title="Se connecter"
          loading={loading}
          onPress={signIn}
          testID="login-submit"
        />
        <Button
          title="Continuer avec Google"
          variant="secondary"
          loading={googleLoading}
          onPress={googleSignIn}
          testID="login-google"
        />
      </View>

      <View style={{ marginTop: 28, alignItems: "center", gap: 10 }}>
        <Link href="/(auth)/forgot" asChild>
          <Text style={{ color: COLORS.cyan, fontSize: 13 }}>
            Mot de passe oublié ?
          </Text>
        </Link>
        <Link href="/(auth)/signup" asChild>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            Pas encore de compte ?{" "}
            <Text style={{ color: COLORS.green, fontWeight: "700" }}>
              Rejoindre VIDA
            </Text>
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
