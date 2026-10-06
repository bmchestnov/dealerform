/* Фото техники: 3 кадра в ряд, центральный крупнее; стрелки, свайп, клавиши, автопрокрутка каждые 3,5 с */
(function(){
  const root=document.getElementById('lineup'); if(!root)return;
  const stage=root.querySelector('.car-stage'), slides=[...stage.children], n=slides.length;
  const DELAY=3500, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur=0, timer=null, visible=true, hover=false;

  function render(){
    slides.forEach((s,i)=>{
      let d=(i-cur+n)%n; if(d>n/2)d-=n;          // кратчайшее смещение от текущего: -3…3
      s.style.setProperty('--d',d);
      s.classList.toggle('on',d===0);
      s.classList.toggle('v',Math.abs(d)<=1);
      s.setAttribute('aria-hidden',Math.abs(d)<=1?'false':'true');
    });
  }
  function go(i){cur=(i+n)%n;render()}
  function restart(){clearInterval(timer);timer=null;if(!reduce&&visible&&!hover)timer=setInterval(()=>go(cur+1),DELAY)}

  root.querySelector('.prev').onclick=()=>{go(cur-1);restart()};
  root.querySelector('.next').onclick=()=>{go(cur+1);restart()};
  slides.forEach((s,i)=>s.addEventListener('click',()=>{if(i!==cur){go(i);restart()}}));
  stage.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();go(cur+1);restart()}
    else if(e.key==='ArrowLeft'){e.preventDefault();go(cur-1);restart()}
  });

  /* свайп на телефоне */
  let x0=null;
  stage.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
  stage.addEventListener('touchend',e=>{
    if(x0===null)return; const dx=e.changedTouches[0].clientX-x0; x0=null;
    if(Math.abs(dx)>40){go(cur+(dx<0?1:-1));restart()}
  },{passive:true});

  /* пауза, пока курсор над фото или блок вне экрана */
  root.addEventListener('mouseenter',()=>{hover=true;restart()});
  root.addEventListener('mouseleave',()=>{hover=false;restart()});
  if('IntersectionObserver' in window)
    new IntersectionObserver(es=>es.forEach(e=>{visible=e.isIntersecting;restart()}),{threshold:.3}).observe(root);
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;restart()});

  render(); restart();
})();
