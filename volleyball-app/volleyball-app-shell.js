(() => {
  let deferredPrompt=null;
  const installBtn=document.getElementById("vb-install-app");
  const populationTabs=document.getElementById("volleyball-population-tabs");
  const populationBadge=document.getElementById("volleyball-current-population-badge");
  const populationMenuToggle=document.getElementById("volleyball-population-menu-toggle");
  const populationMenu=document.getElementById("volleyball-population-menu");
  const populationMenuCurrent=document.getElementById("volleyball-population-menu-current");
  const topicPanel=document.getElementById("volleyball-population-topics");
  const topicMenuToggle=document.getElementById("volleyball-topic-menu-toggle");
  const topicMenu=document.getElementById("volleyball-topic-menu");
  const topicMenuCurrent=document.getElementById("volleyball-topic-menu-current");
  const sideLeft=document.getElementById("vb-side-left");
  const sideRight=document.getElementById("vb-side-right");

  const wcFile=name=>'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(name);
  const VB_ELITE_SIDE_GALLERIES={
    women:{
      athletes:[
        {player:'Zehra Güneş',kind:'indoor',poses:[
          wcFile('Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (7).jpg'),
          wcFile('Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (8).jpg'),
          wcFile('Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (9).jpg'),
          wcFile('Zehra Güneş 18 VakıfBank SK 20250409 (4).jpg'),
          wcFile('Zehra Güneş 2018 01.jpg'),
          wcFile('Zehra Güneş, 2024.jpg')
        ]},
        {player:'Hande Baladın',kind:'indoor',poses:[
          wcFile('Hande Baladın 7 Eczacıbaşı SK WV 20250409 (1).jpg'),
          wcFile('Hande Baladın 7 Eczacıbaşı SK WV 20250409 (2).jpg'),
          wcFile('Hande Baladın 7 Eczacıbaşı SK WV 20250409 (3).jpg'),
          wcFile('Hande Baladın 7 Eczacıbaşı SK WV 20250409 (4).jpg'),
          wcFile('Hande Baladın 7 Eczacıbaşı SK WV 20250409 (5).jpg'),
          wcFile('Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (3).jpg'),
          wcFile('Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (4).jpg'),
          wcFile('Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (5).jpg'),
          wcFile('Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (6).jpg')
        ]},
        {player:'Ebrar Karakurt',kind:'indoor',poses:[
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (1).jpg'),
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (2).jpg'),
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (3).jpg'),
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (4).jpg'),
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (5).jpg'),
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (6).jpg'),
          wcFile('Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (7).jpg')
        ]},
        {player:'April Ross',kind:'beach',poses:[
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3477 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3478 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3501 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3506 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3509 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3652 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3688 LR by Stepro.jpg'),
          wcFile('2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3716 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0332 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0381 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0385 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0493 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0513 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0514 LR by Stepro.jpg'),
          wcFile('2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0520 LR by Stepro.jpg'),
          wcFile('AVP Professional Beach Volleyball in Austin, Texas (2017-05-19) (35430860896).jpg'),
          wcFile('AVP Professional Beach Volleyball in Austin, Texas (2017-05-21) (35358759342).jpg'),
          wcFile('AVP Professional Beach Volleyball in Austin, Texas (2017-05-19) (35340419471).jpg'),
          wcFile('April Ross at the AVP Austin Open 2017.jpg'),
          wcFile('April Ross at the AVP Austin Open 2017 (2).jpg')
        ]},
        {player:'Ágatha Bednarczuk',kind:'beach',poses:[
          wcFile('Paf Open 2012 Ágatha Bednarczuk.jpg'),
          wcFile('Paf Open 2012 Ágatha Bednarczuk (cropped).jpg'),
          wcFile('Agatha Bednarczuk.jpg')
        ]},
        {player:'Kira Walkenhorst',kind:'beach',poses:[
          wcFile('20220816 European Championships Munich 2022 Kira Walkenhorst DSC 6702.jpg'),
          wcFile('20220817 European Championships Munich 2022 Kira Walkenhorst 850 7321.jpg'),
          wcFile('20220817 European Championships Munich 2022 Kira Walkenhorst 850 7358.jpg'),
          wcFile('Kira Walkenhorst (GER) 2017.jpg'),
          wcFile('Kira Walkenhorst Rio 2016 (cropped).jpg'),
          wcFile('Kira Walkenhorst Smart Beach Tour 2017.jpg'),
          wcFile('Kira-Walkenhorst-Münster2012.jpg'),
          wcFile('GermanysKiraWalkenhorstblockswhileEgyptsNadaMeawadbumps.jpg')
        ]},
        {player:'Laura Ludwig',kind:'beach',poses:[
          wcFile('Grand Slam Moscow 2011, Set 1 - 075.jpg'),
          wcFile('Grand Slam Moscow 2011, Set 1 - 080.jpg'),
          wcFile('Grand Slam Moscow 2011, Set 1 - 085.jpg'),
          wcFile('Grand Slam Moscow 2012, Set 1 - 009.jpg'),
          wcFile('Grand Slam Moscow 2012, Set 1 - 015.jpg'),
          wcFile('Grand Slam Moscow 2012, Set 1 - 029.jpg'),
          wcFile('Laura Ludwig (GER) Rio 2016.jpg'),
          wcFile('Laura Ludwig GERxBRA Rio2016 A.jpg'),
          wcFile('Laura Ludwig GERxBRA Rio2016 B.jpg'),
          wcFile('LauraLudwig Muenster2013.jpg')
        ]}
      ]
    },
    men:{
      athletes:[{player:'Wilfredo León',kind:'indoor',poses:[
        wcFile('20240701 Wilfredo Leon.jpg'),
        wcFile('At Katowice 2024 266.jpg'),
        wcFile('Paris Volley - Zenith Kazan, CEV Champions League, 15 February 2017 - 22.jpg'),
        wcFile('Wilfredo Leon Venero (Legavolley 2019).jpg'),
        wcFile('Wilfredo Leon Venero.jpg'),
        wcFile("Zenit Kazan vs Halkbank - CEV Men's Volleyball Champions League (23547482665).jpg")
      ]}]
    }
  };
  VB_ELITE_SIDE_GALLERIES['youth-girls']=VB_ELITE_SIDE_GALLERIES.women;
  VB_ELITE_SIDE_GALLERIES.elementary=VB_ELITE_SIDE_GALLERIES.women;
  VB_ELITE_SIDE_GALLERIES['youth-boys']=VB_ELITE_SIDE_GALLERIES.men;
  VB_ELITE_SIDE_GALLERIES.all=VB_ELITE_SIDE_GALLERIES.women;

  const populationKeyFromLabel=label=>{
    const t=(label||'').trim();
    if(t.includes('יסודי'))return 'elementary';
    if(t.includes('נוער בנות'))return 'youth-girls';
    if(t.includes('נוער בנים'))return 'youth-boys';
    if(t.includes('נשים'))return 'women';
    if(t.includes('גברים'))return 'men';
    return 'all';
  };
  const visualSessionSeed=Math.floor(Date.now()/1000);
  let backgroundRotationTick=0;
  const setEliteSideBackgrounds=()=>{
    if(!sideLeft||!sideRight)return;
    const active=populationTabs?.querySelector('.vb-pop-tab.active');
    const key=populationKeyFromLabel(active?.textContent||'');
    const gallery=VB_ELITE_SIDE_GALLERIES[key]||VB_ELITE_SIDE_GALLERIES.all;
    const athletes=gallery.athletes||[];
    if(!athletes.length)return;
    const seed=new Date().getDate()+new Date().getMonth()*31+(key.length*7)+visualSessionSeed+backgroundRotationTick;
    const athlete=athletes[seed%athletes.length];
    const poses=athlete.poses||[];
    if(poses.length<2)return;
    const base=(seed*3)%poses.length;
    const right=(base+Math.max(1,Math.floor(poses.length/2)))%poses.length;
    sideLeft.classList.add('vb-side-bg-changing');
    sideRight.classList.add('vb-side-bg-changing');
    setTimeout(()=>{
      sideLeft.style.backgroundImage=`url("${poses[base]}")`;
      sideRight.style.backgroundImage=`url("${poses[right]}")`;
      requestAnimationFrame(()=>{
        sideLeft.classList.remove('vb-side-bg-changing');
        sideRight.classList.remove('vb-side-bg-changing');
      });
    },160);
    sideLeft.dataset.player=athlete.player;
    sideRight.dataset.player=athlete.player;
    sideLeft.dataset.kind=athlete.kind||'indoor';
    sideRight.dataset.kind=athlete.kind||'indoor';
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

  const closeTopicMenu=()=>{
    if(!topicMenu||!topicMenuToggle)return;
    topicMenu.hidden=true;
    topicMenuToggle.setAttribute("aria-expanded","false");
  };
  const buildTopicMenu=()=>{
    if(!topicPanel||!topicMenu)return;
    const buttons=[...topicPanel.querySelectorAll("[data-topic]")];
    if(!buttons.length)return;
    topicMenu.innerHTML=buttons.map(btn=>{
      const icon=btn.querySelector("span")?.textContent?.trim()||"•";
      const label=btn.textContent.trim().replace(icon,"").trim();
      const active=btn.classList.contains("active");
      return `<button type="button" role="menuitemradio" aria-checked="${active}" class="${active?"active":""}" data-topic-menu="${btn.dataset.topic}"><span>${icon}</span><b>${label}</b></button>`;
    }).join("");
  };
  const syncTopicContext=()=>{
    const active=topicPanel?.querySelector(".vb-topic-tab.active");
    if(!active)return;
    const icon=active.querySelector("span")?.textContent?.trim()||"🏐";
    const label=active.textContent.trim().replace(icon,"").trim();
    if(topicMenuCurrent)topicMenuCurrent.textContent=icon+" "+label;
    topicMenu?.querySelectorAll("[data-topic-menu]").forEach(btn=>{
      const selected=btn.dataset.topicMenu===active.dataset.topic;
      btn.classList.toggle("active",selected);
      btn.setAttribute("aria-checked",String(selected));
    });
  };
  topicMenuToggle?.addEventListener("click",()=>{
    if(!topicMenu)return;
    const open=topicMenu.hidden;
    topicMenu.hidden=!open;
    topicMenuToggle.setAttribute("aria-expanded",String(open));
  });
  topicMenu?.addEventListener("click",event=>{
    const choice=event.target.closest("[data-topic-menu]");
    if(!choice)return;
    const controller=topicPanel?.querySelector(`[data-topic="${choice.dataset.topicMenu}"]`);
    controller?.click();
    closeTopicMenu();
  });
  if(topicPanel){
    const topicObserver=new MutationObserver(()=>{buildTopicMenu();syncTopicContext();});
    topicObserver.observe(topicPanel,{subtree:true,attributes:true,attributeFilter:["class","aria-pressed"],childList:true});
    setTimeout(()=>{buildTopicMenu();syncTopicContext();},0);
  }

  const closePopulationMenu=()=>{
    if(!populationMenu||!populationMenuToggle)return;
    populationMenu.hidden=true;
    populationMenuToggle.setAttribute("aria-expanded","false");
  };
  const buildPopulationMenu=()=>{
    if(!populationTabs||!populationMenu)return;
    const buttons=[...populationTabs.querySelectorAll("[data-population]")];
    if(!buttons.length)return;
    populationMenu.innerHTML=buttons.map(btn=>{
      const icon=btn.querySelector("span")?.textContent?.trim()||"🏐";
      const label=btn.textContent.trim().replace(icon,"").trim();
      const active=btn.classList.contains("active");
      return `<button type="button" role="menuitemradio" aria-checked="${active}" class="${active?"active":""}" data-population-menu="${btn.dataset.population}"><span>${icon}</span><b>${label}</b></button>`;
    }).join("");
  };
  const syncPopulationContext=()=>{
    const active=populationTabs?.querySelector(".vb-pop-tab.active");
    if(!active)return;
    const icon=active.querySelector("span")?.textContent?.trim()||"🏐";
    const label=active.textContent.trim().replace(icon,"").trim();
    if(populationBadge) populationBadge.textContent="עכשיו: "+label;
    if(populationMenuCurrent) populationMenuCurrent.textContent=icon+" "+label;
    if(populationMenu){
      populationMenu.querySelectorAll("[data-population-menu]").forEach(btn=>{
        const selected=btn.dataset.populationMenu===active.dataset.population;
        btn.classList.toggle("active",selected);
        btn.setAttribute("aria-checked",String(selected));
      });
    }
  };
  populationMenuToggle?.addEventListener("click",()=>{
    if(!populationMenu)return;
    const open=populationMenu.hidden;
    populationMenu.hidden=!open;
    populationMenuToggle.setAttribute("aria-expanded",String(open));
  });
  populationMenu?.addEventListener("click",event=>{
    const choice=event.target.closest("[data-population-menu]");
    if(!choice)return;
    const controller=populationTabs?.querySelector(`[data-population="${choice.dataset.populationMenu}"]`);
    controller?.click();
    closePopulationMenu();
  });
  document.addEventListener("click",event=>{
    if(populationMenu?.hidden)return;
    if(event.target.closest(".vb-population-dropdown"))return;
    closePopulationMenu();
  });
  document.addEventListener("click",event=>{
    if(topicMenu?.hidden)return;
    if(event.target.closest(".vb-topic-dropdown"))return;
    closeTopicMenu();
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){closePopulationMenu();closeTopicMenu();}
  });
  populationTabs?.addEventListener("click",()=>setTimeout(()=>{backgroundRotationTick++;syncPopulationContext();setEliteSideBackgrounds();},0));
  if(populationTabs){
    const popObserver=new MutationObserver(()=>{
      buildPopulationMenu();
      syncPopulationContext();
      setEliteSideBackgrounds();
    });
    popObserver.observe(populationTabs,{subtree:true,attributes:true,attributeFilter:["class","aria-pressed"],childList:true});
    setTimeout(()=>{buildPopulationMenu();syncPopulationContext();setEliteSideBackgrounds();},0);
  }

  const rotateEliteBackgrounds=()=>{
    backgroundRotationTick++;
    setEliteSideBackgrounds();
  };
  window.setInterval(()=>{
    if(!document.hidden)rotateEliteBackgrounds();
  },12000);
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden)rotateEliteBackgrounds();
  });

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