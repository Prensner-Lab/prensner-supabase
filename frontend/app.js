(function () {
  const methods = ["hx-get", "hx-post", "hx-put", "hx-patch"];
  const dataMethods = methods.map((name) => "data-" + name);
  const base = (window.FUNCTIONS_BASE || "").replace(/\/$/, "");
  const supabaseUrl = (window.SUPABASE_URL || "").trim();
  const publishableKey = (window.SUPABASE_PUBLISHABLE_KEY || "").trim();
  let lastProjectSamplesPath = expand("/list-project-samples?project=all");
  let accessToken = "";
  let client = null;

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

  function setStatus(message) {
    const status = document.getElementById("auth-status");
    if (status) {
      status.textContent = message;
    }
  }

  function resetNav() {
    const samplesheetNav = document.getElementById("samplesheet-nav");
    if (samplesheetNav) {
      samplesheetNav.innerHTML = "<li>Sign in to load samplesheets.</li>";
    }

    const projectNav = document.getElementById("project-nav");
    if (projectNav) {
      projectNav.innerHTML = "<li>Sign in to load projects.</li>";
    }
  }

  function signedOutMessage() {
    if (document.getElementById("project-nav")) {
      return "<div class=\"container\"><h1>Project Sample Tracking</h1><p>Sign in to view project samples.</p></div>";
    }
    return "<div class=\"container\"><h1>Welcome to the lab!</h1><p>Sign in to view samplesheets.</p></div>";
  }

  function updateAuthUi(user) {
    const form = document.getElementById("auth-form");
    const logout = document.getElementById("logout-btn");
    if (!form || !logout) {
      return;
    }

    if (user) {
      form.hidden = true;
      logout.hidden = false;
      setStatus("Signed in as " + user.email);
      if (window.htmx) {
        window.htmx.trigger(document.body, "refresh-samplesheets");
        window.htmx.trigger(document.body, "refresh-projects");
      }
    } else {
      form.hidden = false;
      logout.hidden = true;
      setStatus("Sign in with your invited account.");
      resetNav();
      const main = document.getElementById("main-content");
      if (main) {
        main.innerHTML = signedOutMessage();
      }
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
  }

  async function restoreSession() {
    if (!client) {
      return;
    }
    const { data } = await client.auth.getSession();
    accessToken = data.session?.access_token || "";
    updateAuthUi(data.session?.user || null);
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

    if (client) {
      client.auth.onAuthStateChange(function (_event, session) {
        accessToken = session?.access_token || "";
        updateAuthUi(session?.user || null);
      });
    }

    restoreSession();
  });
})();
