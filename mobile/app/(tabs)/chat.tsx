import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../../src/components/Screen";
import { COLORS, BRAND } from "../../src/constants/brand";
import { useAuth } from "../../src/stores/auth";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Suggère-moi une mission facile aujourd'hui",
  "Comment augmenter mon impact ?",
  "Quelle asso soutenir si j'ai 20 € ?",
  "Explique-moi les niveaux de conscience",
];

export default function ChatVida() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch(`${BRAND.appUrl}/api/chat-vida`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token
            ? { authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok || !res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const raw of chunk.split("\n")) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            const delta: string | undefined = j.delta ?? j.text;
            if (delta) {
              acc += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: acc } : m
                )
              );
            }
          } catch {
            acc += payload;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: acc } : m
              )
            );
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Le lien avec VIDA s'est coupé. Réessaie dans un instant 🌿",
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
      listRef.current?.scrollToEnd({ animated: true });
    }
  }

  return (
    <Screen scroll={false} padding={0}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text
            style={{
              color: COLORS.green,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            VIDA
          </Text>
          <Text
            style={{
              color: COLORS.ink,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 2,
            }}
          >
            Ton guide en conscience
          </Text>
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 120,
            gap: 12,
          }}
          ListEmptyComponent={
            <View style={{ gap: 10, marginTop: 10 }}>
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                Pose une question, choisis ton rythme. VIDA t'écoute.
              </Text>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => ({
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: "rgba(16,185,129,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(16,185,129,0.22)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: COLORS.ink, fontSize: 14 }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf:
                  item.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "86%",
                padding: 14,
                borderRadius: 18,
                backgroundColor:
                  item.role === "user"
                    ? "rgba(16,185,129,0.18)"
                    : "rgba(255,255,255,0.045)",
                borderWidth: 1,
                borderColor:
                  item.role === "user"
                    ? "rgba(16,185,129,0.35)"
                    : COLORS.line,
              }}
            >
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {item.content || "…"}
              </Text>
            </View>
          )}
        />
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 96,
            paddingTop: 10,
            backgroundColor: COLORS.bg,
            borderTopWidth: 1,
            borderTopColor: COLORS.line,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Parle à VIDA…"
            placeholderTextColor={COLORS.dim}
            style={{
              flex: 1,
              color: COLORS.ink,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: COLORS.line,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
            }}
            onSubmitEditing={() => send()}
            testID="chat-input"
          />
          <Pressable
            onPress={() => send()}
            disabled={streaming || !input.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor:
                streaming || !input.trim()
                  ? "rgba(16,185,129,0.25)"
                  : COLORS.green,
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="chat-send"
          >
            <Text style={{ fontSize: 20 }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
