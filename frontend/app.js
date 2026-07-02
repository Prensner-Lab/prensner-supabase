(function () {
  const methods = ["hx-get", "hx-post", "hx-put", "hx-patch"];
  const dataMethods = methods.map((name) => "data-" + name);
  const base = (window.FUNCTIONS_BASE || "").replace(/\/$/, "");
  const supabaseUrl = (window.SUPABASE_URL || "").trim();
  const publishableKey = (window.SUPABASE_PUBLISHABLE_KEY || "").trim();
  const recentCap = 12;
  let lastProjectSamplesPath = expand("/list-project-samples?project_id=all");
  let recentItems = [];
  let accessToken = "";
  let client = null;
  let dashboardLoaded = false;

  function expand(path) {
    if (!path || /^https?:\/\//.test(path)) {
      return path;
    }
    return base + path;
  }

  function wireAttributes(root) {
    dataMethods.forEach((attr) => {
      root.querySelectorAll("[" + attr + "]").forEach((el) => {
        const htmxAttr = attr.slice(5);
        const raw = el.getAttribute(attr);
        el.setAttribute(htmxAttr, expand(raw));
      });
    });
  }

  function onResponseError() {
    const target = document.getElementById("main-content");
    if (target) {
      target.innerHTML = "<div class=\"container\"><h1>Request failed</h1><p>Check Supabase function logs.</p></div>";
    }
  }

  function openModal() {
    const modal = document.getElementById("status-modal");
    if (modal) {
      modal.hidden = false;
    }
  }

  function closeModal() {
    const modal = document.getElementById("status-modal");
    const content = document.getElementById("modal-content");
    if (modal) {
      modal.hidden = true;
    }
    if (content) {
      content.innerHTML = "";
    }
  }

  function refreshProjectSamples() {
    if (!window.htmx || !lastProjectSamplesPath) {
      return;
    }
    window.htmx.ajax("GET", lastProjectSamplesPath, {
      target: "#main-content",
      swap: "innerHTML"
    });
  }

  function escapeHtml(value) {
    const raw = value == null ? "" : String(value);
    return raw
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function loadDashboard(force) {
    if (!window.htmx) {
      return;
    }
    if (!force && dashboardLoaded) {
      return;
    }

    dashboardLoaded = true;
    window.htmx.ajax("GET", expand("/get-dashboard"), {
      target: "#main-content",
      swap: "innerHTML"
    });
  }

  function setStatus(message) {
    const status = document.getElementById("auth-status");
    if (status) {
      status.textContent = message;
    }
  }

  function renderRecentNav() {
    const recentNav = document.getElementById("recent-nav");
    if (!recentNav) {
      return;
    }

    if (recentItems.length === 0) {
      recentNav.innerHTML = "<li>No recent items yet.</li>";
      return;
    }

    recentNav.innerHTML = recentItems.map((item, index) => {
      const activeClass = index === 0 ? "active" : "";
      return `<li>
        <a
          href="#"
          class="${activeClass}"
          data-hx-get="${escapeHtml(item.path)}"
          data-hx-target="#main-content"
          data-hx-swap="innerHTML"
          data-recent-key="${escapeHtml(item.key)}"
          data-recent-type="${escapeHtml(item.type)}"
          data-recent-label="${escapeHtml(item.label)}"
          data-recent-path="${escapeHtml(item.path)}"
        >${escapeHtml(item.label)}</a>
      </li>`;
    }).join("");

    wireAttributes(recentNav);
    if (window.htmx) {
      window.htmx.process(recentNav);
    }
  }

  function addRecentItem(item) {
    if (!item || !item.key || !item.path || !item.label) {
      return;
    }

    recentItems = recentItems.filter((existing) => existing.key !== item.key);
    recentItems.unshift(item);
    if (recentItems.length > recentCap) {
      recentItems = recentItems.slice(0, recentCap);
    }

    renderRecentNav();
  }

  function maybeTrackRecentFromElement(el) {
    if (!(el instanceof HTMLElement)) {
      return;
    }

    const key = (el.getAttribute("data-recent-key") || "").trim();
    const label = (el.getAttribute("data-recent-label") || "").trim();
    const path = (el.getAttribute("data-recent-path") || el.getAttribute("data-hx-get") || "").trim();
    const type = (el.getAttribute("data-recent-type") || "item").trim();
    if (!key || !label || !path) {
      return;
    }

    addRecentItem({ key, label, path, type });
  }

  function signedOutMessage() {
    return "<div class=\"container\"><h1>Welcome to the lab!</h1><p>Sign in to get started.</p></div>";
  }

  function updateAuthUi(user) {
    const form = document.getElementById("auth-form");
    const logout = document.getElementById("logout-btn");
    const dashboardBtn = document.getElementById("dashboard-btn");
    const recentSection = document.getElementById("recent-section");
    if (!form || !logout || !dashboardBtn || !recentSection) {
      return;
    }

    if (user) {
      form.hidden = true;
      logout.hidden = false;
      dashboardBtn.hidden = false;
      recentSection.hidden = false;
      setStatus("Signed in as " + user.email);
      renderRecentNav();
    } else {
      form.hidden = false;
      logout.hidden = true;
      dashboardBtn.hidden = true;
      recentSection.hidden = true;
      dashboardLoaded = false;
      setStatus("Contact the Prensner lab to be invited to make an account.");
      recentItems = [];
      const recentNav = document.getElementById("recent-nav");
      if (recentNav) {
        recentNav.innerHTML = "";
      }
      const main = document.getElementById("main-content");
      if (main) {
        main.innerHTML = signedOutMessage();
      }
      closeModal();
    }
  }

  function initSupabase() {
    if (!supabaseUrl || !publishableKey || !window.supabase || !window.supabase.createClient) {
      setStatus("Missing Supabase configuration.");
      return null;
    }

    return window.supabase.createClient(supabaseUrl, publishableKey);
  }

  function addSupabaseHeaders(evt) {
    if (!publishableKey || !accessToken || !evt || !evt.detail || !evt.detail.headers) {
      return;
    }
    evt.detail.headers.Authorization = "Bearer " + accessToken;
    evt.detail.headers.apikey = publishableKey;
  }

  async function signInWithPassword(email, password) {
    if (!client) {
      return;
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("Sign in failed: " + error.message);
      return;
    }

    accessToken = data.session?.access_token || "";
    updateAuthUi(data.user || null);
    loadDashboard(true);
  }

  async function restoreSession() {
    if (!client) {
      return;
    }
    const { data } = await client.auth.getSession();
    accessToken = data.session?.access_token || "";
    updateAuthUi(data.session?.user || null);
    if (data.session?.user) {
      loadDashboard(true);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    client = initSupabase();
    wireAttributes(document);
    if (window.htmx) {
      window.htmx.process(document.body);
    }

    document.body.addEventListener("htmx:configRequest", addSupabaseHeaders);
    document.body.addEventListener("htmx:beforeRequest", function (evt) {
      const path = evt && evt.detail && typeof evt.detail.path === "string" ? evt.detail.path : "";
      if (path.includes("/list-project-samples")) {
        lastProjectSamplesPath = path;
      }

      const elt = evt && evt.detail ? evt.detail.elt : null;
      maybeTrackRecentFromElement(elt);
    });

    document.body.addEventListener("htmx:afterRequest", function (evt) {
      const pathInfo = evt && evt.detail ? evt.detail.pathInfo : null;
      const requestPath = pathInfo && typeof pathInfo.requestPath === "string"
        ? pathInfo.requestPath
        : (evt && evt.detail && typeof evt.detail.path === "string" ? evt.detail.path : "");
      const xhr = evt && evt.detail ? evt.detail.xhr : null;
      const ok = !!(xhr && xhr.status >= 200 && xhr.status < 300);

      if (ok && requestPath.includes("/add-sample-status-update")) {
        refreshProjectSamples();
      }
    });

    document.body.addEventListener("htmx:afterSwap", function (evt) {
      if (evt.target) {
        wireAttributes(evt.target);
        if (window.htmx) {
          window.htmx.process(evt.target);
        }
        if (evt.target.id === "modal-content") {
          openModal();
        }
      }
    });

    document.body.addEventListener("htmx:responseError", function (evt) {
      const targetId = evt && evt.detail && evt.detail.target ? evt.detail.target.id : "";
      const status = evt && evt.detail && evt.detail.xhr ? evt.detail.xhr.status : 0;
      if (status === 401) {
        setStatus("Session expired. Sign in again.");
      } else if (status === 403) {
        setStatus("You can only modify your own records.");
      } else if (status === 404) {
        setStatus("Resource not found.");
      }
      onResponseError();
    });

    document.body.addEventListener("click", function (evt) {
      const target = evt.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.closest("[data-modal-close]")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (evt) {
      if (evt.key === "Escape") {
        closeModal();
      }
    });

    const authForm = document.getElementById("auth-form");
    if (authForm) {
      authForm.addEventListener("submit", async function (evt) {
        evt.preventDefault();
        const email = document.getElementById("auth-email")?.value?.trim() || "";
        const password = document.getElementById("auth-password")?.value || "";
        if (!email || !password) {
          return;
        }
        await signInWithPassword(email, password);
      });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async function () {
        if (!client) {
          return;
        }
        await client.auth.signOut();
        accessToken = "";
        updateAuthUi(null);
      });
    }

    const dashboardBtn = document.getElementById("dashboard-btn");
    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", function () {
        loadDashboard(true);
      });
    }

    if (client) {
      client.auth.onAuthStateChange(function (eventName, session) {
        accessToken = session?.access_token || "";
        updateAuthUi(session?.user || null);
        if (eventName === "SIGNED_IN" && session?.user) {
          loadDashboard(true);
        }
      });
    }

    restoreSession();
  });
})();
