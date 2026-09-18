(() => {
  let deferredPrompt=null;
  const installBtn=document.getElementById("vb-install-app");

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
  }
  const standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  if(!standalone){
    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault(); deferredPrompt=event;
      if(installBtn) installBtn.hidden=false;
    });
  }
  installBtn?.addEventListener("click",async()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    installBtn.hidden=true;
  });
  window.addEventListener("appinstalled",()=>{if(installBtn) installBtn.hidden=true;});

  const buttons=[...document.querySelectorAll("[data-vb-jump]")];
  buttons.forEach(btn=>btn.addEventListener("click",()=>{
    const target=document.querySelector(btn.dataset.vbJump);
    target?.scrollIntoView({behavior:"smooth",block:"start"});
  }));

  const nav=[...document.querySelectorAll(".vb-app-nav [data-vb-jump]")];
  const sections=nav.map(btn=>document.querySelector(btn.dataset.vbJump)).filter(Boolean);
  if("IntersectionObserver" in window){
    const obs=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible) return;
      nav.forEach(btn=>btn.classList.toggle("active",document.querySelector(btn.dataset.vbJump)===visible.target));
    },{rootMargin:"-20% 0px -60% 0px",threshold:[0,.05,.2]});
    sections.forEach(section=>obs.observe(section));
  }
})();