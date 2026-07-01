import {
  handleOptions,
  html,
  isInternalUser,
  renderSampleStatusModal,
  requireAuth,
  type SampleStatusTimelineRow
} from "../_shared/lib.ts";

type StatusUpdateRow = {
  id: string;
  sample_id: string;
  status: "not started" | "in progress" | "data generated" | "failed";
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

type UserProfileRow = {
  id: string;
  display_name: string | null;
};

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "GET") {
    return html("Method not allowed", 405);
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  const internal = await isInternalUser(auth.db);

  const url = new URL(req.url);
  const sampleId = (url.searchParams.get("sample_id") || "").trim();
  if (!sampleId) {
    return html("<section class=\"modal-sheet\"><p>Missing sample id.</p></section>", 400);
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

  const updateRows = (updates || []) as StatusUpdateRow[];
  const updaterIds = [...new Set(updateRows.map((u: StatusUpdateRow) => u.created_by).filter((id: string | null): id is string => !!id))];
  let profileMap: Record<string, string> = {};

  if (updaterIds.length > 0) {
    const { data: profiles } = await auth.db
      .from("user_profiles")
      .select("id,display_name")
      .in("id", updaterIds);

    profileMap = ((profiles || []) as UserProfileRow[]).reduce<Record<string, string>>((acc: Record<string, string>, row: UserProfileRow) => {
      if (row.id) {
        acc[row.id] = row.display_name || "";
      }
      return acc;
    }, {});
  }

  const timelineRows: SampleStatusTimelineRow[] = updateRows.map((row: StatusUpdateRow) => ({
    id: row.id,
    sample_id: row.sample_id,
    status: row.status,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    updater_name: row.created_by ? (profileMap[row.created_by] || null) : null
  }));

  return html(renderSampleStatusModal(sample.name, sample.id, timelineRows, internal));
});
