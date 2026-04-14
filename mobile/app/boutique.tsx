import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { COLORS } from "../src/constants/brand";
import { supabase } from "../src/lib/supabase";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  image_url: string | null;
  vida_cashback_percent: number;
  external_url: string | null;
  status: string;
};

const CATEGORY_EMOJI: Record<string, string> = {
  bracelet: "📿",
  soin: "🌿",
  formation: "📚",
  purificateur_eau: "💧",
  jardin: "🌱",
  livre: "📖",
  telephone: "📱",
  autre: "✨",
};

const CATEGORIES: { id: string; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "bracelet", label: "Bracelet" },
  { id: "soin", label: "Soin" },
  { id: "formation", label: "Formation" },
  { id: "purificateur_eau", label: "Eau" },
  { id: "jardin", label: "Jardin" },
  { id: "livre", label: "Livre" },
];

function priceLabel(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default function Boutique() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("tous");

  const load = useCallback(async () => {
    let q = supabase
      .schema("vida_assoc")
      .from("products")
      .select(
        "id,slug,name,description,price_cents,category,image_url,vida_cashback_percent,external_url,status"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);
    if (category !== "tous") q = q.eq("category", category);
    const { data } = await q;
    if (data) setProducts(data as Product[]);
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Boutique",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <View>
          <Text
            style={{
              color: COLORS.green,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Cashback VIDA sur chaque achat
          </Text>
          <Text
            style={{
              color: COLORS.ink,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 4,
              lineHeight: 32,
            }}
          >
            Acheter, c'est{"\n"}déjà donner.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                testID={`shop-cat-${c.id}`}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active
                    ? "rgba(16,185,129,0.45)"
                    : COLORS.line,
                  backgroundColor: active
                    ? "rgba(16,185,129,0.14)"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    color: active ? COLORS.green : COLORS.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {products.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Aucun produit dans cette catégorie pour l'instant.
            </Text>
          </Card>
        ) : (
          products.map((p) => (
            <Card key={p.id}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    backgroundColor: "rgba(16,185,129,0.14)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>
                    {CATEGORY_EMOJI[p.category] ?? "✨"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: COLORS.ink,
                      fontSize: 15,
                      fontWeight: "700",
                    }}
                    numberOfLines={2}
                  >
                    {p.name}
                  </Text>
                  {p.description && (
                    <Text
                      style={{
                        color: COLORS.dim,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {p.description}
                    </Text>
                  )}
                  <View
                    style={{
                      marginTop: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.green,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {priceLabel(p.price_cents)}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.amber,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      +{p.vida_cashback_percent}% cashback
                    </Text>
                  </View>
                </View>
              </View>
              {p.external_url && (
                <Pressable
                  onPress={() => Linking.openURL(p.external_url!)}
                  testID={`shop-buy-${p.slug}`}
                  style={({ pressed }) => ({
                    marginTop: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: COLORS.green,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: "#041612",
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    Découvrir →
                  </Text>
                </Pressable>
              )}
            </Card>
          ))
        )}
      </Screen>
    </>
  );
}
