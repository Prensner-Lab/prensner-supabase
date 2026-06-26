import { createClient } from "npm:@supabase/supabase-js@2";

export type RunRow = {
  id: string;
  samplesheet_id: string;
  run_id: string;
  smart_id: string | null;
  data_type: string | null;
  species: string | null;
  sample_type: string | null;
  source_id: string | null;
  is_paired_end: boolean;
  read_end: string | null;
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

export type SamplesheetRow = {
  id: string;
  pi_name: string | null;
  date: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  project_id: string | null;
  project_title: string;
  experiment_type: string | null;
  project_description: string | null;
  filename: string | null;
  created_at: string;
  updated_at: string;
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

function cell(v: unknown) {
  return `<td>${esc(v)}</td>`;
}

function toCssClass(dataType: string): string {
  return "dt-" + dataType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function renderViewRow(row: RunRow) {
  const dtClass = row.data_type ? toCssClass(row.data_type) : "dt-empty";
  return `<tr id="run-${esc(row.id)}" class="data-row ${dtClass}">
    ${cell(row.run_id)}
    ${cell(row.smart_id)}
    ${cell(row.source_id)}
    <td>
      <button
        class="danger"
        data-hx-delete="/delete-samplesheet-entry?id=${esc(row.id)}"
        data-hx-confirm="Delete run ${esc(row.run_id)}?"
        data-hx-target="closest tr"
        data-hx-swap="outerHTML"
        type="button"
      >Delete</button>
    </td>
  </tr>`;
}

export function renderSamplesheetNavItem(row: SamplesheetRow) {
  return `<li>
    <a
      href="#"
      data-hx-get="/get-samplesheet?id=${esc(row.id)}"
      data-hx-target="#main-content"
      data-hx-swap="innerHTML"
    >${esc(row.project_title)}</a>
  </li>`;
}

function metaLine(label: string, value: unknown) {
  return `<tr><th>${esc(label)}</th><td>${esc(value || "-")}</td></tr>`;
}

export function renderSamplesheetDetail(row: SamplesheetRow, entriesHtml: string, dataTypes: string[] = []) {
  const filterInputsHtml = [
    `<input type="radio" id="dt-filter-all" name="dt-filter" class="filter-input" checked>`
  ].concat(dataTypes.map((dt) => {
    const id = `dt-filter-${toCssClass(dt)}`;
    return `<input type="radio" id="${id}" name="dt-filter" class="filter-input">`;
  })).join("\n  ");

  const filterOptionsHtml = [
    `<label for="dt-filter-all">All</label>`
  ].concat(dataTypes.map((dt) => {
    const id = `dt-filter-${toCssClass(dt)}`;
    return `<label for="${id}">${esc(dt)}</label>`;
  })).join("\n        ");

  const filterCss = dataTypes.map((dt) => {
    const cls = toCssClass(dt);
    const id = `dt-filter-${cls}`;
    return `#${id}:checked ~ .table-responsive .samples-table tr.data-row:not(.${cls}) { display: none; }`;
  }).join("\n    ");

  return `<div class="container">
    <h1>${esc(row.project_title)}</h1>
    <div class="table-responsive">
      <table>
        <tbody>
          ${metaLine("PI name", row.pi_name)}
          ${metaLine("Date", row.date)}
          ${metaLine("Submitter name", row.submitter_name)}
          ${metaLine("Submitter email", row.submitter_email)}
          ${metaLine("Project ID", row.project_id)}
          ${metaLine("Experiment type", row.experiment_type)}
          ${metaLine("Project description", row.project_description)}
          ${metaLine("Filename", row.filename)}
        </tbody>
      </table>
    </div>
    <h1>Samples</h1>
    <style>
      .filter-input { display: none; }
      ${filterCss}
    </style>
    ${filterInputsHtml}
    <details class="filter-dropdown">
      <summary>Filter by data type</summary>
      <div class="filter-menu">
        ${filterOptionsHtml}
      </div>
    </details>
    <div class="table-responsive">
      <table class="samples-table">
        <thead>
          <tr class="header">
            <th>run_id</th>
            <th>smart_id</th>
            <th>source_id</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>${entriesHtml}</tbody>
      </table>
    </div>
  </div>`;
}
