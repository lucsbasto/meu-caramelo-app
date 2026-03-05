import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type {
  FeedingPhoto,
  FeedingPointMapItem,
  FeedingPointOverview,
  FeedingUpdate,
  UserReputation,
} from "@/lib/feeding-points";
import { formatDistanceMeters, toDisplayDate } from "@/lib/geo";
import { supabase } from "@/lib/supabase";

type Props = {
  point: FeedingPointMapItem;
  overview: FeedingPointOverview | null;
  photos: FeedingPhoto[];
  updates: FeedingUpdate[];
  optimisticStatus: "full" | "empty" | "unknown" | null;
  myReputation: UserReputation | null;
  isSubmitting: boolean;
  actionError: string | null;
  onMarkFull: () => void;
  onMarkEmpty: () => void;
};

const getPhotoPublicUrl = (storagePath: string) =>
  supabase.storage.from("feeding-point-photos").getPublicUrl(storagePath).data.publicUrl;

export function PointDetailsSheet({
  point,
  overview,
  photos,
  updates,
  optimisticStatus,
  myReputation,
  isSubmitting,
  actionError,
  onMarkFull,
  onMarkEmpty,
}: Props) {
  const effectiveStatus = optimisticStatus ?? point.status;

  const openDirections = async () => {
    const destination = `${point.latitude},${point.longitude}`;
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    await Linking.openURL(googleUrl);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">{point.name}</ThemedText>
        <ThemedText>
          {effectiveStatus} | {formatDistanceMeters(point.distance_meters)}
        </ThemedText>
        <ThemedText>Atualizado: {toDisplayDate(overview?.last_update_at ?? point.updated_at)}</ThemedText>
        <ThemedText>Voluntarios: {overview?.distinct_volunteers ?? 0}</ThemedText>
        <ThemedText>
          Minha reputacao: {myReputation?.points ?? 0} ({myReputation?.level ?? "iniciante"})
        </ThemedText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
        {photos.length === 0 ? (
          <View style={styles.emptyPhoto}>
            <ThemedText>Sem fotos ainda.</ThemedText>
          </View>
        ) : (
          photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: getPhotoPublicUrl(photo.storage_path) }} style={styles.photo} contentFit="cover" />
              <ThemedText style={styles.metaText}>{toDisplayDate(photo.created_at)}</ThemedText>
              <ThemedText style={styles.metaText}>Usuario: {photo.user_id.slice(0, 8)}</ThemedText>
              <ThemedText style={styles.metaText}>
                Validacao: {photo.validation_status}
                {photo.validation_reason ? ` (${photo.validation_reason})` : ""}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={onMarkFull} disabled={isSubmitting}>
          <ThemedText style={styles.buttonText}>Abasteci aqui</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onMarkEmpty} disabled={isSubmitting}>
          <ThemedText style={styles.buttonText}>Recipiente vazio</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostButton} onPress={openDirections}>
          <ThemedText>Como chegar</ThemedText>
        </TouchableOpacity>
      </View>

      {actionError ? <ThemedText style={styles.errorText}>{actionError}</ThemedText> : null}

      <View style={styles.timeline}>
        <ThemedText type="defaultSemiBold">Historico</ThemedText>
        {updates.length === 0 ? (
          <ThemedText>Sem historico para este ponto.</ThemedText>
        ) : (
          updates.map((item) => (
            <View key={item.id} style={styles.timelineItem}>
              <ThemedText>{item.status}</ThemedText>
              <ThemedText>{toDisplayDate(item.created_at)}</ThemedText>
              <ThemedText>Usuario: {item.user_id.slice(0, 8)}</ThemedText>
            </View>
          ))
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "#8884",
  },
  header: {
    gap: 4,
  },
  photoRow: {
    gap: 10,
  },
  photoCard: {
    width: 180,
    gap: 4,
  },
  photo: {
    width: 180,
    height: 110,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  metaText: {
    fontSize: 12,
  },
  emptyPhoto: {
    width: 180,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8884",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#2f9e44",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#d9480f",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: "#8884",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
  },
  errorText: {
    color: "#c92a2a",
  },
  timeline: {
    gap: 8,
  },
  timelineItem: {
    borderWidth: 1,
    borderColor: "#8884",
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
});
