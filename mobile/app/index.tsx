import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/stores/auth";
import { COLORS } from "../src/constants/brand";

export default function Index() {
  const { hydrated, session } = useAuth();

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.bg,
        }}
      >
        <ActivityIndicator color={COLORS.green} />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)/" />;
  return <Redirect href="/(auth)/login" />;
}
