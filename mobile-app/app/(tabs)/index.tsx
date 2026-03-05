import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

import { PointDetailsSheet } from "@/components/point-details-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import {
  ensureUserId,
  getPointOverview,
  getPointPhotos,
  getPointsInBBox,
  getPointUpdates,
  type FeedingPointMapItem,
  submitPointUpdate,
  uploadPointPhoto,
} from "@/lib/feeding-points";
import { clusterKey, DEFAULT_REGION, formatDistanceMeters, PROXIMITY_METERS } from "@/lib/geo";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Cluster =
  | {
      type: "cluster";
      id: string;
      count: number;
      latitude: number;
      longitude: number;
      points: FeedingPointMapItem[];
    }
  | {
      type: "point";
      point: FeedingPointMapItem;
    };

const getBBox = (region: Region) => ({
  minLat: region.latitude - region.latitudeDelta / 2,
  maxLat: region.latitude + region.latitudeDelta / 2,
  minLng: region.longitude - region.longitudeDelta / 2,
  maxLng: region.longitude + region.longitudeDelta / 2,
});

const clusterPoints = (points: FeedingPointMapItem[], region: Region): Cluster[] => {
  const buckets = new Map<string, FeedingPointMapItem[]>();

  for (const point of points) {
    const key = clusterKey(point.latitude, point.longitude, region.latitudeDelta, region.longitudeDelta);
    buckets.set(key, [...(buckets.get(key) ?? []), point]);
  }

  return [...buckets.entries()].map(([key, members]) => {
    if (members.length === 1) {
      return { type: "point", point: members[0] };
    }

    const latitude = members.reduce((sum, member) => sum + member.latitude, 0) / members.length;
    const longitude = members.reduce((sum, member) => sum + member.longitude, 0) / members.length;

    return {
      type: "cluster",
      id: key,
      count: members.length,
      latitude,
      longitude,
      points: members,
    };
  });
};

export default function MapScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationDenied, setLocationDenied] = useState(false);
  const [viewer, setViewer] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<"full" | "empty" | "unknown" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationQuery = useQuery({
    queryKey: ["viewer-location"],
    queryFn: async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationDenied(true);
        return null;
      }

      const current = await Location.getCurrentPositionAsync({});
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setViewer(next);
      setRegion((prev) => ({ ...prev, ...next }));
      return next;
    },
    staleTime: Infinity,
  });

  const pointsQuery = useQuery({
    queryKey: ["map-points", Math.round(region.latitude * 1000), Math.round(region.longitude * 1000), Math.round(region.latitudeDelta * 1000), Math.round(region.longitudeDelta * 1000), viewer?.latitude, viewer?.longitude],
    queryFn: async () => getPointsInBBox(getBBox(region), viewer),
  });

  const points = pointsQuery.data ?? [];
  const visiblePoints = showNearbyOnly
    ? points.filter((point) => point.distance_meters != null && point.distance_meters <= PROXIMITY_METERS)
    : points;
  const selectedPoint = visiblePoints.find((point) => point.id === selectedPointId) ?? null;
  const clusters = useMemo(() => clusterPoints(visiblePoints, region), [visiblePoints, region]);

  const overviewQuery = useQuery({
    queryKey: ["point-overview", selectedPointId],
    queryFn: async () => getPointOverview(selectedPointId as string),
    enabled: Boolean(selectedPointId),
  });

  const updatesQuery = useQuery({
    queryKey: ["point-updates", selectedPointId],
    queryFn: async () => getPointUpdates(selectedPointId as string),
    enabled: Boolean(selectedPointId),
  });

  const photosQuery = useQuery({
    queryKey: ["point-photos", selectedPointId],
    queryFn: async () => getPointPhotos(selectedPointId as string),
    enabled: Boolean(selectedPointId),
  });

  const statusColor = (status: "full" | "empty" | "unknown", isStale: boolean) => {
    if (isStale) {
      return palette.statusStale;
    }
    if (status === "full") {
      return palette.statusFull;
    }
    if (status === "empty") {
      return palette.statusEmpty;
    }
    return palette.statusUnknown;
  };

  const submitAction = async (status: "full" | "empty", requirePhoto: boolean) => {
    if (!selectedPoint) {
      return;
    }

    setActionError(null);
    setOptimisticStatus(status);
    setIsSubmitting(true);

    let photoPath: string | undefined;

    try {
      if (requirePhoto) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          throw new Error("Permissao da camera negada.");
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
        });

        if (result.canceled || !result.assets[0]?.uri) {
          throw new Error("Foto obrigatoria para confirmar abastecimento.");
        }

        const userId = await ensureUserId();
        photoPath = await uploadPointPhoto(selectedPoint.id, userId, result.assets[0].uri);
      }

      await submitPointUpdate({
        pointId: selectedPoint.id,
        status,
        photoPath,
      });

      await Promise.all([
        pointsQuery.refetch(),
        overviewQuery.refetch(),
        updatesQuery.refetch(),
        photosQuery.refetch(),
      ]);
      setOptimisticStatus(null);
    } catch (error) {
      setOptimisticStatus(null);
      setActionError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Mapa de Pontos</ThemedText>
        <ThemedText>
          {locationDenied ? "Localizacao negada - modo manual ativo" : "Localizacao ativa"}
        </ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowNearbyOnly((current) => !current)}
        >
          <ThemedText>
            {showNearbyOnly ? "Mostrando ate 2km" : "Mostrar apenas ate 2km"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {Platform.OS === "web" ? (
        <View style={styles.webFallback}>
          <ThemedText type="defaultSemiBold">Modo web: lista de pontos por viewport</ThemedText>
          <ScrollView contentContainerStyle={styles.pointList}>
            {visiblePoints.map((point) => (
              <TouchableOpacity key={point.id} style={styles.pointCard} onPress={() => setSelectedPointId(point.id)}>
                <ThemedText>{point.name}</ThemedText>
                <ThemedText>
                  {point.status} | {formatDistanceMeters(point.distance_meters)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={Boolean(locationQuery.data)}
          showsMyLocationButton
        >
          {clusters.map((cluster) => {
            if (cluster.type === "cluster") {
              return (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                  pinColor={palette.statusStale}
                  title={`${cluster.count} pontos`}
                  description="Toque para aproximar"
                  onPress={() =>
                    setRegion((current) => ({
                      ...current,
                      latitude: cluster.latitude,
                      longitude: cluster.longitude,
                      latitudeDelta: Math.max(current.latitudeDelta / 2, 0.01),
                      longitudeDelta: Math.max(current.longitudeDelta / 2, 0.01),
                    }))
                  }
                />
              );
            }

            return (
              <Marker
                key={cluster.point.id}
                coordinate={{ latitude: cluster.point.latitude, longitude: cluster.point.longitude }}
                pinColor={statusColor(cluster.point.status, cluster.point.is_stale)}
                title={cluster.point.name}
                description={`${cluster.point.status} | ${formatDistanceMeters(cluster.point.distance_meters)}`}
                onPress={() => {
                  setActionError(null);
                  setOptimisticStatus(null);
                  setSelectedPointId(cluster.point.id);
                }}
              />
            );
          })}
        </MapView>
      )}

      <View style={styles.footerInfo}>
        <ThemedText>Pontos visiveis: {visiblePoints.length}</ThemedText>
        <ThemedText>
          {pointsQuery.isFetching ? "Atualizando mapa..." : "Mapa atualizado"}
        </ThemedText>
      </View>

      <Modal visible={Boolean(selectedPoint)} animationType="slide" transparent onRequestClose={() => setSelectedPointId(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPointId(null)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            {selectedPoint ? (
              <PointDetailsSheet
                point={selectedPoint}
                overview={overviewQuery.data ?? null}
                photos={photosQuery.data ?? []}
                updates={updatesQuery.data ?? []}
                optimisticStatus={optimisticStatus}
                isSubmitting={isSubmitting}
                actionError={actionError}
                onMarkFull={() => submitAction("full", true)}
                onMarkEmpty={() => submitAction("empty", false)}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    gap: 10,
  },
  header: {
    gap: 6,
  },
  filterButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#8884",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  footerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "75%",
  },
  webFallback: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#8884",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  pointList: {
    gap: 8,
  },
  pointCard: {
    borderWidth: 1,
    borderColor: "#8884",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
});
