import { db, handleOptions, html, renderViewRow } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const dataType = url.searchParams.get("data_type")?.trim();
  const species = url.searchParams.get("species")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  let query = db
    .from("samplesheet_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(`run_id.ilike.%${q}%,smart_id.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (dataType) {
    query = query.ilike("data_type", `%${dataType}%`);
  }
  if (species) {
    query = query.ilike("species", `%${species}%`);
  }

  const { data, error } = await query;

  if (error) {
    return html(`<tr><td colspan="18">Error loading rows: ${error.message}</td></tr>`, 500);
  }

  if (!data || data.length === 0) {
    return html("<tr><td colspan=\"18\">No rows found.</td></tr>");
  }

  return html(data.map((row) => renderViewRow(row)).join(""));
});
