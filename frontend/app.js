(function () {
  const methods = ["hx-get", "hx-post", "hx-put", "hx-patch"];
  const dataMethods = methods.map((name) => "data-" + name);
  const base = (window.FUNCTIONS_BASE || "").replace(/\/$/, "");
  const supabaseUrl = (window.SUPABASE_URL || "").trim();
  const publishableKey = (window.SUPABASE_PUBLISHABLE_KEY || "").trim();
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

  function setStatus(message) {
    const status = document.getElementById("auth-status");
    if (status) {
      status.textContent = message;
    }
  }

  function resetNav() {
    const nav = document.getElementById("samplesheet-nav");
    if (nav) {
      nav.innerHTML = "<li>Sign in to load samplesheets.</li>";
    }
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
      }
    } else {
      form.hidden = false;
      logout.hidden = true;
      setStatus("Sign in with your invited account.");
      resetNav();
      const main = document.getElementById("main-content");
      if (main) {
        main.innerHTML = "<div class=\"container\"><h1>Welcome to the lab!</h1><p>Sign in to view samplesheets.</p></div>";
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
    document.body.addEventListener("htmx:afterSwap", function (evt) {
      if (evt.target) {
        wireAttributes(evt.target);
        if (window.htmx) {
          window.htmx.process(evt.target);
        }
      }
    });

    document.body.addEventListener("htmx:responseError", function (evt) {
      const status = evt && evt.detail && evt.detail.xhr ? evt.detail.xhr.status : 0;
      if (status === 401) {
        setStatus("Session expired. Sign in again.");
      } else if (status === 403) {
        setStatus("You can only modify your own records.");
      }
      onResponseError();
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
