import { Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

const TIERS = [
  { name: "Graine", min: 0 },
  { name: "Bronze", min: 5 },
  { name: "Argent", min: 10 },
  { name: "Or", min: 25 },
  { name: "Platine", min: 50 },
  { name: "Légende", min: 100 },
];

export default function Referral() {
  const { profile } = useAuth();
  const code = profile?.referral_code ?? "Sangha";
  const link = `${BRAND.appUrl}/r/${code}`;

  async function shareLink() {
    await Share.share({
      message: `Rejoins Sangha avec moi 🌱 https://${BRAND.domain}/r/${code}`,
      url: link,
    });
  }

  async function copyLink() {
    await Clipboard.setStringAsync(link);
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Parrainage",
          headerTintColor: COLORS.ink,
        }}
      />
      <View style={{ paddingTop: 40 }}>
        <Text
          style={{ color: COLORS.green, fontSize: 12, fontWeight: "700", letterSpacing: 2 }}
        >
          TON CODE
        </Text>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 40,
            fontWeight: "900",
            marginTop: 4,
          }}
        >
          {code}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>{link}</Text>
      </View>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}>
          Invite une âme
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Chaque filleul qui s'inscrit débloque des récompenses pour toi et
          soutient une asso.
        </Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          <Button title="Partager le lien" onPress={shareLink} />
          <Button title="Copier le lien" variant="secondary" onPress={copyLink} />
        </View>
      </Card>

      <Card>
        <Text style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}>
          Paliers
        </Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          {TIERS.map((t) => (
            <View
              key={t.name}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.line,
              }}
            >
              <Text
                style={{ flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: "600" }}
              >
                {t.name}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                {t.min} filleuls
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
