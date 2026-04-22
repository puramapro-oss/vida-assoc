import { Share, Text, View, ScrollView } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { useAuth } from "../src/stores/auth";
import { COLORS, BRAND } from "../src/constants/brand";

const TIERS = [
  { name: "Graine",   threshold: 0,     commission: 10, advantage: "Accès au programme" },
  { name: "Bronze",   threshold: 10,    commission: 10, advantage: "Starter GRATUIT à vie" },
  { name: "Silver",   threshold: 25,    commission: 11, advantage: "Pro + early access 7j" },
  { name: "Gold",     threshold: 50,    commission: 12, advantage: "Unlimited + page perso" },
  { name: "Platinum", threshold: 100,   commission: 13, advantage: "Enterprise + feature prio" },
  { name: "Diamond",  threshold: 250,   commission: 15, advantage: "Purama Card VIP" },
  { name: "Légende",  threshold: 500,   commission: 17, advantage: "Commissions héréditaires" },
  { name: "Titan",    threshold: 5000,  commission: 20, advantage: "Ligne produit Tissma" },
  { name: "Éternel",  threshold: 10000, commission: 25, advantage: "1 % parts + héréditaire" },
];

export default function Ambassadeur() {
  const { profile } = useAuth();
  const code = profile?.referral_code ?? "Sangha";
  const link = `${BRAND.appUrl}/r/${code}`;

  async function shareLink() {
    await Share.share({
      message: `Rejoins Sangha avec moi 🌱 ${link}`,
      url: link,
    });
  }

  async function copyCode() {
    await Clipboard.setStringAsync(link);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Programme Ambassadeur", headerStyle: { backgroundColor: COLORS.bg } }} />
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        <Card>
          <Text style={{ color: COLORS.ink, fontSize: 20, fontWeight: "700" }}>Programme Ambassadeur V4</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
            8 paliers Bronze → Éternel. 50 % du 1<Text style={{fontSize: 9}}>er</Text> abo filleul + 10 % à vie.
            Carte Purama offerte dès 10 filleuls actifs.
          </Text>
        </Card>

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 8 }}>Mon lien ambassadeur</Text>
          <Text style={{ color: COLORS.amber, fontFamily: "monospace", fontSize: 13 }} selectable>{link}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Button onPress={shareLink} title="Partager" style={{ flex: 1 }} />
            <Button onPress={copyCode} title="Copier" variant="secondary" style={{ flex: 1 }} />
          </View>
        </Card>

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 12 }}>Grille paliers</Text>
          {TIERS.slice(1).map((t) => (
            <View key={t.name} style={{
              flexDirection: "row", justifyContent: "space-between",
              paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.line,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.ink, fontWeight: "600" }}>{t.name}</Text>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{t.advantage}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: COLORS.amber, fontWeight: "700" }}>+{t.commission}%</Text>
                <Text style={{ color: COLORS.muted, fontSize: 10 }}>{t.threshold}+ filleuls</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 6 }}>Academy</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18 }}>
            • Niv 1 Fondations (2h) — débloqué dès inscription{"\n"}
            • Niv 2 Croissance (6h) — 10 filleuls actifs{"\n"}
            • Niv 3 Maîtrise (12h) — 50 filleuls actifs
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
