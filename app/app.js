(function () {
  const methods = ["hx-get", "hx-post", "hx-put", "hx-delete", "hx-patch"];
  const dataMethods = methods.map((name) => "data-" + name);
  const base = (window.FUNCTIONS_BASE || "").replace(/\/$/, "");

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
      target.innerHTML =
        "<div class=\"container\"><h1>Request failed</h1><p>Check Supabase function logs.</p></div>";
    }
  }

  function getAnonKey() {
    if (typeof window === "undefined") {
      return "";
    }
    return (window.SUPABASE_ANON_KEY || "").trim();
  }

  function addSupabaseHeaders(evt) {
    const anonKey = getAnonKey();
    if (!anonKey || !evt || !evt.detail || !evt.detail.headers) {
      return;
    }
    evt.detail.headers.Authorization = "Bearer " + anonKey;
    evt.detail.headers.apikey = anonKey;
  }

  document.addEventListener("DOMContentLoaded", function () {
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

    document.body.addEventListener("htmx:responseError", onResponseError);
  });
})();
