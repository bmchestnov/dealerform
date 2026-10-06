/* «Модельный ряд»: photo carousel — native swipe/scroll-snap, arrows, dots, keyboard, gentle autoplay */
(function(){
  const root=document.getElementById('lineup'); if(!root)return;
  const track=root.querySelector('.car-track'), slides=[...track.children], dots=root.querySelector('.car-dots');
  const prev=root.querySelector('.prev'), next=root.querySelector('.next');
  let cur=0, timer=null, stopped=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-label',`Фото ${i+1} из ${slides.length}`);b.onclick=()=>{stop();go(i)};dots.appendChild(b)});
  const dotEls=[...dots.children];

  function go(i,smooth=true){
    cur=(i+slides.length)%slides.length;
    track.scrollTo({left:slides[cur].offsetLeft-track.offsetLeft,behavior:smooth&&!reduce?'smooth':'auto'});
    mark();
  }
  function mark(){dotEls.forEach((d,i)=>{d.setAttribute('aria-selected',i===cur?'true':'false');d.classList.toggle('on',i===cur)})}
  /* keep the current index in sync with swipes / trackpad scrolling */
  let raf=0;
  track.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const i=Math.round(track.scrollLeft/track.clientWidth);if(i!==cur&&i>=0&&i<slides.length){cur=i;mark()}})},{passive:true});
  prev.onclick=()=>{stop();go(cur-1)};
  next.onclick=()=>{stop();go(cur+1)};
  track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stop();go(cur+1)}else if(e.key==='ArrowLeft'){e.preventDefault();stop();go(cur-1)}});

  /* autoplay every 6 s while the carousel is on screen; any interaction stops it */
  function stop(){stopped=true;clearInterval(timer);timer=null}
  function start(){if(stopped||reduce||timer)return;timer=setInterval(()=>go(cur+1),6000)}
  ['pointerdown','wheel','touchstart'].forEach(ev=>track.addEventListener(ev,stop,{passive:true}));
  root.addEventListener('mouseenter',()=>{clearInterval(timer);timer=null});
  root.addEventListener('mouseleave',start);
  root.addEventListener('focusin',()=>{clearInterval(timer);timer=null});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)start();else{clearInterval(timer);timer=null}}),{threshold:.4}).observe(root);
  else start();
  addEventListener('resize',()=>go(cur,false));
  mark();
})();
