import { forwardRef } from "react";
import {
  TextInput,
  type TextInputProps,
  View,
  Text,
} from "react-native";
import { COLORS } from "../../constants/brand";

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  testID?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, style, testID, ...rest },
  ref
) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={COLORS.dim}
        testID={testID}
        style={[
          {
            color: COLORS.ink,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: error ? COLORS.danger : COLORS.line,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
          },
          style as object,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 2 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});
