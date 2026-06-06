(function(){
  const D=document, root=D.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(pointer: fine)').matches;
  const hasGSAP=typeof gsap!=='undefined';

  const now=new Date();
  const p2=n=>String(n).padStart(2,'0');
  const yEl=D.getElementById('yr'); if(yEl) yEl.textContent=now.getFullYear();
  const stamp=D.getElementById('stamp'); if(stamp) stamp.textContent=p2(now.getDate())+'-'+p2(now.getMonth()+1)+'-'+String(now.getFullYear()).slice(2);

  try{ console.log('%c ysf.slm ','background:#3DE1FF;color:#06141A;font-weight:bold;padding:2px 4px');
       console.log('%c~∿∿∿  signal acquired — peek at the source, it\'s hand-wired.','color:#3DE1FF'); }catch(e){}

  const SKILLS=['FLUTTER','DART','REACT NATIVE','TYPESCRIPT','JAVASCRIPT','PYTHON','HTML / CSS','GDSCRIPT','NODE.JS','REST APIS','SUPABASE','FIREBASE','POSTGRESQL','SQL / NOSQL','TAILWIND','CLAUDE','CURSOR','GITHUB COPILOT','CHATGPT','GEMINI','GIT / GITHUB','XCODE','FIGMA','GODOT'];
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

  D.querySelectorAll('[data-ink]').forEach(el=>{
    const svg=`<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M1,7 C18,3 34,8 50,5 C66,2 82,7 99,4"/></svg>`;
    el.insertAdjacentHTML('beforeend', svg);
  });

  if(!hasGSAP){
    D.querySelectorAll('[data-reveal]').forEach(e=>e.style.opacity=1);
    D.querySelectorAll('.line-inner').forEach(e=>e.style.transform='none');
    D.querySelectorAll('[data-scramble]').forEach(e=>e.textContent=e.getAttribute('data-scramble'));
    D.getElementById('preloader').style.display='none';

    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if(typeof CustomEase!=='undefined') CustomEase.create('atelier','M0,0 C0.16,1 0.3,1 1,1');
  const EASE=(typeof CustomEase!=='undefined')?'atelier':'power3.out';

  D.querySelectorAll('[data-reveal="lines"]').forEach(h=>{
    const parts=h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML=parts.map(p=>`<span class="line-mask"><span class="line-inner">${p}</span></span>`).join('');
  });

  let lenis=null;
  if(!reduce && typeof Lenis!=='undefined'){
    lenis=new Lenis({duration:1.1, easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t=>lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    D.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
      const id=a.getAttribute('href'); if(id.length>1){ e.preventDefault(); lenis.scrollTo(id,{offset:0}); }
    }));
  }
  const goContact=()=> lenis?lenis.scrollTo('#contact',{offset:0}):D.getElementById('contact').scrollIntoView();

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

  function scope(canvas, opts){
    if(!canvas) return null;
    const ctx=canvas.getContext('2d'); const dpr=Math.min(devicePixelRatio||1,2);
    const W=canvas.width=canvas.clientWidth*dpr, H=canvas.height=canvas.clientHeight*dpr;
    ctx.scale(1,1);
    let amp=opts.amp||7, freq=opts.freq||.06, t=0, locked=0, running=true;
    const cur={x:.5,y:.5};
    function frame(){
      if(!running) return;
      if(D.hidden){ requestAnimationFrame(frame); return; }
      t+=0.05; ctx.clearRect(0,0,W,H);
      const mid=H/2;
      const a = locked>0 ? amp*(1-locked) : amp*dpr;
      ctx.beginPath(); ctx.moveTo(0,mid);
      for(let x=0;x<=W;x+=2*dpr){ ctx.lineTo(x, mid + Math.sin(x*freq/dpr + t)*a); }
      ctx.strokeStyle='#3DE1FF'; ctx.lineWidth=1.5*dpr; ctx.shadowBlur=15*dpr; ctx.shadowColor='rgba(61,225,255,.95)'; ctx.stroke(); ctx.shadowBlur=0;
      if(locked>0){ ctx.beginPath(); ctx.arc(W*0.5,mid,2.5*dpr,0,7); ctx.fillStyle='#3DE1FF'; ctx.fill(); }
      requestAnimationFrame(frame);
    }
    const api={
      bend(dist){ const m=gsap.utils.mapRange(0,600,9,2,Math.min(dist,600)); amp=m*dpr; freq=gsap.utils.mapRange(0,600,.18,.08,Math.min(dist,600)); },
      lock(){ gsap.to({v:0},{v:1,duration:.5,ease:'power2.out',onUpdate(){locked=this.targets()[0].v;},onComplete(){gsap.to({v:1},{v:0,duration:.6,delay:.4,onUpdate(){locked=this.targets()[0].v;}});}}); },
      stop(){ running=false; }, center(){ return {x:canvas.getBoundingClientRect().left+canvas.clientWidth/2, y:canvas.getBoundingClientRect().top+canvas.clientHeight/2}; }
    };
    if(reduce || !fine){
      ctx.clearRect(0,0,W,H); const mid=H/2; ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(W,mid);
      ctx.strokeStyle='rgba(61,225,255,.5)'; ctx.lineWidth=1.5*dpr; ctx.stroke();
    } else { frame(); }
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
      ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>scramble(el,el.getAttribute('data-scramble'),750)});
    });
  }

  function tuneIn(){
    gsap.utils.toArray('.portrait .duo, .about-photo .duo').forEach(duo=>{
      const wrap=duo.parentElement; const img=wrap.querySelector('.img'); const scan=wrap.querySelector('.scan');
      gsap.to(duo,{opacity:0,ease:'none',scrollTrigger:{trigger:wrap,start:'top 85%',end:'top 35%',scrub:true}});
      gsap.fromTo(img,{filter:'grayscale(1) contrast(1.05) brightness(.92)'},{filter:'grayscale(0) contrast(1) brightness(1)',ease:'none',scrollTrigger:{trigger:wrap,start:'top 85%',end:'top 35%',scrub:true}});
      if(scan){ gsap.fromTo(scan,{opacity:.5,backgroundPosition:'0 0'},{opacity:0,backgroundPosition:'0 60px',duration:1.1,ease:'power1.in',scrollTrigger:{trigger:wrap,start:'top 82%',once:true}}); }
    });
  }

  function marquee(){
    const track=D.getElementById('reelTrack'); if(!track) return;
    const mm=gsap.matchMedia();
    mm.add('(min-width:901px) and (prefers-reduced-motion: no-preference)', ()=>{
      const originals=Array.from(track.children);
      originals.forEach(c=>track.appendChild(c.cloneNode(true)));
      const half=track.scrollWidth/2;
      const tween=gsap.to(track,{x:-half,duration:38,ease:'none',repeat:-1});
      const slow=ts=>gsap.to(tween,{timeScale:ts,duration:.4,ease:'power2.out',overwrite:true});
      const mq=D.getElementById('marquee');
      mq.addEventListener('pointerenter',()=>slow(0));
      mq.addEventListener('pointerleave',()=>slow(1));

      if(fine){ track.querySelectorAll('.plate').forEach(p=>{
        p.addEventListener('pointermove',e=>{ const r=p.getBoundingClientRect(); }); }); }
      return ()=>{ tween.kill(); gsap.set(track,{x:0}); track.querySelectorAll('.plate').forEach((c,i)=>{ if(i>=originals.length) c.remove(); }); };
    });
    mm.add('(max-width:900px),(prefers-reduced-motion: reduce)', ()=>{
      track.style.flexDirection='column'; track.style.width='100%';
      track.querySelectorAll('.plate').forEach(c=>{ c.style.width='100%'; gsap.fromTo(c,{opacity:0,y:24},{opacity:1,y:0,duration:.7,ease:EASE,scrollTrigger:{trigger:c,start:'top 90%',once:true}}); });
      const g=D.querySelector('.marquee-gutter'); if(g) g.style.display='none';
      return ()=>{ track.style.flexDirection=''; track.style.width=''; };
    });
  }

  function roleCycle(){
    const el=D.querySelector('.rolecycle .role'); if(!el) return;
    const roles=el.getAttribute('data-roles').split('|');
    if(reduce) return;
    let i=0;
    setInterval(()=>{ i=(i+1)%roles.length; scramble(el, roles[i], 650); }, 2600);
  }

  function scrollLife(){
    if(reduce) return;
    let agit=0, target=0;
    gsap.ticker.add((time)=>{
      if(D.hidden) return;
      target*=0.93;
      agit += (target-agit)*0.1;
      if(busPath)  busPath.setAttribute('d',  wavePath(1200,30, 3+agit*7,   0.03,  time*1.2));
      if(basePath) basePath.setAttribute('d', wavePath(1600,30, 2.5+agit*6, 0.025, time*1.5));
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
  }

  function preloader(done){
    const pl=D.getElementById('preloader'), pct=D.getElementById('plPct');
    const plScope=scope(D.getElementById('plCanvas'),{amp:10,freq:.05});
    let finished=false; const finish=()=>{ if(finished)return; finished=true; if(plScope)plScope.stop(); pl.style.display='none'; done(); };
    if(reduce){ finish(); return; }
    const o={v:0};
    gsap.to(o,{v:100,duration:1.8,ease:'steps(18)',onUpdate:()=>{ pct.textContent=String(Math.round(o.v)).padStart(2,'0'); },
      onComplete:()=>{ gsap.to(pl,{clipPath:'inset(0 0 100% 0)',duration:.8,ease:'power3.inOut',onComplete:finish}); }});
    setTimeout(finish,5200);
  }

  function boot(){
    revealGeneric(); revealHeadings(); eyebrowScrambles(); tuneIn(); marquee(); scrollLife(); ScrollTrigger.refresh();
  }
  addEventListener('load', ()=>{
    boot();

    const navScope=scope(D.getElementById('scope'),{amp:7,freq:.06});
    if(navScope && fine && !reduce){
      addEventListener('pointermove',e=>{ const c=navScope.center(); const d=Math.hypot(e.clientX-c.x,e.clientY-c.y); navScope.bend(d); },{passive:true});
    }
    const navDot=D.getElementById('navDot'), flash=D.getElementById('flash');
    if(navDot){
      if(!reduce) gsap.to(navDot,{scale:1.35,duration:1.4,ease:'sine.inOut',yoyo:true,repeat:-1,transformOrigin:'center'});
      navDot.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation();
        if(navScope) navScope.lock();
        gsap.fromTo(flash,{opacity:0},{opacity:.16,duration:.09,yoyo:true,repeat:1,onComplete:goContact});
      });
    }
    preloader(()=>{ if(lenis) lenis.start();
      const nm=D.querySelector('[data-hero-name]'); if(nm && !reduce){
        const t=nm.querySelectorAll('.t'); scramble(t[0],'Yousof',900); scramble(t[1],'Selim',1050);
      }
      roleCycle();
      ScrollTrigger.refresh();
    });
  });
})();
