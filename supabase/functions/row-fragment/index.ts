import { db, handleOptions, html, renderEditRow, renderViewRow } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const mode = url.searchParams.get("mode") || "view";

  if (!id) {
    return html("<tr><td colspan=\"18\">Missing id.</td></tr>", 400);
  }

  const { data, error } = await db.from("samplesheet_entries").select("*").eq("id", id).single();

  if (error || !data) {
    return html("<tr><td colspan=\"18\">Row not found.</td></tr>", 404);
  }

  return html(mode === "edit" ? renderEditRow(data) : renderViewRow(data));
});
