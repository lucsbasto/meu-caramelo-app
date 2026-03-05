export const DEFAULT_REGION = {
  latitude: -10.1843,
  longitude: -48.3336,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export const STALE_HOURS = 24;
export const PROXIMITY_METERS = 2000;
const ONE_KM = 1000

export const formatDistanceMeters = (distanceMeters: number | null) => {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) {
    return "N/A";
  }

  if (distanceMeters < ONE_KM) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / ONE_KM).toFixed(1)} km`;
};

export const toDisplayDate = (isoDate: string | null) => {
  if (!isoDate) {
    return "Sem registro";
  }

  return new Date(isoDate).toLocaleString();
};

export const clusterKey = (
  latitude: number,
  longitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
) => {
  const latStep = Math.max(latitudeDelta / 10, 0.005);
  const lngStep = Math.max(longitudeDelta / 10, 0.005);

  const latBucket = Math.round(latitude / latStep);
  const lngBucket = Math.round(longitude / lngStep);
  return `${latBucket}:${lngBucket}`;
};
