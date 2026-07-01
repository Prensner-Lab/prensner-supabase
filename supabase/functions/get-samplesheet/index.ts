import {
  handleOptions,
  html,
  isInternalUser,
  requireAuth,
  type RunRow,
  renderSamplesheetDetail,
  renderViewRow,
  type SamplesheetRow
} from "../_shared/lib.ts";

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
  if (!internal) {
    return html("<div class=\"container\"><h1>Samplesheet</h1><p>Samplesheet not found.</p></div>", 404);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return html("<div class=\"container\"><h1>Samplesheet</h1><p>Missing samplesheet id.</p></div>", 400);
  }

  const { data: samplesheet, error: sheetError } = await auth.db
    .from("samplesheets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (sheetError || !samplesheet) {
    return html("<div class=\"container\"><h1>Samplesheet</h1><p>Samplesheet not found.</p></div>", 404);
  }

  const { data: entries, error: entriesError } = await auth.db
    .from("samplesheet_entries")
    .select("*")
    .eq("samplesheet_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (entriesError) {
    return html(`<div class=\"container\"><h1>${samplesheet.project_title}</h1><p>Error loading entries: ${entriesError.message}</p></div>`, 500);
  }

  const dataTypes: string[] = [...new Set<string>(
    (entries || []).map((e: { data_type: string | null }) => e.data_type).filter((dt: string | null): dt is string => dt != null)
  )];

  const entryRows = (entries || []) as RunRow[];

  const rowsHtml = entryRows.length === 0
    ? "<tr><td colspan=\"3\">No entries found for this samplesheet.</td></tr>"
    : entryRows.map((row: RunRow) => renderViewRow(row)).join("");

  return html(renderSamplesheetDetail(samplesheet as SamplesheetRow, rowsHtml, dataTypes));
});
