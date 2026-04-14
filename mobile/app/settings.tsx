import { Linking, Text, View } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { useAuth } from "../src/stores/auth";
import { BRAND, COLORS } from "../src/constants/brand";

export default function Settings() {
  const { profile, signOut } = useAuth();

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Réglages",
          headerTintColor: COLORS.ink,
        }}
      />
      <View style={{ paddingTop: 40 }}>
        <Text style={{ color: COLORS.ink, fontSize: 30, fontWeight: "800" }}>
          Réglages
        </Text>
      </View>

      <Card>
        <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "700" }}>
          COMPTE
        </Text>
        <Text
          style={{ color: COLORS.ink, fontSize: 15, marginTop: 6, fontWeight: "600" }}
        >
          {profile?.full_name ?? "—"}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>
          {profile?.email ?? ""}
        </Text>
        <Text style={{ color: COLORS.green, fontSize: 12, marginTop: 6 }}>
          Plan : {profile?.plan ?? "free"}
        </Text>
      </Card>

      <Card>
        <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "700" }}>
          GÉRER MON ABONNEMENT
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Tu gères ta facturation depuis le portail Stripe sur le web.
        </Text>
        <Button
          title="Ouvrir le portail"
          variant="secondary"
          onPress={() => Linking.openURL(`${BRAND.appUrl}/dashboard/settings`)}
          style={{ marginTop: 14 }}
        />
      </Card>

      <Card>
        <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "700" }}>
          VIE PRIVÉE
        </Text>
        <Button
          title="Mentions légales"
          variant="ghost"
          onPress={() => Linking.openURL(`${BRAND.appUrl}/mentions-legales`)}
          style={{ marginTop: 10 }}
        />
        <Button
          title="Confidentialité"
          variant="ghost"
          onPress={() =>
            Linking.openURL(`${BRAND.appUrl}/politique-confidentialite`)
          }
          style={{ marginTop: 8 }}
        />
        <Button
          title="CGU"
          variant="ghost"
          onPress={() => Linking.openURL(`${BRAND.appUrl}/cgu`)}
          style={{ marginTop: 8 }}
        />
      </Card>

      <Button
        title="Se déconnecter"
        variant="danger"
        onPress={() => signOut()}
      />

      <Text
        style={{
          color: COLORS.dim,
          fontSize: 11,
          textAlign: "center",
          marginTop: 12,
        }}
      >
        {BRAND.name} v{Constants.expoConfig?.version ?? "1.0.0"} ·{" "}
        {BRAND.org}
      </Text>
    </Screen>
  );
}
