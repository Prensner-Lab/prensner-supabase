import {
  db,
  handleOptions,
  html,
  parsePayload,
  renderCreateErrors,
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
  const payload = parsePayload(formData);
  const errors = validatePayload(payload);

  if (errors.length) {
    return html(renderCreateErrors(errors), 422, {
      "HX-Retarget": "#create-errors",
      "HX-Reswap": "innerHTML"
    });
  }

  const { data, error } = await db.from("sequencing_runs").insert(payload).select("*").single();

  if (error || !data) {
    return html(renderCreateErrors([error?.message || "Insert failed"]), 400, {
      "HX-Retarget": "#create-errors",
      "HX-Reswap": "innerHTML"
    });
  }

  return html(
    `${renderViewRow(data)}<div id="create-errors" hx-swap-oob="innerHTML"></div>`
  );
});
