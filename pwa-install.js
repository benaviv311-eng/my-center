(() => {
  const installButton = document.getElementById("install-app-btn");
  let deferredPrompt = null;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
        await registration.update();
      } catch (error) {
        console.warn("Service worker registration failed:", error);
      }
    });
  }

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone && installButton) installButton.hidden = true;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.hidden = true;
    });
  }

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    if (installButton) installButton.hidden = true;
  });
})();