import { db, handleOptions, html } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "DELETE") {
    return html("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return html("Missing id", 400);
  }

  const { error } = await db.from("sequencing_runs").delete().eq("id", id);

  if (error) {
    return html(`Delete failed: ${error.message}`, 400);
  }

  return html("");
});
