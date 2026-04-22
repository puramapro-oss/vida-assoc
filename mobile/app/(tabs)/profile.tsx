import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { useAuth } from "../../src/stores/auth";
import { COLORS, BRAND } from "../../src/constants/brand";

const ROWS: { key: string; label: string; icon: string; href: string }[] = [
  { key: "profile", label: "Mon profil", icon: "🧘", href: "/profile" },
  { key: "upgrade", label: "Passer à Sangha Premium", icon: "✨", href: "/upgrade" },
  { key: "wallet", label: "Wallet & retraits", icon: "💰", href: "/wallet" },
  { key: "referral", label: "Parrainage", icon: "✨", href: "/referral" },
  { key: "notifications", label: "Notifications", icon: "🔔", href: "/notifications" },
  { key: "communaute", label: "Communauté", icon: "💬", href: "/communaute" },
  { key: "rituels", label: "Rituels collectifs", icon: "🕊️", href: "/rituels" },
  { key: "concours", label: "Concours", icon: "🏆", href: "/concours" },
  { key: "formations", label: "Formations", icon: "📚", href: "/formations" },
  { key: "boutique", label: "Boutique", icon: "🛍️", href: "/boutique" },
  { key: "dons", label: "Faire un don", icon: "❤️", href: "/dons" },
  { key: "associations", label: "Associations", icon: "🌍", href: "/associations" },
  { key: "settings", label: "Réglages", icon: "⚙️", href: "/settings" },
  { key: "help", label: "Aide & contact", icon: "❓", href: "/help" },
];

export default function ProfileTab() {
  const { profile, signOut } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Lumière";

  return (
    <Screen>
      <View style={{ paddingTop: 20, gap: 4 }}>
        <Text
          style={{
            color: COLORS.green,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Toi
        </Text>
        <Text
          style={{
            color: COLORS.ink,
            fontSize: 32,
            fontWeight: "800",
          }}
        >
          {firstName}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          {profile?.email ?? ""}
        </Text>
      </View>

      <Card>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              IMPACT
            </Text>
            <Text
              style={{
                color: COLORS.ink,
                fontSize: 22,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              {Math.round(profile?.impact_score ?? 0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              Sangha
            </Text>
            <Text
              style={{
                color: COLORS.green,
                fontSize: 22,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              {profile?.vida_credits ?? 0}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              STREAK
            </Text>
            <Text
              style={{
                color: COLORS.amber,
                fontSize: 22,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              🔥 {profile?.streak_days ?? 0}
            </Text>
          </View>
        </View>
      </Card>

      <Card padding={0}>
        {ROWS.map((r, i) => (
          <Pressable
            key={r.key}
            onPress={() => router.push(r.href as never)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingHorizontal: 18,
              paddingVertical: 16,
              borderBottomWidth: i === ROWS.length - 1 ? 0 : 1,
              borderBottomColor: COLORS.line,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 20 }}>{r.icon}</Text>
            <Text
              style={{ flex: 1, color: COLORS.ink, fontSize: 15, fontWeight: "600" }}
            >
              {r.label}
            </Text>
            <Text style={{ color: COLORS.dim, fontSize: 18 }}>›</Text>
          </Pressable>
        ))}
      </Card>

      <Button
        title="Se déconnecter"
        variant="ghost"
        onPress={() =>
          Alert.alert(
            "Déconnexion",
            "On se revoit très vite ?",
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Oui, déconnecter",
                style: "destructive",
                onPress: () => signOut(),
              },
            ]
          )
        }
      />

      <Text
        style={{
          color: COLORS.dim,
          fontSize: 11,
          textAlign: "center",
          marginTop: 12,
        }}
      >
        {BRAND.org} · {BRAND.domain}
      </Text>
    </Screen>
  );
}
