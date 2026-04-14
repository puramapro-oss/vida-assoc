import { Linking, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { BRAND, COLORS } from "../src/constants/brand";

const FAQ = [
  {
    q: "Comment valider une mission ?",
    a: "Ouvre la mission → Prendre une photo → Envoyer ma preuve. VIDA horodate et géolocalise automatiquement.",
  },
  {
    q: "Où retirer mes gains ?",
    a: "Onglet Moi → Wallet. Dès 5 € disponibles tu peux demander un retrait IBAN.",
  },
  {
    q: "Comment changer d'abonnement ?",
    a: "Réglages → Ouvrir le portail. Tu peux annuler ou upgrader à tout moment.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Toujours. RGPD strict, 0 revente, tu peux demander l'export / suppression à tout moment.",
  },
];

export default function Help() {
  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Aide",
          headerTintColor: COLORS.ink,
        }}
      />
      <View style={{ paddingTop: 40 }}>
        <Text style={{ color: COLORS.ink, fontSize: 30, fontWeight: "800" }}>
          On est là.
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Une question ? Une idée ? Un souci ? Écris-nous.
        </Text>
      </View>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}>
          Contact direct
        </Text>
        <Button
          title="Parler à VIDA (IA)"
          onPress={() => router.push("/(tabs)/chat")}
          style={{ marginTop: 14 }}
        />
        <Button
          title="Envoyer un email"
          variant="secondary"
          onPress={() => Linking.openURL(`mailto:${BRAND.support}`)}
          style={{ marginTop: 10 }}
        />
      </Card>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}>
          FAQ
        </Text>
        <View style={{ gap: 14, marginTop: 14 }}>
          {FAQ.map((f) => (
            <View key={f.q}>
              <Text
                style={{ color: COLORS.ink, fontSize: 14, fontWeight: "700" }}
              >
                {f.q}
              </Text>
              <Text
                style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}
              >
                {f.a}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
