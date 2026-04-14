import type { ReactNode } from "react";
import { ScrollView, View, type ViewStyle, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../constants/brand";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padding?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboardShouldPersist?: boolean;
};

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  padding = 20,
  style,
  contentStyle,
  keyboardShouldPersist,
}: Props) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[{ flex: 1, backgroundColor: COLORS.bg }, style]}
    >
      <StatusBar style="light" />
      <Body
        keyboardShouldPersistTaps={keyboardShouldPersist ? "handled" : "never"}
        contentContainerStyle={
          scroll
            ? [
                {
                  paddingHorizontal: padding,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 110,
                  gap: 16,
                },
                contentStyle,
              ]
            : undefined
        }
        style={
          scroll
            ? undefined
            : [
                {
                  flex: 1,
                  paddingHorizontal: padding,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 110,
                },
                contentStyle as object,
              ]
        }
        refreshControl={
          scroll && onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.green}
            />
          ) : undefined
        }
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}
