/* Блок 03: конструктор карты «Расположение других брендов».
   Подложка — OpenStreetMap, поиск адресов — Nominatim (оба бесплатные, без ключа).
   Отметки нумеруются по строкам таблицы брендов, их можно перетаскивать или ставить щелчком.
   Готовая картинка (карта + легенда «бренд — номера») уходит на слайд 03 анкеты. */
(function(){
  const root=document.getElementById('cmMap'); if(!root)return;
  /* страница открыта двойным щелчком (file://): у запросов нет адреса сайта, и OpenStreetMap отвечает заглушкой «Access blocked» */
  if(location.protocol==='file:'){document.getElementById('cmLocal').hidden=false;root.closest('.cm-wrap').hidden=true;window.BAZCompMap={image:async()=>null,active:()=>false};
    document.querySelectorAll('.cm-tabs [data-cm]').forEach(b=>b.onclick=()=>{const m=b.dataset.cm;document.querySelectorAll('.cm-tabs [data-cm]').forEach(x=>x.setAttribute('aria-selected',x===b?'true':'false'));document.getElementById('cmBuild').hidden=m!=='build';document.getElementById('cmUpload').hidden=m!=='upload';document.getElementById('cm_mode').value=m});
    return}
  const $$=q=>Array.from(document.querySelectorAll(q));
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const changed=()=>{if(window.BAZChanged)window.BAZChanged()};
  const TILE='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const GEO='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ru&accept-language=ru&q=';
  const FILTER='grayscale(.55) sepia(.08) brightness(1.03) contrast(.95)';   // подложка в светлой гамме сайта
  const ZMIN=3, ZMAX=18, T=256;
  const tilesEl=root.querySelector('.cm-tiles'), pinsEl=root.querySelector('.cm-pins');
  const listEl=document.getElementById('cmList'), statusEl=document.getElementById('cmStatus');
  const viewIn=document.getElementById('cm_view'), modeIn=document.getElementById('cm_mode');
  let z=3, cx=0, cy=0, W=0, H=0, placing=null, busy=false;

  /* ---------- проекция Web Mercator ---------- */
  const px=(lat,lon,zz)=>{const n=T*2**zz, s=Math.sin(lat*Math.PI/180);
    return [(lon+180)/360*n, (0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n]};
  const ll=(x,y,zz)=>{const n=T*2**zz, lon=x/n*360-180, k=Math.PI-2*Math.PI*y/n;
    return [180/Math.PI*Math.atan(.5*(Math.exp(k)-Math.exp(-k))), lon]};
  function setView(lat,lon,zz){z=Math.max(ZMIN,Math.min(ZMAX,zz));[cx,cy]=px(lat,lon,z);render();saveView()}
  const center=()=>ll(cx,cy,z);
  function saveView(){const [la,lo]=center();viewIn.value=`${la.toFixed(5)},${lo.toFixed(5)},${z}`}

  /* ---------- строки таблицы брендов ---------- */
  function entries(){
    return $$('#t_comp tr[data-t=comp]').map(tr=>{
      const g=f=>tr.querySelector(`[data-f="${f}"]`);
      return {tr,name:g('name'),addr:g('addr'),lat:g('lat'),lon:g('lon'),src:g('src')};
    }).filter(e=>e.name.value.trim()||e.addr.value.trim()||e.lat.value).map((e,i)=>Object.assign(e,{n:i+1}));
  }
  const hasPt=e=>e.lat.value!==''&&e.lon.value!=='';
  function setPt(e,lat,lon,src){e.lat.value=lat==null?'':(+lat).toFixed(6);e.lon.value=lon==null?'':(+lon).toFixed(6);e.src.value=lat==null?'':src}

  /* ---------- отрисовка ---------- */
  const cache=new Map();
  function render(){
    W=root.clientWidth;H=root.clientHeight;if(!W||!H)return;
    const x0=cx-W/2, y0=cy-H/2, n=2**z, need=new Set();
    for(let tx=Math.floor(x0/T);tx<=Math.floor((x0+W)/T);tx++)for(let ty=Math.floor(y0/T);ty<=Math.floor((y0+H)/T);ty++){
      if(ty<0||ty>=n)continue;
      const key=`${z}/${tx}/${ty}`;need.add(key);
      let im=cache.get(key);
      if(!im){im=new Image();im.alt='';im.draggable=false;im.src=TILE.replace('{z}',z).replace('{x}',((tx%n)+n)%n).replace('{y}',ty);cache.set(key,im);tilesEl.appendChild(im)}
      im.style.transform=`translate(${Math.round(tx*T-x0)}px,${Math.round(ty*T-y0)}px)`;
    }
    cache.forEach((im,key)=>{if(!need.has(key)){im.remove();cache.delete(key)}});
    drawPins();
  }
  function drawPins(){
    const x0=cx-W/2, y0=cy-H/2, E=entries();
    pinsEl.innerHTML='';
    E.forEach(e=>{if(!hasPt(e))return;
      const [x,y]=px(+e.lat.value,+e.lon.value,z), p=document.createElement('div');
      p.className='cm-pin'+(e.n>9?' w':'');p.textContent=e.n;p.dataset.n=e.n;
      p.title=(e.name.value||'Без названия')+(e.addr.value?' — '+e.addr.value:'')+'. Перетащите, чтобы поправить';
      p.style.transform=`translate(${Math.round(x-x0)}px,${Math.round(y-y0)}px)`;pinsEl.appendChild(p)});
  }
  function list(){
    const E=entries();
    listEl.innerHTML=E.length?'':'<li class="cm-empty">Заполните таблицу брендов выше — здесь появится список для отметок.</li>';
    E.forEach(e=>{
      const li=document.createElement('li'), on=hasPt(e);
      li.className=(on?'on':'')+(placing===e.n?' placing':'');
      li.innerHTML=`<b class="cm-n">${e.n}</b><span class="cm-t"><span>${esc(e.name.value||'Без названия')}</span><small>${esc(e.addr.value||'адрес не указан')}</small></span>
        <button type="button" class="btn-x cm-act">${placing===e.n?'Отмена':on?'Переставить':'Поставить'}</button>`;
      li.querySelector('.cm-act').onclick=()=>{placing=placing===e.n?null:e.n;root.classList.toggle('placing',placing!=null);list();
        if(placing!=null)status(`Щелкните по карте, чтобы поставить отметку ${e.n}.`)};
      if(on)li.querySelector('.cm-t').onclick=()=>{setView(+e.lat.value,+e.lon.value,Math.max(z,14))};
      listEl.appendChild(li)});
    drawPins();
  }
  const status=t=>{statusEl.textContent=t||''};

  /* ---------- мышь, палец, колесо ---------- */
  let drag=null;
  root.addEventListener('pointerdown',ev=>{
    if(ev.button>0||ev.target.closest('.cm-ctl,.cm-attr'))return;
    const pin=ev.target.closest('.cm-pin');
    drag={pin,x:ev.clientX,y:ev.clientY,cx,cy,moved:false,e:pin?entries().find(e=>e.n===+pin.dataset.n):null};
    root.setPointerCapture(ev.pointerId);root.classList.add('grab');
  });
  root.addEventListener('pointermove',ev=>{
    if(!drag)return;const dx=ev.clientX-drag.x, dy=ev.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
    if(drag.e){const r=root.getBoundingClientRect(),[la,lo]=ll(cx-W/2+ev.clientX-r.left,cy-H/2+ev.clientY-r.top,z);setPt(drag.e,la,lo,'hand');drawPins()}
    else{cx=drag.cx-dx;cy=drag.cy-dy;render()}
  });
  const up=ev=>{
    if(!drag)return;root.classList.remove('grab');
    if(!drag.moved&&!drag.pin&&placing!=null){
      const e=entries().find(x=>x.n===placing), r=root.getBoundingClientRect();
      if(e){const [la,lo]=ll(cx-W/2+ev.clientX-r.left,cy-H/2+ev.clientY-r.top,z);setPt(e,la,lo,'hand');status(`Отметка ${e.n} поставлена. Ее можно перетащить.`)}
      placing=null;root.classList.remove('placing');list();
    }
    if(drag.e){list();status(`Отметка ${drag.e.n} перенесена.`)}
    drag=null;saveView();changed();
  };
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  let wt=0;
  root.addEventListener('wheel',ev=>{ev.preventDefault();const now=Date.now();if(now-wt<220)return;wt=now;
    const r=root.getBoundingClientRect();zoomAt(ev.deltaY<0?1:-1,ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
  root.addEventListener('dblclick',ev=>{if(ev.target.closest('.cm-ctl'))return;const r=root.getBoundingClientRect();zoomAt(1,ev.clientX-r.left,ev.clientY-r.top)});
  function zoomAt(d,mx,my){const nz=Math.max(ZMIN,Math.min(ZMAX,z+d));if(nz===z)return;
    const [la,lo]=ll(cx-W/2+mx,cy-H/2+my,z);z=nz;const [x,y]=px(la,lo,z);cx=x-mx+W/2;cy=y-my+H/2;render();saveView();changed()}
  root.querySelector('[data-z="+"]').onclick=()=>zoomAt(1,W/2,H/2);
  root.querySelector('[data-z="-"]').onclick=()=>zoomAt(-1,W/2,H/2);
  root.querySelector('[data-z="fit"]').onclick=()=>{if(!fit())status('На карте пока нет отметок.')};
  root.addEventListener('keydown',ev=>{const s=80,k=ev.key;
    if(k==='+'||k==='=')zoomAt(1,W/2,H/2);else if(k==='-')zoomAt(-1,W/2,H/2);
    else if(k.startsWith('Arrow')){cx+=k==='ArrowLeft'?-s:k==='ArrowRight'?s:0;cy+=k==='ArrowUp'?-s:k==='ArrowDown'?s:0;render();saveView()}else return;ev.preventDefault()});

  /* вписать все отметки в окно заданного размера */
  function fitView(pts,w,h,pad,zmax){
    if(!pts.length)return null;
    let best=ZMIN;
    for(let zz=zmax;zz>=ZMIN;zz--){const P=pts.map(p=>px(p[0],p[1],zz)),xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);
      if(Math.max(...xs)-Math.min(...xs)<=w-2*pad&&Math.max(...ys)-Math.min(...ys)<=h-2*pad){best=zz;break}}
    const P=pts.map(p=>px(p[0],p[1],best)),xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);
    return {z:best,cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2};
  }
  function fit(){const pts=entries().filter(hasPt).map(e=>[+e.lat.value,+e.lon.value]);
    const v=fitView(pts,W,H,50,15);if(!v)return false;z=v.z;cx=v.cx;cy=v.cy-14;render();saveView();changed();return true}

  /* ---------- поиск адресов ---------- */
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function geocode(q){
    const r=await fetch(GEO+encodeURIComponent(q),{headers:{'Accept':'application/json'}});
    if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();return j&&j[0]?[+j[0].lat,+j[0].lon]:null;
  }
  const city=()=>{const c=document.getElementById('c_city');return c?c.value.trim():''};
  document.getElementById('cmFind').onclick=async()=>{
    if(busy)return;const todo=entries().filter(e=>e.addr.value.trim()&&!hasPt(e));
    if(!todo.length){status(entries().some(e=>e.addr.value.trim())?'Все адреса уже на карте.':'Сначала впишите адреса в таблицу брендов.');return}
    busy=true;const btn=document.getElementById('cmFind');btn.disabled=true;let ok=0,miss=[];
    try{
      for(const [i,e] of todo.entries()){
        status(`Ищем адреса: ${i+1} из ${todo.length}…`);
        const a=e.addr.value.trim(), c=city();
        let p=null;
        try{p=await geocode(c&&!a.toLowerCase().includes(c.toLowerCase())?`${a}, ${c}`:a);if(!p&&c){await sleep(1100);p=await geocode(a)}}catch(err){status('Сервис поиска адресов не отвечает. Поставьте отметки вручную кнопкой «Поставить».');break}
        if(p){setPt(e,p[0],p[1],'geo');ok++}else miss.push(e.n);
        list();await sleep(1100);   // правило сервиса: не чаще одного запроса в секунду
      }
      fit();
      if(ok||miss.length)status(miss.length?`Найдено ${ok} из ${todo.length}. Отметки ${miss.join(', ')} поставьте вручную: «Поставить» и щелчок по карте.`:`Найдено ${ok} из ${todo.length}. Проверьте, что отметки стоят верно.`);
    }finally{busy=false;btn.disabled=false;changed()}
  };

  /* правка таблицы: обновить список; найденная автоматически точка сбрасывается при смене адреса */
  const tb=document.getElementById('t_comp');
  tb.addEventListener('input',ev=>{const tr=ev.target.closest('tr');
    if(tr&&ev.target.dataset.f==='addr'){const s=tr.querySelector('[data-f=src]');if(s&&s.value==='geo'){tr.querySelector('[data-f=lat]').value='';tr.querySelector('[data-f=lon]').value='';s.value=''}}
    clearTimeout(tb._t);tb._t=setTimeout(list,250)});
  new MutationObserver(()=>list()).observe(tb,{childList:true});

  /* ---------- вкладки: собрать на сайте / свой скриншот ---------- */
  function mode(m){modeIn.value=m;
    document.querySelectorAll('.cm-tabs [data-cm]').forEach(b=>b.setAttribute('aria-selected',b.dataset.cm===m?'true':'false'));
    document.getElementById('cmBuild').hidden=m!=='build';document.getElementById('cmUpload').hidden=m!=='upload';
    if(m==='build')requestAnimationFrame(render)}
  document.querySelectorAll('.cm-tabs [data-cm]').forEach(b=>b.onclick=()=>{mode(b.dataset.cm);changed()});

  /* ---------- картинка для анкеты ---------- */
  const loadTile=src=>new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';const t=setTimeout(()=>res(null),9000);
    im.onload=()=>{clearTimeout(t);res(im)};im.onerror=()=>{clearTimeout(t);res(null)};im.src=src});
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  async function image(){
    const E=entries(), P=E.filter(hasPt); if(!P.length)return null;
    const OW=900, OH=597, S=8/3;   // 2400×1592 px; отметки и легенда крупнее, чтобы читались на слайде
    const groups=[];E.forEach(e=>{const nm=(e.name.value.trim()||'Без названия'), k=nm.toLowerCase();let g=groups.find(g=>g.k===k);if(!g)groups.push(g={k,nm,ns:[]});if(hasPt(e))g.ns.push(e.n)});
    const leg=groups.filter(g=>g.ns.length), LW=300, rowH=30, LH=62+leg.length*rowH;
    const v=fitView(P.map(e=>[+e.lat.value,+e.lon.value]),OW-LW-60,OH-40,70,16);
    const zz=v.z, vx=v.cx+LW/2-20, vy=v.cy-10;          // сдвиг, чтобы легенда справа не закрывала отметки
    const cv=document.createElement('canvas');cv.width=OW*S;cv.height=OH*S;const c=cv.getContext('2d');c.scale(S,S);
    c.fillStyle='#eeede8';c.fillRect(0,0,OW,OH);
    /* подложка: тайлы следующего уровня масштаба, чтобы при двойной четкости не было размытия */
    const z2=Math.min(19,zz+1), k=2, x0=(vx-OW/2)*k, y0=(vy-OH/2)*k, n=2**z2, jobs=[];
    for(let tx=Math.floor(x0/T);tx<=Math.floor((x0+OW*k)/T);tx++)for(let ty=Math.floor(y0/T);ty<=Math.floor((y0+OH*k)/T);ty++){
      if(ty<0||ty>=n)continue;
      jobs.push(loadTile(TILE.replace('{z}',z2).replace('{x}',((tx%n)+n)%n).replace('{y}',ty)).then(im=>({im,tx,ty})))}
    const tiles=await Promise.all(jobs);
    c.save();if('filter' in c)c.filter=FILTER;
    tiles.forEach(({im,tx,ty})=>{if(im)c.drawImage(im,(tx*T-x0)/k,(ty*T-y0)/k,T/k+.5,T/k+.5)});c.restore();
    const font=(w,s)=>`${w} ${s}px Roboto, "Helvetica Neue", Arial, sans-serif`;
    /* отметки */
    P.forEach(e=>{const [x,y]=px(+e.lat.value,+e.lon.value,zz), mx=x-vx+OW/2, my=y-vy+OH/2, w=e.n>9?46:38;
      c.save();c.shadowColor='rgba(31,33,34,.3)';c.shadowBlur=5;c.shadowOffsetY=2;
      c.beginPath();c.moveTo(mx-w/2+4,my-44);c.lineTo(mx+w/2-4,my-44);c.arcTo(mx+w/2,my-44,mx+w/2,my-40,4);c.lineTo(mx+w/2,my-14);c.arcTo(mx+w/2,my-10,mx+w/2-4,my-10,4);
      c.lineTo(mx+8,my-10);c.lineTo(mx,my);c.lineTo(mx-8,my-10);c.lineTo(mx-w/2+4,my-10);c.arcTo(mx-w/2,my-10,mx-w/2,my-14,4);c.lineTo(mx-w/2,my-40);c.arcTo(mx-w/2,my-44,mx-w/2+4,my-44,4);c.closePath();
      c.fillStyle='#ffcd1c';c.fill();c.restore();c.strokeStyle='#c99f00';c.lineWidth=1;c.stroke();
      c.fillStyle='#1f2122';c.font=font(700,21);c.textAlign='center';c.textBaseline='middle';c.fillText(String(e.n),mx,my-26);
      c.beginPath();c.arc(mx,my,3.5,0,7);c.fillStyle='#373a3b';c.fill()});
    /* легенда */
    const lx=OW-LW-24, ly=24;
    c.save();c.shadowColor='rgba(31,33,34,.25)';c.shadowBlur=8;c.shadowOffsetY=2;rr(c,lx,ly,LW,LH,6);c.fillStyle='#fff';c.fill();c.restore();
    c.fillStyle='#ffcd1c';c.fillRect(lx,ly,LW,4);
    c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle='#5b5f62';c.font=font(700,12);
    c.fillText('БРЕНД · НОМЕРА НА КАРТЕ',lx+18,ly+34);
    leg.forEach((g,i)=>{const y=ly+66+i*rowH;c.fillStyle='#e9e9e6';c.fillRect(lx+18,y-21,LW-36,1);
      c.fillStyle='#1f2122';c.font=font(600,16);let nm=g.nm;while(c.measureText(nm).width>LW-120&&nm.length>3)nm=nm.slice(0,-2)+'…';c.fillText(nm,lx+18,y);
      c.fillStyle='#7d6200';c.font=font(700,15);c.textAlign='right';let ns=g.ns.join(', ');while(c.measureText(ns).width>90&&ns.length>3)ns=ns.slice(0,-2)+'…';c.fillText(ns,lx+LW-18,y);c.textAlign='left'});
    /* атрибуция OpenStreetMap — обязательна по лицензии */
    c.font=font(400,11);const at='© участники OpenStreetMap',aw=c.measureText(at).width+12;
    c.fillStyle='rgba(255,255,255,.85)';c.fillRect(OW-aw,OH-18,aw,18);c.fillStyle='#5b5f62';c.fillText(at,OW-aw+6,OH-5);
    let url;try{url=cv.toDataURL('image/jpeg',.9)}catch(err){return null}
    return {url,w:OW*S,h:OH*S,name:'Карта брендов.jpg'};
  }
  document.getElementById('cmPreview').onclick=async()=>{
    const b=document.getElementById('cmPreview');b.disabled=true;const t=b.textContent;b.textContent='Собираем карту…';
    try{const im=await image();if(!im){status('Поставьте хотя бы одну отметку.');return}
      window.openLB&&window.openLB(im.url,'Карта для анкеты','Так карта будет выглядеть на слайде 03 анкеты.')}
    finally{b.disabled=false;b.textContent=t}};

  /* ---------- старт ---------- */
  const sv=(viewIn.value||'').split(',').map(Number);
  if(sv.length===3&&sv.every(Number.isFinite)){z=sv[2];[cx,cy]=px(sv[0],sv[1],z)}else{z=3;[cx,cy]=px(62,94,3)}
  mode(modeIn.value==='upload'?'upload':'build');
  new ResizeObserver(()=>render()).observe(root);
  list();
  /* если вида еще нет — показать город кандидата */
  let cityTried=false;
  async function toCity(){if(cityTried||viewIn.value||entries().some(hasPt))return;const c=city();if(!c)return;cityTried=true;
    try{const p=await geocode(c);if(p&&!viewIn.value)setView(p[0],p[1],11)}catch(_){}}
  const cityEl=document.getElementById('c_city');if(cityEl)cityEl.addEventListener('change',toCity);
  new IntersectionObserver((es,o)=>{if(es.some(e=>e.isIntersecting)){toCity();o.disconnect()}}).observe(root);

  window.BAZCompMap={image:async()=>modeIn.value==='build'?image():null, active:()=>modeIn.value==='build'&&entries().some(hasPt)};
})();
