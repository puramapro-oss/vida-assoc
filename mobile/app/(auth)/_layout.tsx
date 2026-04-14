import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/stores/auth";
import { COLORS } from "../../src/constants/brand";

export default function AuthLayout() {
  const { session, hydrated } = useAuth();
  if (hydrated && session) return <Redirect href="/(tabs)/" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
