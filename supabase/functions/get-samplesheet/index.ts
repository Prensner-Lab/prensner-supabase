import {
  db,
  handleOptions,
  html,
  renderSamplesheetDetail,
  renderViewRow,
  type SamplesheetRow
} from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "GET") {
    return html("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return html("<div class=\"container\"><h1>Samplesheet</h1><p>Missing samplesheet id.</p></div>", 400);
  }

  const { data: samplesheet, error: sheetError } = await db
    .from("samplesheets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (sheetError || !samplesheet) {
    return html("<div class=\"container\"><h1>Samplesheet</h1><p>Samplesheet not found.</p></div>", 404);
  }

  const { data: entries, error: entriesError } = await db
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

  const rowsHtml = !entries || entries.length === 0
    ? "<tr><td colspan=\"4\">No entries found for this samplesheet.</td></tr>"
    : entries.map((row) => renderViewRow(row)).join("");

  return html(renderSamplesheetDetail(samplesheet as SamplesheetRow, rowsHtml, dataTypes));
});
