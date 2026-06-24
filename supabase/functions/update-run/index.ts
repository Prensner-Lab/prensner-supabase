import {
  db,
  handleOptions,
  html,
  parsePayload,
  renderEditRow,
  renderViewRow,
  validatePayload
} from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "POST") {
    return html("Method not allowed", 405);
  }

  const formData = await req.formData();
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    return html("<tr><td colspan=\"18\">Missing id.</td></tr>", 400);
  }

  const payload = parsePayload(formData);
  const errors = validatePayload(payload);

  if (errors.length) {
    const current = {
      id,
      ...payload
    };
    return html(renderEditRow(current, errors), 422);
  }

  const { data, error } = await db
    .from("sequencing_runs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    const current = {
      id,
      ...payload
    };
    return html(renderEditRow(current, [error?.message || "Update failed"]), 400);
  }

  return html(renderViewRow(data));
});
