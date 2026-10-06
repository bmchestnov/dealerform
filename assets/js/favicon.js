/* Вращающийся favicon: белый логотип БАЗ на черном фоне поворачивается вокруг вертикальной оси.
   Браузеры сами не анимируют favicon, поэтому кадры рисуются на canvas и подставляются в <link rel="icon">.
   Без поддержки canvas или при «уменьшить движение» остается обычный favicon.ico. */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const N=64, PERIOD=3000, FPS=20;                      // размер кадра, оборот за 3 с
  const cv=document.createElement('canvas'); cv.width=cv.height=N;
  const ctx=cv.getContext('2d'); if(!ctx||!cv.toDataURL)return;
  const img=new Image(); img.src='assets/img/logo-baz-white.png';
  let link=document.querySelector('link[rel="icon"]');
  if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link)}
  img.onload=()=>{
    const w=N*.84, h=w*img.height/img.width, t0=performance.now();
    function frame(){
      const a=((performance.now()-t0)%PERIOD)/PERIOD*2*Math.PI, sx=Math.abs(Math.cos(a));   // логотип с обеих сторон, без зеркального отражения
      ctx.fillStyle='#000'; ctx.fillRect(0,0,N,N);
      ctx.save(); ctx.translate(N/2,N/2); ctx.scale(Math.max(sx,.04),1);   // на ребре логотип не исчезает совсем
      ctx.drawImage(img,-w/2,-h/2,w,h); ctx.restore();
      try{link.type='image/png'; link.href=cv.toDataURL('image/png')}catch(e){clearInterval(timer)}   // с диска (file://) холст «грязный» — остается обычная иконка
    }
    const timer=setInterval(frame,1000/FPS); frame();
  };
})();
