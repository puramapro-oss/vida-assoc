import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { Input } from "../src/components/ui/Input";
import { useAuth } from "../src/stores/auth";
import { BRAND, COLORS } from "../src/constants/brand";

export default function ProfileEdit() {
  const { profile, session, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!session) return;
    setSaving(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/profile/update`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      if (!res.ok) throw new Error("Impossible d'enregistrer");
      await refreshProfile();
      Alert.alert("Enregistré ✓");
      router.back();
    } catch (e) {
      Alert.alert(
        "Oups",
        e instanceof Error ? e.message : "Réessaie plus tard."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Mon profil",
          headerTintColor: COLORS.ink,
        }}
      />
      <View style={{ paddingTop: 40 }}>
        <Text style={{ color: COLORS.ink, fontSize: 30, fontWeight: "800" }}>
          Toi
        </Text>
      </View>

      <Card>
        <View style={{ gap: 14 }}>
          <Input
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ton prénom ou ton nom"
          />
          <Input
            label="Email"
            value={profile?.email ?? ""}
            editable={false}
            style={{ opacity: 0.7 }}
          />
          <Button title="Enregistrer" loading={saving} onPress={save} />
        </View>
      </Card>
    </Screen>
  );
}
