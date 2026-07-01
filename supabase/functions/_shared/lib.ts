import { createClient } from "npm:@supabase/supabase-js@2";

export type RunRow = {
  id: string;
  created_by: string | null;
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
  created_by: string | null;
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

export type ProjectRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectSampleLatestRow = {
  id: string;
  project_id: string;
  project_code: string;
  project_title: string;
  sample_name: string;
  tissue_type: string | null;
  library_type: string | null;
  source: string | null;
  latest_status: "not started" | "in progress" | "data generated" | "failed";
  latest_status_at: string | null;
};

export type SampleStatusTimelineRow = {
  id: string;
  sample_id: string;
  status: "not started" | "in progress" | "data generated" | "failed";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updater_name: string | null;
};

const url = Deno.env.get("SUPABASE_URL") || "";
const key = Deno.env.get("SUPABASE_ANON_KEY") || "";

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY secret.");
}

type AuthResult =
  | { ok: true; db: ReturnType<typeof createClient>; userId: string }
  | { ok: false; response: Response };

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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

function authHeader(req: Request): string {
  return req.headers.get("Authorization") || req.headers.get("authorization") || "";
}

function extractBearerToken(req: Request): string {
  const value = authHeader(req).trim();
  if (!value.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return value.slice(7).trim();
}

export async function requireAuth(req: Request): Promise<AuthResult> {
  const token = extractBearerToken(req);
  if (!token) {
    return { ok: false, response: html("Unauthorized", 401) };
  }

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user?.id) {
    return { ok: false, response: html("Unauthorized", 401) };
  }

  return { ok: true, db, userId: data.user.id };
}

export async function isInternalUser(db: ReturnType<typeof createClient>): Promise<boolean> {
  const { data, error } = await db.rpc("is_internal_user");
  if (error) {
    return false;
  }
  return data === true;
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

function statusCssClass(status: string): string {
  return "status-" + status.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function renderViewRow(row: RunRow) {
  const dtClass = row.data_type ? toCssClass(row.data_type) : "dt-empty";

  return `<tr id="run-${esc(row.id)}" class="data-row ${dtClass}">
    ${cell(row.run_id)}
    ${cell(row.smart_id)}
    ${cell(row.source_id)}
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

export function renderProjectNavItem(row: ProjectRow) {
  const projectCode = encodeURIComponent(row.code);
  return `<li>
    <a
      href="#"
      data-hx-get="/list-project-samples?project=${projectCode}"
      data-hx-target="#main-content"
      data-hx-swap="innerHTML"
    >${esc(row.title)}</a>
  </li>`;
}

export function renderAllSamplesNavItem() {
  return `<li>
    <a
      href="#"
      data-hx-get="/list-project-samples?project=all"
      data-hx-target="#main-content"
      data-hx-swap="innerHTML"
    >All Samples</a>
  </li>`;
}

export function renderProjectSampleItem(row: ProjectSampleLatestRow) {
  const statusClass = statusCssClass(row.latest_status);
  const statusHtml = `<button
      type="button"
      class="status-chip ${statusClass} status-trigger"
      data-hx-get="/get-sample-status-modal?sample_id=${encodeURIComponent(row.id)}"
      data-hx-target="#modal-content"
      data-hx-swap="innerHTML"
    >${esc(row.latest_status)}</button>`;

  return `<tr>
    <td>${esc(row.sample_name)}</td>
    <td>${statusHtml}</td>
    <td>${esc(row.tissue_type || "-")}</td>
    <td>${esc(row.library_type || "-")}</td>
    <td>${esc(row.source || "-")}</td>
  </tr>`;
}

export function renderProjectSamplesView(title: string, rowsHtml: string, count: number) {
  return `<div class="container">
    <h1>${esc(title)}</h1>
    <p>Showing ${esc(count)} sample${count === 1 ? "" : "s"}.</p>
    <div class="table-responsive">
      <table class="samples-table">
        <thead>
          <tr class="header">
            <th>sample</th>
            <th>latest status</th>
            <th>tissue type</th>
            <th>library type</th>
            <th>source</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;
}

function renderTimelineItem(row: SampleStatusTimelineRow) {
  const statusClass = statusCssClass(row.status);
  const updater = row.updater_name || row.created_by || "Unknown user";
  const createdAt = new Date(row.created_at).toLocaleString();

  return `<li class="timeline-item">
    <div class="timeline-header">
      <span class="status-chip ${statusClass}">${esc(row.status)}</span>
      <span class="timeline-meta">${esc(updater)} • ${esc(createdAt)}</span>
    </div>
    <p class="timeline-notes">${esc(row.notes || "No notes")}</p>
  </li>`;
}

export function renderSampleStatusModal(
  sampleName: string,
  sampleId: string,
  timelineRows: SampleStatusTimelineRow[],
  canEdit = false
) {
  const timelineHtml = timelineRows.length === 0
    ? "<p class=\"timeline-empty\">No status updates yet.</p>"
    : `<ul class="timeline-list">${timelineRows.map((row) => renderTimelineItem(row)).join("")}</ul>`;

  const formHtml = canEdit
    ? `<form
        class="status-form"
        data-hx-post="/add-sample-status-update"
        data-hx-target="#modal-content"
        data-hx-swap="innerHTML"
      >
        <input type="hidden" name="sample_id" value="${esc(sampleId)}" />
        <label for="status-select">New status</label>
        <select id="status-select" name="status" required>
          <option value="not started">not started</option>
          <option value="in progress">in progress</option>
          <option value="data generated">data generated</option>
          <option value="failed">failed</option>
        </select>
        <label for="status-notes">Notes</label>
        <textarea id="status-notes" name="notes" rows="3" placeholder="Optional context"></textarea>
        <button type="submit">Save update</button>
      </form>`
    : "<p class=\"status-readonly\">Read-only view. Internal users can add updates.</p>";

  return `<section class="modal-sheet">
    <header class="modal-header">
      <h2>Status Timeline: ${esc(sampleName)}</h2>
      <button type="button" class="modal-close" data-modal-close>Close</button>
    </header>
    <div class="modal-body">
      ${timelineHtml}
      ${formHtml}
    </div>
  </section>`;
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
          </tr>
        </thead>
        <tbody>${entriesHtml}</tbody>
      </table>
    </div>
  </div>`;
}
