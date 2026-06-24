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
    const target = document.getElementById("create-errors");
    if (target) {
      target.innerHTML =
        "<div class=\"error-box\">Request failed. Check Supabase function logs.</div>";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireAttributes(document);
    if (window.htmx) {
      window.htmx.process(document.body);
    }
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
