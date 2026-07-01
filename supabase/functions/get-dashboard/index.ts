import {
  handleOptions,
  html,
  isInternalUser,
  renderDashboardProjectCard,
  renderDashboardSamplesheetCard,
  renderDashboardView,
  requireAuth,
  type DashboardProjectRow,
  type DashboardSamplesheetRow
} from "../_shared/lib.ts";

type ProjectRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
};

type SampleCountRow = {
  project_id: string;
};

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

  const internal = await isInternalUser(auth.db);

  const { data: projects, error: projectsError } = await auth.db
    .from("projects")
    .select("id,code,title,description")
    .order("title", { ascending: true });

  if (projectsError) {
    return html(`<div class="container"><h1>Dashboard</h1><p>Failed to load projects: ${projectsError.message}</p></div>`, 500);
  }

  const projectRows = (projects || []) as ProjectRow[];
  const projectIds = projectRows.map((row) => row.id);

  let countByProject: Record<string, number> = {};
  if (projectIds.length > 0) {
    const { data: sampleRows, error: sampleCountError } = await auth.db
      .from("project_samples")
      .select("project_id")
      .in("project_id", projectIds);

    if (sampleCountError) {
      return html(`<div class="container"><h1>Dashboard</h1><p>Failed to load project counts: ${sampleCountError.message}</p></div>`, 500);
    }

    countByProject = ((sampleRows || []) as SampleCountRow[]).reduce<Record<string, number>>((acc, row) => {
      acc[row.project_id] = (acc[row.project_id] || 0) + 1;
      return acc;
    }, {});
  }

  const projectCards = projectRows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    sample_count: countByProject[row.id] || 0
  })) as DashboardProjectRow[];

  const projectCardsHtml = projectCards.length === 0
    ? ""
    : `<div class="dashboard-grid">${projectCards.map((row) => renderDashboardProjectCard(row)).join("")}</div>`;

  let samplesheetCardsHtml = "";
  if (internal) {
    const { data: samplesheets, error: samplesheetsError } = await auth.db
      .from("samplesheets")
      .select("id,project_title,submitter_name,date,filename")
      .order("created_at", { ascending: false })
      .limit(24);

    if (samplesheetsError) {
      return html(`<div class="container"><h1>Dashboard</h1><p>Failed to load samplesheets: ${samplesheetsError.message}</p></div>`, 500);
    }

    const sheetRows = (samplesheets || []) as DashboardSamplesheetRow[];
    samplesheetCardsHtml = sheetRows.length === 0
      ? ""
      : `<div class="dashboard-grid">${sheetRows.map((row) => renderDashboardSamplesheetCard(row)).join("")}</div>`;
  }

  return html(renderDashboardView(projectCardsHtml, samplesheetCardsHtml, internal));
});
