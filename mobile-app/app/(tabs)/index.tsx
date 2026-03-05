import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { env } from "@/lib/env";

export default function MapScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meu Caramelo</ThemedText>
      <ThemedText type="subtitle">Sprint 1 - Foundation</ThemedText>

      <View style={styles.block}>
        <ThemedText type="defaultSemiBold">Mapa (placeholder)</ThemedText>
        <ThemedText>Map feature starts in Sprint 2.</ThemedText>
      </View>

      <View style={styles.block}>
        <ThemedText type="defaultSemiBold">Execution Mode</ThemedText>
        <ThemedText>API Mode: {env.apiMode}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  block: {
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8884",
  },
});
