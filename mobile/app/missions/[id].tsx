import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/stores/auth";
import { COLORS, BRAND } from "../../src/constants/brand";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  category: string;
  difficulty: string;
  impact_points: number;
  reward_credits: number;
  duration_min: number | null;
  proof_type: string;
};

export default function MissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .schema("vida_assoc")
      .from("missions")
      .select(
        "id,title,description,instructions,category,difficulty,impact_points,reward_credits,duration_min,proof_type"
      )
      .eq("id", id)
      .maybeSingle();
    setMission(data as Mission | null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Caméra refusée",
        "VIDA a besoin de la caméra pour valider ta preuve. Active-la dans Réglages."
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      mediaTypes: ["images"],
      exif: true,
    });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Galerie refusée",
        "Active l'accès photos dans Réglages pour charger ta preuve."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ["images"],
      exif: true,
    });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  }

  async function submit() {
    if (!session || !mission || !photo) {
      Alert.alert("Incomplet", "Ajoute d'abord une photo de ta preuve.");
      return;
    }
    setUploading(true);
    try {
      const locPerm = await Location.requestForegroundPermissionsAsync();
      let lat: number | null = null;
      let lng: number | null = null;
      if (locPerm.granted) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const ext = (photo.fileName?.split(".").pop() || "jpg").toLowerCase();
      const path = `${session.user.id}/${mission.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vida-proofs")
        .upload(path, bytes, {
          contentType: photo.mimeType ?? `image/${ext}`,
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage
        .from("vida-proofs")
        .getPublicUrl(path);

      const res = await fetch(
        `${BRAND.appUrl}/api/missions/${mission.id}/complete`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            proof_url: pub.publicUrl,
            proof_note: note,
            gps_lat: lat,
            gps_lng: lng,
          }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Échec de la validation");
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Envoi impossible",
        err instanceof Error ? err.message : "Réessaie dans un instant."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerTintColor: COLORS.ink,
        }}
      />
      {mission ? (
        <>
          <View style={{ paddingTop: 40, gap: 6 }}>
            <Text
              style={{
                color: COLORS.green,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              {mission.category} · {mission.difficulty}
            </Text>
            <Text
              style={{
                color: COLORS.ink,
                fontSize: 28,
                fontWeight: "800",
                lineHeight: 34,
              }}
            >
              {mission.title}
            </Text>
            {mission.description ? (
              <Text
                style={{ color: COLORS.muted, fontSize: 14, marginTop: 6 }}
              >
                {mission.description}
              </Text>
            ) : null}
          </View>

          {mission.instructions ? (
            <Card>
              <Text
                style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}
              >
                Comment prouver ?
              </Text>
              <Text
                style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}
              >
                {mission.instructions}
              </Text>
            </Card>
          ) : null}

          <Card>
            <Text
              style={{ color: COLORS.ink, fontSize: 15, fontWeight: "700" }}
            >
              Ta preuve
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
              Photo + position = +{mission.impact_points} impact & +{mission.reward_credits} VIDA.
            </Text>
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: 16,
                  marginTop: 14,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  marginTop: 14,
                  aspectRatio: 1,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: COLORS.line,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 36 }}>📷</Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 6 }}>
                  Aucune preuve ajoutée
                </Text>
              </View>
            )}
            <View style={{ gap: 10, marginTop: 14 }}>
              <Button
                title="Prendre une photo"
                variant="primary"
                onPress={pickPhoto}
                testID="mission-take-photo"
              />
              <Button
                title="Choisir dans la galerie"
                variant="secondary"
                onPress={pickFromGallery}
              />
            </View>
            <Input
              label="Une phrase pour la postérité"
              value={note}
              onChangeText={setNote}
              placeholder="Ce que tu as ressenti…"
              multiline
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
            <Button
              title={done ? "✨ Validé !" : "Envoyer ma preuve"}
              onPress={submit}
              loading={uploading}
              disabled={done}
              style={{ marginTop: 14 }}
              testID="mission-submit"
            />
          </Card>
        </>
      ) : (
        <Text style={{ color: COLORS.muted }}>Chargement…</Text>
      )}
    </Screen>
  );
}
