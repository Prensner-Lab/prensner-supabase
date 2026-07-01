import {
  esc,
  handleOptions,
  html,
  renderProjectSampleItem,
  renderProjectSamplesView,
  requireAuth,
  type ProjectSampleLatestRow
} from "../_shared/lib.ts";

Deno.serve(async (req: Request) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== "GET") {
    return html("Method not allowed", 405);
  }

  const auth = await requireAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(req.url);
  const projectFilter = (url.searchParams.get("project") || "all").trim();

  let query = auth.db
    .from("project_samples_latest_status")
    .select("*")
    .order("project_title", { ascending: true })
    .order("sample_name", { ascending: true });

  if (projectFilter && projectFilter !== "all") {
    query = query.eq("project_code", projectFilter);
  }

  const { data, error } = await query;

  if (error) {
    return html(
      `<div class="container"><h1>Project Samples</h1><p>Error loading samples: ${esc(error.message)}</p></div>`,
      500
    );
  }

  const rows = (data || []) as ProjectSampleLatestRow[];

  if (rows.length === 0) {
    const viewTitle = projectFilter === "all" || !projectFilter
      ? "All Samples"
      : `Project ${projectFilter}`;

    return html(
      `<div class="container"><h1>${esc(viewTitle)}</h1><p>No samples found for this view.</p></div>`
    );
  }

  const pageTitle = projectFilter === "all" || !projectFilter
    ? "All Samples"
    : rows[0].project_title;

  const rowsHtml = rows.map((row) => renderProjectSampleItem(row)).join("");

  return html(renderProjectSamplesView(pageTitle, rowsHtml, rows.length));
});
