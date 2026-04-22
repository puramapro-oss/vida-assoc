import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../stores/auth";
import { supabase } from "../lib/supabase";
import { COLORS } from "../constants/brand";
import { onboardingStorage } from "../lib/storage";

type Phase = "idle" | "cinematic" | "tutorial" | "done";

type Step = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    emoji: "🌱",
    title: "Bienvenue dans Sangha",
    body: "Ici, chaque action compte. Tu vas découvrir un espace pour transformer tes intentions en impact réel.",
    cta: "Commencer",
  },
  {
    id: "missions",
    emoji: "🎯",
    title: "Réalise des missions",
    body: "Ramasser des déchets, donner du sang, planter un arbre… Chaque mission validée gonfle ton impact et ton wallet.",
    cta: "Suivant",
  },
  {
    id: "dons",
    emoji: "❤️",
    title: "Soutiens des associations",
    body: "100 % de ton don part à l'association choisie. Sangha ne prélève aucune commission sur les dons aux autres.",
    cta: "Suivant",
  },
  {
    id: "rituels",
    emoji: "🕊️",
    title: "Rejoins les rituels collectifs",
    body: "Méditations guidées, intentions de paix, actions de purification. Tu n'es jamais seul·e.",
    cta: "Suivant",
  },
  {
    id: "concours",
    emoji: "🏆",
    title: "Joue aux concours",
    body: "10 gagnants chaque semaine. Tu gagnes des tickets en agissant — pas en payant.",
    cta: "Suivant",
  },
  {
    id: "wallet",
    emoji: "💰",
    title: "Encaisse tes gains",
    body: "Dès 5 €, tu peux retirer tes gains sur ton IBAN. Récompenses missions, parrainage, concours — tout te revient.",
    cta: "Suivant",
  },
  {
    id: "parcours",
    emoji: "✨",
    title: "Apprends, partage, élève",
    body: "Formations, communauté, parrainage… Tu vas grandir avec une famille engagée.",
    cta: "C'est parti",
  },
];

export function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    (async () => {
      const introSeen =
        (await onboardingStorage.get("intro")) === "1" || !!profile.onboarded;
      const tutoDone =
        (await onboardingStorage.get("tutorial")) === "1" ||
        !!profile.tutorial_completed;
      if (cancelled) return;
      if (!introSeen) setPhase("cinematic");
      else if (!tutoDone) setPhase("tutorial");
      else setPhase("done");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  async function finishCinematic() {
    await onboardingStorage.set("intro", "1");
    if (user) {
      await supabase
        .schema("vida_assoc")
        .from("profiles")
        .update({ onboarded: true })
        .eq("id", user.id);
      void refreshProfile();
    }
    setPhase("tutorial");
  }

  async function finishTutorial() {
    await onboardingStorage.set("tutorial", "1");
    if (user) {
      await supabase
        .schema("vida_assoc")
        .from("profiles")
        .update({ tutorial_completed: true })
        .eq("id", user.id);
      void refreshProfile();
    }
    setPhase("done");
  }

  function next() {
    Haptics.selectionAsync().catch(() => {});
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else void finishTutorial();
  }

  if (phase === "idle" || phase === "done") return null;
  if (phase === "cinematic") return <Cinematic onFinish={finishCinematic} />;

  const current = STEPS[stepIdx];
  if (!current) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={finishTutorial}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,10,15,0.86)",
          justifyContent: "flex-end",
          padding: 16,
        }}
      >
        <LinearGradient
          colors={["rgba(16,185,129,0.18)", "rgba(6,182,212,0.10)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 28,
            borderWidth: 1,
            borderColor: COLORS.line,
            padding: 24,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Passer le tutoriel"
            testID="tutorial-skip"
            onPress={finishTutorial}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 16 }}>×</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 30 }}>{current.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Étape {stepIdx + 1} / {STEPS.length}
              </Text>
              <Text
                style={{
                  color: COLORS.ink,
                  fontSize: 20,
                  fontWeight: "800",
                  marginTop: 2,
                }}
              >
                {current.title}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 14,
              lineHeight: 21,
              marginTop: 18,
            }}
          >
            {current.body}
          </Text>

          <View
            style={{
              marginTop: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", gap: 6 }}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 6,
                    width: 24,
                    borderRadius: 3,
                    backgroundColor:
                      i === stepIdx
                        ? COLORS.green
                        : i < stepIdx
                        ? "rgba(255,255,255,0.30)"
                        : "rgba(255,255,255,0.10)",
                  }}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={current.cta}
              testID="tutorial-next"
              onPress={next}
              style={({ pressed }) => ({
                backgroundColor: COLORS.green,
                paddingHorizontal: 22,
                paddingVertical: 12,
                borderRadius: 14,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: "#041612",
                  fontWeight: "800",
                  fontSize: 14,
                  letterSpacing: 0.3,
                }}
              >
                {current.cta} →
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function Cinematic({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleY = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(titleY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(subtitleY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    const t = setTimeout(onFinish, 4000);
    return () => clearTimeout(t);
  }, [onFinish, fade, scale, titleY, titleOpacity, subtitleY, subtitleOpacity]);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View
        testID="onboarding-cinematic"
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: "center",
          justifyContent: "center",
          opacity: fade,
        }}
      >
        <LinearGradient
          colors={["rgba(16,185,129,0.20)", "transparent"]}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <Pressable
          testID="cinematic-skip"
          accessibilityRole="button"
          accessibilityLabel="Passer l'introduction"
          onPress={onFinish}
          style={{
            position: "absolute",
            right: 18,
            top: 56,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: COLORS.line,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "600" }}>
            Passer
          </Text>
        </Pressable>

        <View style={{ alignItems: "center", maxWidth: width * 0.85 }}>
          <Animated.Text
            style={{
              fontSize: 80,
              opacity: scale,
              transform: [{ scale }],
            }}
          >
            🌱
          </Animated.Text>
          <Animated.Text
            style={{
              marginTop: 18,
              color: COLORS.ink,
              fontSize: 36,
              fontWeight: "800",
              textAlign: "center",
              opacity: titleOpacity,
              transform: [{ translateY: titleY }],
            }}
          >
            Bienvenue dans Sangha
          </Animated.Text>
          <Animated.Text
            style={{
              marginTop: 14,
              color: COLORS.muted,
              fontSize: 14,
              lineHeight: 21,
              textAlign: "center",
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleY }],
            }}
          >
            Tu fais désormais partie d&apos;une famille engagée. Chaque geste,
            chaque don, chaque intention nourrit l&apos;élan collectif.
          </Animated.Text>
        </View>
      </Animated.View>
    </Modal>
  );
}
