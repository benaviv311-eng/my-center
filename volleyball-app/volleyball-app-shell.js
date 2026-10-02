(() => {
  let deferredPrompt=null;
  const installBtn=document.getElementById("vb-install-app");
  const populationTabs=document.getElementById("volleyball-population-tabs");
  const populationBadge=document.getElementById("volleyball-current-population-badge");
  const sideLeft=document.getElementById("vb-side-left");
  const sideRight=document.getElementById("vb-side-right");

  const wcFile=name=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(name);
  const VB_ELITE_SIDE_GALLERIES={
    women:{
      player:'Zehra Güneş',
      poses:[
        wcFile('Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (7).jpg'),
        wcFile('Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (8).jpg'),
        wcFile('Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (9).jpg'),
        wcFile('Zehra Güneş 18 VakıfBank SK 20250409 (4).jpg'),
        wcFile('Zehra Güneş 2018 01.jpg'),
        wcFile('Zehra Güneş, 2024.jpg')
      ]
    },
    men:{
      player:'Wilfredo León',
      poses:[
        wcFile('20240701 Wilfredo Leon.jpg'),
        wcFile('At Katowice 2024 266.jpg'),
        wcFile('Paris Volley - Zenith Kazan, CEV Champions League, 15 February 2017 - 22.jpg'),
        wcFile('Wilfredo Leon Venero (Legavolley 2019).jpg'),
        wcFile('Wilfredo Leon Venero.jpg'),
        wcFile("Zenit Kazan vs Halkbank - CEV Men's Volleyball Champions League (23547482665).jpg")
      ]
    }
  };
  VB_ELITE_SIDE_GALLERIES['youth-girls']=VB_ELITE_SIDE_GALLERIES.women;
  VB_ELITE_SIDE_GALLERIES.elementary=VB_ELITE_SIDE_GALLERIES.women;
  VB_ELITE_SIDE_GALLERIES['youth-boys']=VB_ELITE_SIDE_GALLERIES.men;
  VB_ELITE_SIDE_GALLERIES.all=VB_ELITE_SIDE_GALLERIES.men;

  const populationKeyFromLabel=label=>{
    const t=(label||'').trim();
    if(t.includes('יסודי'))return 'elementary';
    if(t.includes('נוער בנות'))return 'youth-girls';
    if(t.includes('נוער בנים'))return 'youth-boys';
    if(t.includes('נשים'))return 'women';
    if(t.includes('גברים'))return 'men';
    return 'all';
  };
  const setEliteSideBackgrounds=()=>{
    if(!sideLeft||!sideRight)return;
    const active=populationTabs?.querySelector('.vb-pop-tab.active');
    const key=populationKeyFromLabel(active?.textContent||'');
    const gallery=VB_ELITE_SIDE_GALLERIES[key]||VB_ELITE_SIDE_GALLERIES.all;
    const poses=gallery.poses||[];
    if(poses.length<2)return;
    const base=(new Date().getDate()+new Date().getMonth()*31)%poses.length;
    const right=(base+Math.max(1,Math.floor(poses.length/2)))%poses.length;
    sideLeft.style.backgroundImage=`url("${poses[base]}")`;
    sideRight.style.backgroundImage=`url("${poses[right]}")`;
    sideLeft.dataset.player=gallery.player;
    sideRight.dataset.player=gallery.player;
  };

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

  const syncPopulationContext=()=>{
    const active=populationTabs?.querySelector(".vb-pop-tab.active");
    if(!active)return;
    const label=active.textContent.trim().replace(/^🏐|^👦|^👧|^👩|^👨/,"").trim();
    if(populationBadge) populationBadge.textContent="עכשיו: "+label;
    active.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  };
  populationTabs?.addEventListener("click",()=>setTimeout(()=>{syncPopulationContext();setEliteSideBackgrounds();},0));
  if(populationTabs){
    const popObserver=new MutationObserver(()=>{syncPopulationContext();setEliteSideBackgrounds();});
    popObserver.observe(populationTabs,{subtree:true,attributes:true,attributeFilter:["class","aria-pressed"],childList:true});
    setTimeout(()=>{syncPopulationContext();setEliteSideBackgrounds();},0);
  }

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