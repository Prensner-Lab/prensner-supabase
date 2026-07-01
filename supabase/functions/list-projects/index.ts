import {
  handleOptions,
  html,
  renderAllSamplesNavItem,
  renderProjectNavItem,
  requireAuth,
  type ProjectRow
} from "../_shared/lib.ts";

Deno.serve(async (req) => {
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

  const { data, error } = await auth.db
    .from("projects")
    .select("*")
    .order("title", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return html(`<li>Error loading projects: ${error.message}</li>`, 500);
  }

  const items = [renderAllSamplesNavItem()];

  if (data && data.length > 0) {
    items.push(...(data as ProjectRow[]).map((row) => renderProjectNavItem(row)));
  }

  return html(items.join(""));
});
