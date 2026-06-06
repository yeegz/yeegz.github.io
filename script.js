(function(){
  const D=document, root=D.documentElement;
  const rmq=matchMedia('(prefers-reduced-motion: reduce)');
  let reduce=rmq.matches;
  const fine=matchMedia('(pointer: fine)').matches;
  const hasGSAP=typeof gsap!=='undefined';
  const page=D.getElementById('page');
  let lenis=null;

  const now=new Date();
  const p2=n=>String(n).padStart(2,'0');
  const yEl=D.getElementById('yr'); if(yEl) yEl.textContent=now.getFullYear();
  const stamp=D.getElementById('stamp'); if(stamp) stamp.textContent=p2(now.getDate())+'-'+p2(now.getMonth()+1)+'-'+String(now.getFullYear()).slice(2);

  (function localClock(){
    const el=D.getElementById('localTime'); if(!el) return;
    const upd=()=>{ try{ el.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kuala_Lumpur'}).format(new Date()); }catch(e){} };
    upd(); setInterval(upd,30000);
  })();

  try{ console.log('%c ysf.slm ','background:#3DE1FF;color:#06141A;font-weight:bold;padding:2px 4px');
       console.log('%c~∿∿∿  signal acquired — peek at the source, it\'s hand-wired.','color:#3DE1FF'); }catch(e){}

  const SKILLS=['FLUTTER','DART','REACT NATIVE','TYPESCRIPT','JAVASCRIPT','PYTHON','HTML / CSS','GDSCRIPT','NODE.JS','REST APIS','SUPABASE','FIREBASE','POSTGRESQL','TAILWIND','GIT / GITHUB','XCODE','FIGMA','GODOT','AI-ASSISTED'];
  const tt=SKILLS.join(' &nbsp;·&nbsp; ')+' &nbsp;·&nbsp; ';
  const t1=D.getElementById('tear1'), t2=D.getElementById('tear2');
  if(t1) t1.innerHTML=(tt).repeat(6); if(t2) t2.innerHTML=(tt).repeat(6);

  function wavePath(w,h,amp,freq,phase){
    const mid=h/2, step=6; let d='M0,'+mid;
    for(let x=0;x<=w;x+=step){ d+=' L'+x+','+(mid+Math.sin(x*freq+phase)*amp).toFixed(2); }
    return d;
  }
  const busPath=D.querySelector('#signalbus path'); if(busPath) busPath.setAttribute('d', wavePath(1200,30,6,0.03,0));
  const basePath=D.querySelector('#reelBase path'); if(basePath) basePath.setAttribute('d', wavePath(1600,30,5,0.025,1.5));
  const menuBus=D.querySelector('.menu-bus path'); if(menuBus) menuBus.setAttribute('d', wavePath(1200,30,5,0.03,0.8));

  D.querySelectorAll('[data-ink]').forEach(el=>{
    const svg=`<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1,7 C18,3 34,8 50,5 C66,2 82,7 99,4"/></svg>`;
    el.insertAdjacentHTML('beforeend', svg);
  });

  // ---------- shared helpers (work with or without GSAP) ----------
  function scrollTo(id){
    const el=D.querySelector(id); if(!el) return;
    if(lenis){ lenis.scrollTo(id,{offset:0,onComplete:()=>focusTarget(el)}); }
    else { el.scrollIntoView({behavior:reduce?'auto':'smooth'}); focusTarget(el); }
  }
  function focusTarget(el){ try{ el.focus({preventScroll:true}); }catch(e){ try{el.focus();}catch(_){} } }

  function setupMenu(){
    const toggle=D.getElementById('navToggle'), menu=D.getElementById('menu'); if(!toggle||!menu) return;
    let open=false, lastFocus=null;
    const focusables=()=>Array.from(menu.querySelectorAll('a[href],button:not([disabled])')).filter(el=>el.offsetParent!==null);
    function setOpen(v){
      open=v; menu.classList.toggle('open',v); menu.setAttribute('aria-hidden',String(!v));
      toggle.setAttribute('aria-expanded',String(v)); toggle.setAttribute('aria-label', v?'Close menu':'Open menu');
      toggle.classList.toggle('is-open',v);
      const ntl=toggle.querySelector('.nt-label'); if(ntl) ntl.textContent = v?'Close':'Index';
      if(v){ lastFocus=D.activeElement; if(lenis)lenis.stop(); else root.style.overflow='hidden';
        const f=focusables()[0]; if(f) f.focus(); }
      else { if(lenis)lenis.start(); else root.style.overflow=''; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
    }
    toggle.addEventListener('click',()=>setOpen(!open));
    menu.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault(); const id=a.getAttribute('href'); setOpen(false); setTimeout(()=>scrollTo(id),140);
    }));
    menu.querySelectorAll('a:not([href^="#"])').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
    D.addEventListener('keydown',e=>{
      if(!open) return;
      if(e.key==='Escape'){ setOpen(false); return; }
      if(e.key==='Tab'){ const f=focusables(); if(!f.length) return; const first=f[0], last=f[f.length-1];
        if(e.shiftKey && D.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && D.activeElement===last){ e.preventDefault(); first.focus(); } }
    });
    return setOpen;
  }

  function setupCopyEmail(){
    const btn=D.getElementById('copyEmail'); if(!btn) return;
    const label=btn.querySelector('.ce-label'); const email=btn.getAttribute('data-email'); const orig=label.textContent;
    btn.addEventListener('click',async ()=>{
      let ok=false;
      try{ await navigator.clipboard.writeText(email); ok=true; }
      catch(e){ try{ const ta=D.createElement('textarea'); ta.value=email; ta.style.position='fixed'; ta.style.opacity='0';
        D.body.appendChild(ta); ta.focus(); ta.select(); ok=D.execCommand('copy'); D.body.removeChild(ta); }catch(_){ } }
      btn.classList.add('copied'); label.textContent = ok ? 'Copied ✓' : email;
      const fl=D.getElementById('flash'); if(fl && hasGSAP && !reduce) gsap.fromTo(fl,{opacity:0},{opacity:.1,duration:.08,yoyo:true,repeat:1});
      clearTimeout(btn._t); btn._t=setTimeout(()=>{ btn.classList.remove('copied'); label.textContent=orig; },1800);
    });
  }

  // ---------- no-GSAP / no-JS-libs fallback ----------
  if(!hasGSAP){
    D.querySelectorAll('[data-reveal]').forEach(e=>e.style.opacity=1);
    D.querySelectorAll('.line-inner').forEach(e=>e.style.transform='none');
    D.querySelectorAll('[data-scramble]').forEach(e=>e.textContent=e.getAttribute('data-scramble'));
    const pl=D.getElementById('preloader'); if(pl) pl.style.display='none';
    setupMenu(); setupCopyEmail();
    const nd=D.getElementById('navDot'); if(nd) nd.addEventListener('click',()=>scrollTo('#contact'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const EASE='power4.out';

  D.querySelectorAll('[data-reveal="lines"]').forEach(h=>{
    if(h.id) h.setAttribute('aria-label', h.textContent.replace(/\s+/g,' ').trim());
    const parts=h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML=parts.map(p=>`<span class="line-mask"><span class="line-inner">${p}</span></span>`).join('');
  });

  if(!reduce && typeof Lenis!=='undefined'){
    lenis=new Lenis({duration:1.1, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t=>lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  // in-page anchors (outside the mobile menu, which has its own handler)
  D.querySelectorAll('a[href^="#"]').forEach(a=>{ if(a.closest('.menu')) return;
    a.addEventListener('click',e=>{ const id=a.getAttribute('href'); if(id.length>1){ e.preventDefault(); scrollTo(id); } });
  });
  const goContact=()=>scrollTo('#contact');

  const setMenuOpen=setupMenu();
  setupCopyEmail();

  // ---------- magnetic cursor ----------
  const dot=D.getElementById('cursorDot');
  const proxyL={x:innerWidth/2,y:innerHeight/2};
  if(fine && !reduce){
    const setMX=gsap.quickSetter(root,'--mx','px'), setMY=gsap.quickSetter(root,'--my','px');
    const lx=gsap.quickTo(proxyL,'x',{duration:.45,ease:'power3'}), ly=gsap.quickTo(proxyL,'y',{duration:.45,ease:'power3'});
    const dx=gsap.quickTo(dot,'x',{duration:.07,ease:'power3'}), dy=gsap.quickTo(dot,'y',{duration:.07,ease:'power3'});
    gsap.ticker.add(()=>{ setMX(proxyL.x); setMY(proxyL.y); });
    addEventListener('pointermove',e=>{ lx(e.clientX);ly(e.clientY);dx(e.clientX);dy(e.clientY); dot.classList.add('on'); },{passive:true});
    addEventListener('pointerout',e=>{ if(!e.relatedTarget){dot.classList.remove('on');} });
    D.querySelectorAll('[data-magnetic]').forEach(el=>{
      const inner=el.querySelector('.lbl')||el.querySelector('.txt');
      const xT=gsap.quickTo(el,'x',{duration:.6,ease:'power3'}), yT=gsap.quickTo(el,'y',{duration:.6,ease:'power3'});
      const ixT=inner&&gsap.quickTo(inner,'x',{duration:.6,ease:'power3'}), iyT=inner&&gsap.quickTo(inner,'y',{duration:.6,ease:'power3'});
      el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect(); const mx=e.clientX-(r.left+r.width/2),my=e.clientY-(r.top+r.height/2); xT(mx*.3);yT(my*.3); if(inner){ixT(mx*.16);iyT(my*.16);} });
      el.addEventListener('pointerleave',()=>{ gsap.to(inner?[el,inner]:el,{x:0,y:0,duration:.8,ease:'elastic.out(1,0.4)'}); });
    });
  }

  const CH='ABCDEFGHJKLMNPQRSTUVWXYZ!@#$%&/<>{}0123456789∿';
  function scramble(el, text, dur){
    dur=dur||900; const len=text.length; let start=null;
    el.classList.add('scrambling');
    function tick(t){ if(start===null)start=t; const p=Math.min((t-start)/dur,1); const rev=Math.floor(p*len*1.18); let o='';
      for(let i=0;i<len;i++){ const c=text[i]; if(c===' '){o+=' ';continue;} o+= i<rev?c:CH[(Math.random()*CH.length)|0]; }
      el.textContent=o;
      if(p<1) requestAnimationFrame(tick); else { el.textContent=text; el.classList.remove('scrambling'); }
    } requestAnimationFrame(tick);
  }

  // ---------- oscilloscope canvas (idle-aware) ----------
  function scope(canvas, opts){
    if(!canvas) return null;
    const ctx=canvas.getContext('2d'); const dpr=Math.min(devicePixelRatio||1,2);
    let W,H;
    function size(){ W=canvas.width=Math.max(1,Math.round(canvas.clientWidth*dpr)); H=canvas.height=Math.max(1,Math.round(canvas.clientHeight*dpr)); }
    size();
    let amp=opts.amp||7, freq=opts.freq||.06, t=0, locked=0, running=true, paused=false, rafId=0;
    function drawStatic(){ ctx.clearRect(0,0,W,H); const mid=H/2; ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(W,mid);
      ctx.strokeStyle='rgba(61,225,255,.5)'; ctx.lineWidth=1.5*dpr; ctx.stroke(); }
    function frame(){
      rafId=0; if(!running||paused) return;
      if(D.hidden){ rafId=requestAnimationFrame(frame); return; }
      t+=0.05; ctx.clearRect(0,0,W,H);
      const mid=H/2;
      const a = locked>0 ? amp*(1-locked) : amp*dpr;
      ctx.beginPath(); ctx.moveTo(0,mid);
      for(let x=0;x<=W;x+=2*dpr){ ctx.lineTo(x, mid + Math.sin(x*freq/dpr + t)*a); }
      ctx.strokeStyle='#3DE1FF'; ctx.lineWidth=1.5*dpr; ctx.shadowBlur=15*dpr; ctx.shadowColor='rgba(61,225,255,.95)'; ctx.stroke(); ctx.shadowBlur=0;
      if(locked>0){ ctx.beginPath(); ctx.arc(W*0.5,mid,2.5*dpr,0,7); ctx.fillStyle='#3DE1FF'; ctx.fill(); }
      rafId=requestAnimationFrame(frame);
    }
    function start(){ if(!running||paused||rafId) return; rafId=requestAnimationFrame(frame); }
    const api={
      bend(dist){ const m=gsap.utils.mapRange(0,600,9,2,Math.min(dist,600)); amp=m*dpr; freq=gsap.utils.mapRange(0,600,.18,.08,Math.min(dist,600)); api.resume(); },
      lock(){ gsap.to({v:0},{v:1,duration:.5,ease:'power2.out',onUpdate(){locked=this.targets()[0].v;},onComplete(){gsap.to({v:1},{v:0,duration:.6,delay:.4,onUpdate(){locked=this.targets()[0].v;}});}}); api.resume(); },
      pause(){ paused=true; if(rafId){cancelAnimationFrame(rafId);rafId=0;} },
      resume(){ if(!running) return; paused=false; start(); },
      stop(){ running=false; if(rafId){cancelAnimationFrame(rafId);rafId=0;} },
      resize(){ size(); if(reduce||!fine){ drawStatic(); } },
      center(){ const r=canvas.getBoundingClientRect(); return {x:r.left+canvas.clientWidth/2, y:r.top+canvas.clientHeight/2}; }
    };
    if(reduce || !fine){ drawStatic(); } else { start(); }
    return api;
  }

  function revealHeadings(){
    gsap.utils.toArray('[data-reveal="lines"]').forEach(h=>{
      const inners=h.querySelectorAll('.line-inner');
      const tl=gsap.timeline({scrollTrigger:{trigger:h,start:'top 84%',once:true}});
      tl.to(inners,{yPercent:0,duration:.9,ease:'power4.out',stagger:.09});
      const ink=h.querySelector('[data-ink] svg path');
      if(ink){ const L=ink.getTotalLength?ink.getTotalLength():120; gsap.set(ink,{strokeDasharray:L,strokeDashoffset:L});
        tl.to(ink,{strokeDashoffset:0,duration:.7,ease:'power2.inOut'}, '-=0.15'); }
    });
    D.querySelectorAll('.hero-tagline [data-ink] svg path').forEach(ink=>{
      const L=ink.getTotalLength?ink.getTotalLength():120; gsap.set(ink,{strokeDasharray:L,strokeDashoffset:L});
      gsap.to(ink,{strokeDashoffset:0,duration:.8,ease:'power2.inOut',scrollTrigger:{trigger:'.hero-tagline',start:'top 90%',once:true}});
    });
  }
  function revealGeneric(){
    gsap.utils.toArray('[data-reveal]:not([data-reveal="lines"])').forEach(el=>{
      gsap.fromTo(el,{y:24,opacity:0},{y:0,opacity:1,duration:.85,ease:EASE,scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    });
  }
  function eyebrowScrambles(){
    gsap.utils.toArray('[data-scramble]').forEach(el=>{
      if(el.closest('#hero')) return;
      el.setAttribute('aria-label', el.getAttribute('data-scramble'));
      ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{ if(!reduce) scramble(el,el.getAttribute('data-scramble'),750); else el.textContent=el.getAttribute('data-scramble'); }});
    });
  }

  function tuneIn(){
    gsap.utils.toArray('.portrait .duo').forEach(duo=>{
      const wrap=duo.parentElement; const img=wrap.querySelector('.img'); const scan=wrap.querySelector('.scan');
      gsap.to(duo,{opacity:0,ease:'none',scrollTrigger:{trigger:wrap,start:'top 85%',end:'top 35%',scrub:true}});
      gsap.fromTo(img,{filter:'grayscale(1) contrast(1.06) brightness(.92)'},{filter:'grayscale(0) contrast(1) brightness(1)',ease:'none',scrollTrigger:{trigger:wrap,start:'top 85%',end:'top 35%',scrub:true}});
      if(scan){ gsap.fromTo(scan,{opacity:.5,backgroundPosition:'0 0'},{opacity:0,backgroundPosition:'0 60px',duration:1.1,ease:'power1.in',scrollTrigger:{trigger:wrap,start:'top 82%',once:true}}); }
    });
  }

  let marqueeRecalc=null;
  function marquee(){
    const track=D.getElementById('reelTrack'); if(!track) return;
    const mm=gsap.matchMedia();
    mm.add('(min-width:901px) and (prefers-reduced-motion: no-preference)', ()=>{
      const originals=Array.from(track.children);
      originals.forEach(c=>{ const cl=c.cloneNode(true); cl.setAttribute('aria-hidden','true'); cl.dataset.clone='1';
        cl.setAttribute('tabindex','-1'); cl.querySelectorAll('a,button,[tabindex]').forEach(x=>{x.setAttribute('tabindex','-1');});
        track.appendChild(cl); });
      let half=track.scrollWidth/2;
      let tween=gsap.to(track,{x:-half,duration:38,ease:'none',repeat:-1});
      const slow=ts=>gsap.to(tween,{timeScale:ts,duration:.5,ease:'power2.out',overwrite:true});
      const mq=D.getElementById('marquee');
      mq.addEventListener('pointerenter',()=>slow(.12));
      mq.addEventListener('pointerleave',()=>slow(1));
      mq.addEventListener('focusin',()=>slow(0));
      mq.addEventListener('focusout',()=>slow(1));
      if(fine){ track.querySelectorAll('.plate').forEach(p=>{
        p.addEventListener('pointermove',e=>{ const r=p.getBoundingClientRect();
          p.style.setProperty('--px', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
          p.style.setProperty('--py', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%'); },{passive:true}); }); }
      marqueeRecalc=()=>{ const ts=tween.timeScale(); tween.kill(); gsap.set(track,{x:0}); half=track.scrollWidth/2;
        tween=gsap.to(track,{x:-half,duration:38,ease:'none',repeat:-1}); tween.timeScale(ts); };
      return ()=>{ marqueeRecalc=null; tween.kill(); gsap.set(track,{x:0}); track.querySelectorAll('[data-clone]').forEach(c=>c.remove()); };
    });
    mm.add('(max-width:900px),(prefers-reduced-motion: reduce)', ()=>{
      track.style.flexDirection='column'; track.style.width='100%';
      track.querySelectorAll('.plate').forEach(c=>{ c.style.width='100%';
        if(!reduce) gsap.fromTo(c,{opacity:0,y:24},{opacity:1,y:0,duration:.7,ease:EASE,scrollTrigger:{trigger:c,start:'top 90%',once:true}});
        else gsap.set(c,{opacity:1,y:0}); });
      const g=D.querySelector('.marquee-gutter'); if(g) g.style.display='none';
      const bl=D.querySelector('.marquee .baseline'); if(bl) bl.style.display='none';
      return ()=>{ track.style.flexDirection=''; track.style.width=''; track.querySelectorAll('.plate').forEach(c=>c.style.width='');
        const g=D.querySelector('.marquee-gutter'); if(g) g.style.display=''; const bl=D.querySelector('.marquee .baseline'); if(bl) bl.style.display=''; };
    });
  }

  let roleTimer=null, heroVisible=true;
  function roleCycle(){
    const el=D.querySelector('.rolecycle .role'); if(!el || reduce) return;
    const roles=el.getAttribute('data-roles').split('|');
    let i=0, cycles=0;
    roleTimer=setInterval(()=>{
      if(reduce || !heroVisible){ return; }
      i=(i+1)%roles.length; cycles++;
      scramble(el, roles[i], 650);
      if(cycles>=roles.length*2 && roles[i]==='Software Engineer'){ clearInterval(roleTimer); roleTimer=null; }
    }, 4500);
  }

  let navDotPulse=null;
  function scrollLife(){
    if(reduce) return;
    let agit=0, target=0, busVis=true, baseVis=true;
    const busSvg=D.getElementById('signalbus'), baseSvg=D.getElementById('reelBase');
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(es=>{ es.forEach(e=>{
        if(e.target===busSvg) busVis=e.isIntersecting; else if(e.target===baseSvg) baseVis=e.isIntersecting; }); },{rootMargin:'120px'});
      if(busSvg) io.observe(busSvg); if(baseSvg) io.observe(baseSvg);
    }
    gsap.ticker.add((time)=>{
      if(D.hidden || reduce) return;
      target*=0.93; agit += (target-agit)*0.1;
      if(busPath && busVis)   busPath.setAttribute('d',  wavePath(1200,30, 3+agit*7,   0.03,  time*1.2));
      if(basePath && baseVis) basePath.setAttribute('d', wavePath(1600,30, 2.5+agit*6, 0.025, time*1.5));
    });
    const bump=v=>{ target=Math.min(1, target+Math.min(Math.abs(v),0.5)); };
    if(lenis){ lenis.on('scroll', e=>bump((e.velocity||0)/30)); }
    else { let last=scrollY; addEventListener('scroll',()=>{ bump((scrollY-last)/55); last=scrollY; },{passive:true}); }

    gsap.utils.toArray('.folio').forEach(f=>{
      gsap.fromTo(f,{yPercent:-14},{yPercent:22,ease:'none',
        scrollTrigger:{trigger:f.closest('section'),start:'top bottom',end:'bottom top',scrub:true}});
    });

    const sb=D.getElementById('scrollbar');
    if(sb) ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{ sb.style.transform='scaleX('+self.progress.toFixed(4)+')'; }});

    // scroll-spy: active nav link
    D.querySelectorAll('.nav-links a[href^="#"]').forEach(a=>{
      const sec=D.querySelector(a.getAttribute('href')); if(!sec) return;
      ScrollTrigger.create({trigger:sec,start:'top 45%',end:'bottom 45%',onToggle:self=>a.classList.toggle('active',self.isActive)});
    });
  }

  // hero visibility → pause role cycle off-hero
  (function(){ const hero=D.getElementById('hero'); if(!hero||!('IntersectionObserver'in window)) return;
    new IntersectionObserver(es=>{ heroVisible=es[0].isIntersecting; },{threshold:0}).observe(hero); })();

  let navScope=null;
  function setupResize(){
    let raf=0;
    const handler=()=>{ if(raf) cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{ raf=0;
        if(navScope) navScope.resize();
        if(busPath)  busPath.setAttribute('d', wavePath(1200,30,6,0.03,0));
        if(basePath) basePath.setAttribute('d', wavePath(1600,30,5,0.025,1.5));
        if(marqueeRecalc) marqueeRecalc();
        ScrollTrigger.refresh();
      }); };
    addEventListener('resize',handler,{passive:true});
    addEventListener('orientationchange',handler,{passive:true});
  }

  function preloader(done){
    const pl=D.getElementById('preloader'), pct=D.getElementById('plPct');
    const plScope=scope(D.getElementById('plCanvas'),{amp:10,freq:.05});
    let finished=false;
    const finish=()=>{ if(finished)return; finished=true; try{ if(plScope)plScope.stop(); }catch(e){}
      if(pl) pl.style.display='none'; if(page) page.removeAttribute('inert'); try{ done(); }catch(e){} };
    if(reduce){ finish(); return; }
    if(page) page.setAttribute('inert','');
    const o={v:0}; let tw=null;
    try{
      tw=gsap.to(o,{v:100,duration:1.5,ease:'steps(20)',
        onUpdate:()=>{ try{ pct.textContent=String(Math.round(o.v)).padStart(2,'0'); }catch(e){} },
        onComplete:()=>{ try{ gsap.to(pl,{clipPath:'inset(0 0 100% 0)',duration:.7,ease:'power3.inOut',onComplete:finish}); }catch(e){ finish(); } }});
    }catch(e){ finish(); return; }
    if(D.fonts && D.fonts.ready){ D.fonts.ready.then(()=>{ if(!finished && tw && tw.progress()<1){ try{ gsap.to(tw,{timeScale:3,duration:.2,overwrite:true}); }catch(e){} } }).catch(()=>{}); }
    setTimeout(finish,2800);
  }

  function boot(){
    revealGeneric(); revealHeadings(); eyebrowScrambles(); tuneIn(); marquee(); scrollLife(); setupResize(); ScrollTrigger.refresh();
    if(D.fonts && D.fonts.ready){ D.fonts.ready.then(()=>ScrollTrigger.refresh()).catch(()=>{}); }
  }

  function run(){
    boot();
    navScope=scope(D.getElementById('scope'),{amp:7,freq:.06});
    if(navScope && fine && !reduce){
      let idle=null;
      addEventListener('pointermove',e=>{ const c=navScope.center(); const d=Math.hypot(e.clientX-c.x,e.clientY-c.y); navScope.bend(d);
        clearTimeout(idle); idle=setTimeout(()=>navScope.pause(),2200); },{passive:true});
    }
    const navDot=D.getElementById('navDot'), flash=D.getElementById('flash');
    if(navDot){
      if(!reduce) navDotPulse=gsap.to(navDot.querySelector('.dot'),{scale:1.18,duration:1.6,ease:'sine.inOut',yoyo:true,repeat:-1,transformOrigin:'center'});
      navDot.addEventListener('click',e=>{ e.preventDefault();
        if(navScope) navScope.lock();
        if(!reduce && flash) gsap.fromTo(flash,{opacity:0},{opacity:.16,duration:.09,yoyo:true,repeat:1,onComplete:goContact});
        else goContact();
      });
    }
    preloader(()=>{ if(lenis) lenis.start();
      const nm=D.querySelector('[data-hero-name]'); if(nm && !reduce){
        const tg=nm.querySelectorAll('.t'); scramble(tg[0],'Yousof',900); scramble(tg[1],'Selim',1050);
      }
      roleCycle();
      ScrollTrigger.refresh();
    });
  }

  // reduced-motion: react live to changes
  const onRMChange=e=>{ reduce=e.matches;
    if(reduce){
      if(roleTimer){clearInterval(roleTimer);roleTimer=null;}
      if(navDotPulse){navDotPulse.kill();navDotPulse=null;}
      if(navScope){ navScope.pause(); navScope.resize(); }
    } else {
      if(navScope && fine) navScope.resume();
      if(!roleTimer) roleCycle();
      const nd=D.getElementById('navDot'), dotEl=nd&&nd.querySelector('.dot');
      if(dotEl && !navDotPulse) navDotPulse=gsap.to(dotEl,{scale:1.18,duration:1.6,ease:'sine.inOut',yoyo:true,repeat:-1,transformOrigin:'center'});
    } };
  if(rmq.addEventListener) rmq.addEventListener('change',onRMChange);
  else if(rmq.addListener) rmq.addListener(onRMChange);

  if(D.readyState!=='loading') run();
  else addEventListener('DOMContentLoaded', run, {once:true});
})();
