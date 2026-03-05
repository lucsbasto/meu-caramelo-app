import { supabase } from "@/lib/supabase";

type BBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type ViewerLocation = {
  latitude: number;
  longitude: number;
} | null;

export type FeedingPointMapItem = {
  id: string;
  name: string;
  description: string | null;
  status: "full" | "empty" | "unknown";
  latitude: number;
  longitude: number;
  updated_at: string;
  is_stale: boolean;
  distance_meters: number | null;
};

export type FeedingPointOverview = {
  id: string;
  name: string;
  description: string | null;
  status: "full" | "empty" | "unknown";
  latitude: number;
  longitude: number;
  updated_at: string;
  last_update_at: string | null;
  distinct_volunteers: number;
};

export type FeedingUpdate = {
  id: string;
  point_id: string;
  user_id: string;
  status: "full" | "empty" | "unknown";
  notes: string | null;
  created_at: string;
};

export type FeedingPhoto = {
  id: string;
  point_id: string;
  update_id: string | null;
  user_id: string;
  storage_path: string;
  validation_status: "pending" | "approved" | "suspect" | "rejected";
  validation_reason: string | null;
  validated_at: string | null;
  created_at: string;
};

type ReputationLevel = "iniciante" | "protetor" | "guardiao" | "heroi";

export type UserReputation = {
  userId: string;
  points: number;
  level: ReputationLevel;
};

export const getPointsInBBox = async (bbox: BBox, viewer: ViewerLocation) => {
  const { data, error } = await supabase.rpc("get_feeding_points_in_bbox", {
    min_lat: bbox.minLat,
    max_lat: bbox.maxLat,
    min_lng: bbox.minLng,
    max_lng: bbox.maxLng,
    viewer_lat: viewer?.latitude ?? null,
    viewer_lng: viewer?.longitude ?? null,
    stale_after_hours: 24,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as FeedingPointMapItem[];
};

export const getPointOverview = async (pointId: string) => {
  const { data, error } = await supabase.rpc("get_feeding_point_overview", {
    p_point_id: pointId,
  });

  if (error) {
    throw error;
  }

  return ((data ?? [])[0] ?? null) as FeedingPointOverview | null;
};

export const getPointUpdates = async (pointId: string) => {
  const { data, error } = await supabase
    .from("feeding_updates")
    .select("id, point_id, user_id, status, notes, created_at")
    .eq("point_id", pointId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as FeedingUpdate[];
};

export const getPointPhotos = async (pointId: string) => {
  const { data, error } = await supabase
    .from("feeding_photos")
    .select("id, point_id, update_id, user_id, storage_path, validation_status, validation_reason, validated_at, created_at")
    .eq("point_id", pointId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as FeedingPhoto[];
};

export const ensureUserId = async () => {
  const current = await supabase.auth.getUser();
  if (current.data.user?.id) {
    await supabase.rpc("ensure_public_user", { p_user_id: current.data.user.id });
    return current.data.user.id;
  }

  const signIn = await supabase.auth.signInAnonymously();
  if (signIn.error) {
    throw signIn.error;
  }

  if (!signIn.data.user?.id) {
    throw new Error("Could not create anonymous session.");
  }

  await supabase.rpc("ensure_public_user", { p_user_id: signIn.data.user.id });
  return signIn.data.user.id;
};

const toLevel = (points: number): ReputationLevel => {
  if (points >= 200) {
    return "heroi";
  }
  if (points >= 100) {
    return "guardiao";
  }
  if (points >= 30) {
    return "protetor";
  }
  return "iniciante";
};

export const getMyReputation = async (): Promise<UserReputation> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("users")
    .select("reputation_points")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  const points = data?.reputation_points ?? 0;
  return {
    userId,
    points,
    level: toLevel(points),
  };
};

export const trackEvent = async (params: {
  eventName: string;
  source?: "client" | "edge" | "system";
  pointId?: string;
  metadata?: Record<string, unknown>;
}) => {
  const userId = await ensureUserId();
  const { error } = await supabase.rpc("track_event", {
    p_event_name: params.eventName,
    p_source: params.source ?? "client",
    p_user_id: userId,
    p_point_id: params.pointId ?? null,
    p_metadata: params.metadata ?? {},
  });

  if (error) {
    throw error;
  }
};

export const uploadPointPhoto = async (pointId: string, userId: string, imageUri: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const filePath = `${pointId}/${Date.now()}-${userId}.jpg`;
  const upload = await supabase.storage.from("feeding-point-photos").upload(filePath, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (upload.error) {
    throw upload.error;
  }

  return filePath;
};

export const submitPointUpdate = async (params: {
  pointId: string;
  status: "full" | "empty" | "unknown";
  photoPath?: string;
  notes?: string;
}) => {
  const userId = await ensureUserId();

  const updateInsert = await supabase
    .from("feeding_updates")
    .insert({
      point_id: params.pointId,
      user_id: userId,
      status: params.status,
      notes: params.notes ?? null,
    })
    .select("id")
    .single();

  if (updateInsert.error) {
    throw updateInsert.error;
  }

  if (params.photoPath) {
    const photoInsert = await supabase.from("feeding_photos").insert({
      point_id: params.pointId,
      update_id: updateInsert.data.id,
      user_id: userId,
      storage_path: params.photoPath,
    }).select("id").single();

    if (photoInsert.error) {
      throw photoInsert.error;
    }

    const validationInvoke = await supabase.functions.invoke("photo-validation", {
      body: {
        photoId: photoInsert.data.id,
      },
    });

    if (validationInvoke.error) {
      try {
        await trackEvent({
          eventName: "edge_error",
          source: "client",
          pointId: params.pointId,
          metadata: {
            stage: "invoke_photo_validation",
            message: validationInvoke.error.message,
            photo_id: photoInsert.data.id,
          },
        });
      } catch {}
    }
  }

  const pointUpdate = await supabase
    .from("feeding_points")
    .update({
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.pointId);

  if (pointUpdate.error) {
    throw pointUpdate.error;
  }

  try {
    await trackEvent({
      eventName: "point_status_updated",
      pointId: params.pointId,
      metadata: {
        status: params.status,
        with_photo: Boolean(params.photoPath),
      },
    });
  } catch {}
};
