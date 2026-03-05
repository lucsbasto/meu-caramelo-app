import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

type ValidationDecision = 'approved' | 'suspect' | 'rejected';

type ValidationResult = {
  decision: ValidationDecision;
  confidence: number;
  reason: string;
  provider: string;
  rawResponse: Record<string, unknown>;
};

const toResult = (
  decision: ValidationDecision,
  confidence: number,
  reason: string,
  provider = 'heuristic-v1',
  rawResponse: Record<string, unknown> = {},
): ValidationResult => ({
  decision,
  confidence,
  reason,
  provider,
  rawResponse,
});

const classifyPhoto = (storagePath: string): ValidationResult => {
  const normalized = storagePath.toLowerCase();

  if (normalized.includes('reject') || normalized.includes('spam')) {
    return toResult('rejected', 0.96, 'Path heuristic flagged content as invalid.');
  }

  if (normalized.includes('suspect') || normalized.includes('blur')) {
    return toResult('suspect', 0.63, 'Image needs manual moderation review.');
  }

  return toResult('approved', 0.84, 'Image accepted by baseline heuristic.');
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Missing Supabase service credentials.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let payload: { photoId?: string };
  try {
    payload = (await req.json()) as { photoId?: string };
  } catch {
    return json(400, { error: 'Invalid JSON payload.' });
  }

  if (!payload.photoId) {
    return json(400, { error: 'photoId is required.' });
  }

  const photoQuery = await supabase
    .from('feeding_photos')
    .select(
      `
      id,
      point_id,
      update_id,
      user_id,
      storage_path,
      validation_status,
      feeding_updates (
        status
      )
    `,
    )
    .eq('id', payload.photoId)
    .single();

  if (photoQuery.error || !photoQuery.data) {
    return json(404, { error: 'Photo not found.' });
  }

  if (photoQuery.data.validation_status !== 'pending') {
    return json(200, {
      photoId: photoQuery.data.id,
      status: photoQuery.data.validation_status,
      skipped: true,
    });
  }

  const validation = classifyPhoto(photoQuery.data.storage_path);
  const nowIso = new Date().toISOString();

  const updatePhoto = await supabase
    .from('feeding_photos')
    .update({
      validation_status: validation.decision,
      validation_reason: validation.reason,
      validated_at: nowIso,
    })
    .eq('id', photoQuery.data.id);

  if (updatePhoto.error) {
    await supabase.rpc('track_event', {
      p_event_name: 'edge_error',
      p_source: 'edge',
      p_user_id: photoQuery.data.user_id,
      p_point_id: photoQuery.data.point_id,
      p_metadata: {
        stage: 'update_photo_validation',
        message: updatePhoto.error.message,
        photo_id: photoQuery.data.id,
      },
    });
    return json(500, { error: 'Unable to persist validation status.' });
  }

  const updateStatus = Array.isArray(photoQuery.data.feeding_updates)
    ? photoQuery.data.feeding_updates[0]?.status
    : (photoQuery.data.feeding_updates as { status?: 'full' | 'empty' | 'unknown' } | null)?.status;

  if (validation.decision === 'approved' && updateStatus) {
    const updatePoint = await supabase
      .from('feeding_points')
      .update({
        status: updateStatus,
        updated_at: nowIso,
      })
      .eq('id', photoQuery.data.point_id);

    if (updatePoint.error) {
      await supabase.rpc('track_event', {
        p_event_name: 'edge_error',
        p_source: 'edge',
        p_user_id: photoQuery.data.user_id,
        p_point_id: photoQuery.data.point_id,
        p_metadata: {
          stage: 'update_point_status',
          message: updatePoint.error.message,
          photo_id: photoQuery.data.id,
        },
      });
      return json(500, { error: 'Unable to update point status from approved photo.' });
    }
  }

  const auditInsert = await supabase.from('photo_validation_audit_logs').insert({
    photo_id: photoQuery.data.id,
    point_id: photoQuery.data.point_id,
    update_id: photoQuery.data.update_id,
    user_id: photoQuery.data.user_id,
    decision: validation.decision,
    confidence: validation.confidence,
    reason: validation.reason,
    provider: validation.provider,
    raw_response: validation.rawResponse,
  });

  if (auditInsert.error) {
    await supabase.rpc('track_event', {
      p_event_name: 'edge_error',
      p_source: 'edge',
      p_user_id: photoQuery.data.user_id,
      p_point_id: photoQuery.data.point_id,
      p_metadata: {
        stage: 'audit_insert',
        message: auditInsert.error.message,
        photo_id: photoQuery.data.id,
      },
    });
    return json(500, { error: 'Unable to write validation audit log.' });
  }

  await supabase.rpc('track_event', {
    p_event_name: 'photo_validation_processed',
    p_source: 'edge',
    p_user_id: photoQuery.data.user_id,
    p_point_id: photoQuery.data.point_id,
    p_metadata: {
      photo_id: photoQuery.data.id,
      decision: validation.decision,
      confidence: validation.confidence,
      provider: validation.provider,
    },
  });

  return json(200, {
    photoId: photoQuery.data.id,
    pointId: photoQuery.data.point_id,
    decision: validation.decision,
    confidence: validation.confidence,
    reason: validation.reason,
  });
});
