import { Pressable } from 'react-native';

export function Tap({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
    />
  );
}
