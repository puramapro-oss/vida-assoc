import { forwardRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../constants/brand";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = Omit<PressableProps, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  title: string;
  testID?: string;
};

const variants: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: COLORS.green, fg: "#041612" },
  secondary: {
    bg: "rgba(255,255,255,0.06)",
    fg: COLORS.ink,
    border: COLORS.line,
  },
  ghost: { bg: "transparent", fg: COLORS.ink, border: COLORS.line },
  danger: { bg: COLORS.danger, fg: "#FFFFFF" },
};

const sizes: Record<Size, { py: number; px: number; font: number }> = {
  sm: { py: 10, px: 14, font: 13 },
  md: { py: 14, px: 18, font: 15 },
  lg: { py: 17, px: 22, font: 16 },
};

export const Button = forwardRef<View, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    disabled,
    icon,
    title,
    onPress,
    style,
    testID,
    ...rest
  },
  ref
) {
  const v = variants[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      onPress={(e) => {
        if (isDisabled) return;
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: v.fg,
              fontSize: s.font,
              fontWeight: "600",
              letterSpacing: 0.2,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
});
