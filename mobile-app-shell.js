(() => {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  document.documentElement.classList.toggle("app-standalone", standalone);

  // Keep the active bottom-nav item correct even when pages are reached via history.
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".bottom-nav .nav-item").forEach(link => {
    const href = (link.getAttribute("href") || "").split("?")[0].split("#")[0].toLowerCase();
    link.classList.toggle("active", href === current);
  });

  // Make explicit "back" controls behave like an app when the previous page is inside My Center.
  document.querySelectorAll(".back a").forEach(link => {
    link.addEventListener("click", event => {
      if (!standalone || !document.referrer) return;
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && history.length > 1) {
          event.preventDefault();
          history.back();
        }
      } catch (_) {}
    });
  });

  // Short branded splash only when opening the installed app, once per session.
  if (standalone && !sessionStorage.getItem("my-center-splash-shown")) {
    sessionStorage.setItem("my-center-splash-shown", "1");
    const splash = document.createElement("div");
    splash.className = "app-splash";
    splash.setAttribute("aria-hidden", "true");
    splash.innerHTML = `
      <div class="app-splash-mark">
        <img src="app-icon.svg" alt="">
        <strong>המרכז שלי</strong>
        <span>העולם שלי במקום אחד</span>
      </div>`;
    document.body.appendChild(splash);
    requestAnimationFrame(() => splash.classList.add("show"));
    setTimeout(() => splash.classList.add("hide"), 650);
    setTimeout(() => splash.remove(), 1050);
  }
})();