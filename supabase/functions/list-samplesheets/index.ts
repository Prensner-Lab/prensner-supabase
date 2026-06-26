import { db, handleOptions, html, renderSamplesheetNavItem, type SamplesheetRow } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "GET") {
    return html("Method not allowed", 405);
  }

  const { data, error } = await db
    .from("samplesheets")
    .select("*")
    .order("project_title", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return html(`<li>Error loading samplesheets: ${error.message}</li>`, 500);
  }

  if (!data || data.length === 0) {
    return html("<li>No samplesheets yet.</li>");
  }

  return html((data as SamplesheetRow[]).map((row) => renderSamplesheetNavItem(row)).join(""));
});
