import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { COLORS } from "../../constants/brand";

type Props = ViewProps & {
  children: ReactNode;
  padding?: number;
};

export function Card({ children, padding = 20, style, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.035)",
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 20,
          padding,
        },
        style as object,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
