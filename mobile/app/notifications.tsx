import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { COLORS, BRAND } from "../src/constants/brand";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/stores/auth";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  icon: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_EMOJI: Record<string, string> = {
  new_mission: "🌍",
  ritual: "🕊️",
  contest: "🏆",
  reward: "💰",
  impact: "✨",
  donation: "❤️",
  referral: "🌱",
  streak: "🔥",
  system: "🔔",
  community: "💬",
  influencer: "📣",
  level_up: "🚀",
};

export default function Notifications() {
  const { user, session } = useAuth();
  const [list, setList] = useState<Notif[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    let q = supabase
      .schema("vida_assoc")
      .from("notifications")
      .select("id,type,title,body,icon,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter === "unread") q = q.eq("read", false);
    const { data } = await q;
    if (data) queueMicrotask(() => setList(data as Notif[]));
  }, [user, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function markRead(ids?: string[]) {
    setList((prev) =>
      prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n))
    );
    try {
      await fetch(`${BRAND.appUrl}/api/notifications/mark-read`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token
            ? { authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify(ids ? { ids } : { all: true }),
      });
    } catch {
      // optimistic only
    }
  }

  const unread = list.filter((n) => !n.read).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notifications",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {(["all", "unread"] as const).map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                testID={`notif-filter-${f}`}
                style={{
                  paddingHorizontal: 14,
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
                  {f === "all" ? "Toutes" : `Non lues${unread ? ` (${unread})` : ""}`}
                </Text>
              </Pressable>
            );
          })}
          <View style={{ flex: 1 }} />
          {unread > 0 && (
            <Button
              title="Tout marquer lu"
              size="sm"
              variant="secondary"
              onPress={() => markRead()}
              testID="notif-mark-all"
            />
          )}
        </View>

        {list.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Aucune notification pour le moment 🌿
            </Text>
          </Card>
        ) : (
          list.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => !n.read && markRead([n.id])}
              testID={`notif-${n.id}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card>
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: n.read
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(16,185,129,0.16)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>
                      {n.icon ?? TYPE_EMOJI[n.type] ?? "🔔"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          color: COLORS.ink,
                          fontSize: 14,
                          fontWeight: n.read ? "600" : "800",
                        }}
                        numberOfLines={2}
                      >
                        {n.title}
                      </Text>
                      {!n.read && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: COLORS.green,
                          }}
                        />
                      )}
                    </View>
                    {n.body && (
                      <Text
                        style={{
                          color: COLORS.muted,
                          fontSize: 13,
                          marginTop: 4,
                          lineHeight: 19,
                        }}
                        numberOfLines={3}
                      >
                        {n.body}
                      </Text>
                    )}
                    <Text
                      style={{ color: COLORS.dim, fontSize: 11, marginTop: 6 }}
                    >
                      {new Date(n.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </>
  );
}
