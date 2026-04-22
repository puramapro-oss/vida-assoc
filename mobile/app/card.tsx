import { Text, View, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { COLORS } from "../src/constants/brand";

export default function CardScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: "Purama Card", headerStyle: { backgroundColor: COLORS.bg } }} />
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        <Card>
          <Text style={{ color: COLORS.ink, fontSize: 20, fontWeight: "700" }}>Ta Purama Card arrive</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
            La carte qui redistribue à chaque achat. Smart Split entre toi, l&apos;asso de ton cœur, et Sangha.
          </Text>
        </Card>

        <View style={{
          backgroundColor: COLORS.surface, borderRadius: 20, padding: 20,
          borderWidth: 2, borderColor: COLORS.green, overflow: "hidden",
        }}>
          <Text style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase" }}>Silver · Phase 1</Text>
          <Text style={{ color: COLORS.ink, fontSize: 22, fontWeight: "700", marginTop: 20, letterSpacing: 2 }}>
            •••• •••• •••• ••••
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
            <View>
              <Text style={{ color: COLORS.dim, fontSize: 10, textTransform: "uppercase" }}>Titulaire</Text>
              <Text style={{ color: COLORS.ink, fontSize: 13, marginTop: 2 }}>Sangha Premium</Text>
            </View>
            <View>
              <Text style={{ color: COLORS.dim, fontSize: 10, textTransform: "uppercase" }}>Activation</Text>
              <Text style={{ color: COLORS.ink, fontSize: 13, marginTop: 2 }}>Phase 2</Text>
            </View>
          </View>
        </View>

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 8 }}>Ce que la carte apportera</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18 }}>
            • Débit instantané sur ton wallet Sangha{"\n"}
            • Smart Split configurable (toi / asso / Sangha){"\n"}
            • Cashback en Points sur chaque achat{"\n"}
            • Conforme DSP2 · Stripe Technology Europe Limited{"\n"}
            • Activation dès les premiers CPA partenaires signés
          </Text>
        </Card>

        <Card>
          <Text style={{ color: COLORS.ink, fontWeight: "600", marginBottom: 8 }}>En attendant la Phase 2</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 18 }}>
            Profite de ta prime de bienvenue wallet (Phase 1). Retrait IBAN dès 5€ — 30 jours d&apos;attente anti-fraude
            à ton inscription.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
