import { createClient } from "npm:@supabase/supabase-js@2";

export type RunRow = {
  id: string;
  run_id: string;
  smart_id: string | null;
  data_type: string | null;
  species: string | null;
  sample_type: string | null;
  source_id: string | null;
  is_paired_end: boolean;
  read_end: number | null;
  replicate_num: number | null;
  test_or_control: string | null;
  location_id: string | null;
  disease_id: string | null;
  treatment_id: string | null;
  genetic_factors: string | null;
  sequencing_instrument: string | null;
  batch_date: string | null;
  description: string | null;
};

const url = Deno.env.get("SUPABASE_URL") || "";
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secret.");
}

export const db = createClient(url, key, {
  auth: { persistSession: false }
});

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, hx-request, hx-current-url, hx-target, hx-trigger, hx-trigger-name",
  "Cache-Control": "no-store"
};

export function handleOptions(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

export function html(body: string, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders
    }
  });
}

export function esc(value: unknown): string {
  const raw = value == null ? "" : String(value);
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fromFormNumber(input: FormDataEntryValue | null) {
  if (input == null || input === "") {
    return null;
  }
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

function fromFormText(input: FormDataEntryValue | null) {
  if (input == null) {
    return null;
  }
  const t = String(input).trim();
  return t === "" ? null : t;
}

export function parsePayload(formData: FormData) {
  const testOrControl = fromFormText(formData.get("test_or_control"));

  return {
    run_id: String(formData.get("run_id") || "").trim(),
    smart_id: fromFormText(formData.get("smart_id")),
    data_type: fromFormText(formData.get("data_type")),
    species: fromFormText(formData.get("species")),
    sample_type: fromFormText(formData.get("sample_type")),
    source_id: fromFormText(formData.get("source_id")),
    is_paired_end:
      formData.get("is_paired_end") === "on" ||
      formData.get("is_paired_end") === "true" ||
      formData.get("is_paired_end") === "1",
    read_end: fromFormNumber(formData.get("read_end")),
    replicate_num: fromFormNumber(formData.get("replicate_num")),
    test_or_control: testOrControl,
    location_id: fromFormText(formData.get("location_id")),
    disease_id: fromFormText(formData.get("disease_id")),
    treatment_id: fromFormText(formData.get("treatment_id")),
    genetic_factors: fromFormText(formData.get("genetic_factors")),
    sequencing_instrument: fromFormText(formData.get("sequencing_instrument")),
    batch_date: fromFormText(formData.get("batch_date")),
    description: fromFormText(formData.get("description"))
  };
}

export function validatePayload(payload: ReturnType<typeof parsePayload>) {
  const errors: string[] = [];
  if (!payload.run_id) {
    errors.push("run_id is required.");
  }
  if (payload.read_end != null && payload.read_end !== 1 && payload.read_end !== 2) {
    errors.push("read_end must be 1 or 2.");
  }
  if (
    payload.test_or_control != null &&
    payload.test_or_control !== "test" &&
    payload.test_or_control !== "control"
  ) {
    errors.push("test_or_control must be test or control.");
  }
  return errors;
}

function cell(v: unknown) {
  return `<td>${esc(v)}</td>`;
}

export function renderViewRow(row: RunRow) {
  return `<tr id="run-${esc(row.id)}">
    ${cell(row.run_id)}
    ${cell(row.smart_id)}
    ${cell(row.data_type)}
    ${cell(row.species)}
    ${cell(row.sample_type)}
    ${cell(row.source_id)}
    ${cell(row.is_paired_end ? "true" : "false")}
    ${cell(row.read_end)}
    ${cell(row.replicate_num)}
    ${cell(row.test_or_control)}
    ${cell(row.location_id)}
    ${cell(row.disease_id)}
    ${cell(row.treatment_id)}
    ${cell(row.genetic_factors)}
    ${cell(row.sequencing_instrument)}
    ${cell(row.batch_date)}
    ${cell(row.description)}
    <td>
      <div class="inline-actions">
        <button
          class="secondary"
          data-hx-get="/row-fragment?id=${esc(row.id)}&mode=edit"
          data-hx-target="closest tr"
          data-hx-swap="outerHTML"
          type="button"
        >Edit</button>
        <button
          class="danger"
          data-hx-delete="/delete-run?id=${esc(row.id)}"
          data-hx-confirm="Delete run ${esc(row.run_id)}?"
          data-hx-target="closest tr"
          data-hx-swap="outerHTML"
          type="button"
        >Delete</button>
      </div>
    </td>
  </tr>`;
}

function value(v: unknown) {
  return esc(v ?? "");
}

export function renderEditRow(row: RunRow, errors: string[] = []) {
  const formId = `edit-${row.id}`;
  const errorHtml = errors.length
    ? `<div class="error-box">${errors.map((e) => `<div>${esc(e)}</div>`).join("")}</div>`
    : "";

  return `<tr id="run-${esc(row.id)}">
    <td colspan="18">
      <form id="${esc(formId)}">
        <input type="hidden" name="id" value="${value(row.id)}" />
        <div class="grid">
          <label>run_id <input name="run_id" value="${value(row.run_id)}" required /></label>
          <label>smart_id <input name="smart_id" value="${value(row.smart_id)}" /></label>
          <label>data_type <input name="data_type" value="${value(row.data_type)}" /></label>
          <label>species <input name="species" value="${value(row.species)}" /></label>
          <label>sample_type <input name="sample_type" value="${value(row.sample_type)}" /></label>
          <label>source_id <input name="source_id" value="${value(row.source_id)}" /></label>
          <label>is_paired_end <input name="is_paired_end" type="checkbox" ${row.is_paired_end ? "checked" : ""} /></label>
          <label>read_end <input name="read_end" type="number" min="1" max="2" value="${value(row.read_end)}" /></label>
          <label>replicate_num <input name="replicate_num" type="number" min="0" value="${value(row.replicate_num)}" /></label>
          <label>
            test_or_control
            <select name="test_or_control">
              <option value="" ${!row.test_or_control ? "selected" : ""}>(empty)</option>
              <option value="test" ${row.test_or_control === "test" ? "selected" : ""}>test</option>
              <option value="control" ${row.test_or_control === "control" ? "selected" : ""}>control</option>
            </select>
          </label>
          <label>location_id <input name="location_id" value="${value(row.location_id)}" /></label>
          <label>disease_id <input name="disease_id" value="${value(row.disease_id)}" /></label>
          <label>treatment_id <input name="treatment_id" value="${value(row.treatment_id)}" /></label>
          <label>genetic_factors <input name="genetic_factors" value="${value(row.genetic_factors)}" /></label>
          <label>sequencing_instrument <input name="sequencing_instrument" value="${value(row.sequencing_instrument)}" /></label>
          <label>batch_date <input name="batch_date" type="date" value="${value(row.batch_date)}" /></label>
          <label class="span-2">description <textarea name="description" rows="2">${value(row.description)}</textarea></label>
        </div>
      </form>
      <div class="actions">
        <button
          data-hx-post="/update-run"
          data-hx-include="#${esc(formId)}"
          data-hx-target="closest tr"
          data-hx-swap="outerHTML"
          type="button"
        >Save</button>
        <button
          class="secondary"
          data-hx-get="/row-fragment?id=${esc(row.id)}&mode=view"
          data-hx-target="closest tr"
          data-hx-swap="outerHTML"
          type="button"
        >Cancel</button>
      </div>
      ${errorHtml}
    </td>
  </tr>`;
}

export function renderCreateErrors(errors: string[]) {
  if (!errors.length) {
    return "";
  }
  return `<div class="error-box">${errors.map((e) => `<div>${esc(e)}</div>`).join("")}</div>`;
}
