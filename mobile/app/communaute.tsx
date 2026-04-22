import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { COLORS, BRAND } from "../src/constants/brand";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/stores/auth";

type PostType = "text" | "victory" | "gratitude" | "question";

type Post = {
  id: string;
  user_id: string;
  content: string;
  type: PostType;
  likes_count: number;
  created_at: string;
  author_name?: string | null;
};

const TYPES: { id: PostType; label: string; emoji: string }[] = [
  { id: "text", label: "Partage", emoji: "💬" },
  { id: "victory", label: "Victoire", emoji: "🏆" },
  { id: "gratitude", label: "Gratitude", emoji: "🙏" },
  { id: "question", label: "Question", emoji: "❓" },
];

export default function Communaute() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("text");
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema("vida_assoc")
      .from("community_posts")
      .select(
        "id,user_id,content,type,likes_count,created_at,profiles!community_posts_user_id_fkey(full_name)"
      )
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setPosts(
        (data as unknown as (Post & { profiles?: { full_name?: string | null } })[]).map(
          (p) => ({
            ...p,
            author_name: p.profiles?.full_name ?? null,
          })
        )
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function publish() {
    const trimmed = content.trim();
    if (trimmed.length < 2 || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`${BRAND.appUrl}/api/community/post`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token
            ? { authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ content: trimmed, type }),
      });
      if (!res.ok) throw new Error("post_failed");
      setContent("");
      setType("text");
      await load();
    } catch {
      // noop
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(post: Post) {
    const isLiked = liked[post.id];
    setLiked((m) => ({ ...m, [post.id]: !isLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
          : p
      )
    );
    try {
      await fetch(`${BRAND.appUrl}/api/community/${post.id}/like`, {
        method: "POST",
        headers: session?.access_token
          ? { authorization: `Bearer ${session.access_token}` }
          : {},
      });
    } catch {
      setLiked((m) => ({ ...m, [post.id]: isLiked }));
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Communauté",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.ink,
          headerBackTitle: "Retour",
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <Card>
          <Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: "700" }}>
            Partage ton souffle
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
            Une victoire, une gratitude, une question. Aucun jugement.
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setType(t.id)}
                  testID={`community-type-${t.id}`}
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
                    {t.emoji} {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Que veux-tu partager aujourd'hui ?"
            placeholderTextColor={COLORS.dim}
            multiline
            testID="community-input"
            style={{
              marginTop: 14,
              minHeight: 90,
              color: COLORS.ink,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: COLORS.line,
              borderRadius: 14,
              padding: 14,
              fontSize: 14,
              textAlignVertical: "top",
            }}
          />
          <Button
            title={posting ? "Publication…" : "Publier"}
            onPress={publish}
            loading={posting}
            disabled={content.trim().length < 2}
            style={{ marginTop: 12 }}
            testID="community-publish"
          />
        </Card>

        {posts.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>
              Sois le premier à partager une étincelle ✨
            </Text>
          </Card>
        ) : (
          posts.map((p) => {
            const t = TYPES.find((x) => x.id === p.type) ?? TYPES[0];
            return (
              <Card key={p.id}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: "rgba(16,185,129,0.14)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.ink,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                      numberOfLines={1}
                    >
                      {p.author_name ?? "Âme Sangha"}
                    </Text>
                    <Text style={{ color: COLORS.dim, fontSize: 11 }}>
                      {new Date(p.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: COLORS.ink,
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 12,
                  }}
                >
                  {p.content}
                </Text>
                <Pressable
                  onPress={() => toggleLike(p)}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: liked[p.id]
                      ? "rgba(244,114,182,0.18)"
                      : "rgba(255,255,255,0.04)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                  testID={`community-like-${p.id}`}
                >
                  <Text style={{ fontSize: 14 }}>{liked[p.id] ? "💖" : "🤍"}</Text>
                  <Text
                    style={{
                      color: liked[p.id] ? COLORS.rose : COLORS.muted,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {p.likes_count}
                  </Text>
                </Pressable>
              </Card>
            );
          })
        )}

        <Button
          title="Voir mon profil"
          variant="secondary"
          onPress={() => router.push("/profile")}
        />
      </Screen>
    </>
  );
}
