import { Tabs, Redirect } from "expo-router";
import { Platform, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useAuth } from "../../src/stores/auth";
import { COLORS } from "../../src/constants/brand";
import { Onboarding } from "../../src/components/Onboarding";

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 46,
        height: 30,
        borderRadius: 14,
        backgroundColor: focused ? "rgba(16,185,129,0.14)" : "transparent",
      }}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { session, hydrated } = useAuth();
  if (hydrated && !session) return <Redirect href="/(auth)/login" />;

  return (
    <>
      <Onboarding />
      <TabsInner />
    </>
  );
}

function TabsInner() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        sceneStyle: { backgroundColor: COLORS.bg },
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: Platform.OS === "ios" ? 24 : 14,
          borderRadius: 22,
          height: 62,
          borderTopWidth: 0,
          backgroundColor:
            Platform.OS === "ios"
              ? "rgba(10,10,15,0.6)"
              : "rgba(18,20,26,0.96)",
          borderWidth: 1,
          borderColor: COLORS.line,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={35}
              tint="dark"
              style={{ flex: 1, borderRadius: 22, overflow: "hidden" }}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => <TabIcon icon="🌱" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarIcon: ({ focused }) => <TabIcon icon="🌍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Sangha",
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: "Impact",
          tabBarIcon: ({ focused }) => <TabIcon icon="✨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Moi",
          tabBarIcon: ({ focused }) => <TabIcon icon="🧘" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
