import {
  handleOptions,
  html,
  isInternalUser,
  renderSampleStatusModal,
  requireAuth,
  type SampleStatusTimelineRow
} from "../_shared/lib.ts";

const allowedStatuses = new Set(["not started", "in progress", "data generated", "failed"]);

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "POST") {
    return html("Method not allowed", 405);
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  const internal = await isInternalUser(auth.db);
  if (!internal) {
    return html("<section class=\"modal-sheet\"><p>Not found.</p></section>", 404);
  }

  const formData = await req.formData();
  const sampleId = String(formData.get("sample_id") || "").trim();
  const status = String(formData.get("status") || "").trim().toLowerCase();
  const notes = String(formData.get("notes") || "").trim();

  if (!sampleId || !allowedStatuses.has(status)) {
    return html("<section class=\"modal-sheet\"><p>Invalid status update payload.</p></section>", 400);
  }

  const { error: insertError } = await auth.db
    .from("sample_status_updates")
    .insert({
      sample_id: sampleId,
      status,
      notes: notes || null
    });

  if (insertError) {
    return html(`<section class=\"modal-sheet\"><p>Failed to save status update: ${insertError.message}</p></section>`, 400);
  }

  const { data: sample, error: sampleError } = await auth.db
    .from("project_samples")
    .select("id,name")
    .eq("id", sampleId)
    .maybeSingle();

  if (sampleError || !sample) {
    return html("<section class=\"modal-sheet\"><p>Sample not found.</p></section>", 404);
  }

  const { data: updates, error: updatesError } = await auth.db
    .from("sample_status_updates")
    .select("id,sample_id,status,notes,created_by,created_at")
    .eq("sample_id", sampleId)
    .order("created_at", { ascending: false });

  if (updatesError) {
    return html("<section class=\"modal-sheet\"><p>Failed to load status timeline.</p></section>", 500);
  }

  const updaterIds = [...new Set((updates || []).map((u) => u.created_by).filter((id): id is string => !!id))];
  let profileMap: Record<string, string> = {};

  if (updaterIds.length > 0) {
    const { data: profiles } = await auth.db
      .from("user_profiles")
      .select("id,display_name")
      .in("id", updaterIds);

    profileMap = (profiles || []).reduce<Record<string, string>>((acc, row) => {
      if (row.id) {
        acc[row.id] = row.display_name || "";
      }
      return acc;
    }, {});
  }

  const timelineRows: SampleStatusTimelineRow[] = (updates || []).map((row) => ({
    id: row.id,
    sample_id: row.sample_id,
    status: row.status,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    updater_name: row.created_by ? (profileMap[row.created_by] || null) : null
  }));

  return html(renderSampleStatusModal(sample.name, sample.id, timelineRows, true));
});
