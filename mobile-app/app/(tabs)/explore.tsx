import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { supabase } from "@/lib/supabase";

const checkHealth = async () => {
  const { data, error } = await supabase.from("feeding_points").select("id").limit(1);
  if (error) {
    throw error;
  }
  return data;
};

export default function FoundationScreen() {
  const health = useQuery({
    queryKey: ["foundation-health"],
    queryFn: checkHealth,
    retry: false,
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Foundation Status</ThemedText>
      <View style={styles.block}>
        <ThemedText type="defaultSemiBold">Supabase/DB Connectivity</ThemedText>
        {health.isPending && <ThemedText>Checking...</ThemedText>}
        {health.isSuccess && <ThemedText>Connected</ThemedText>}
        {health.isError && <ThemedText>Not connected ({String(health.error.message)})</ThemedText>}
      </View>
      <View style={styles.block}>
        <ThemedText type="defaultSemiBold">Ready for Sprint 2</ThemedText>
        <ThemedText>Schema and policies are prepared in migrations.</ThemedText>
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
