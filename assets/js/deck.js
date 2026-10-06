/* Candidate deck (.pptx) built from scratch in the browser, in the website's visual style:
   graphite band + light page, yellow accents, section numbers 00–08 as in the form. */
const BAZDeck=(function(){
const IN=914400; let W=12192000, H=6858000;
const C={gr:'444748',grd:'373A3B',bg:'F3F3F1',surf:'FFFFFF',sunk:'E9E9E6',ink:'1F2122',mut:'5B5F62',line:'D3D4D0',y:'FFCD1C',ys:'FFF4C9',acc:'7D6200',ong:'F3F3F1',ongm:'B9BCBD'};
const FONT='Arial';
let X0, CW, CT, CB;
/* page geometry: landscape 16:9 */
function page(){
  W=12192000;H=6858000;X0=Math.round(.6*IN);CT=Math.round(2.4*IN);CB=Math.round(6.85*IN);
  CW=W-2*X0;
}
page();
const XE=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const v=x=>x===undefined||x===null||String(x).trim()===''?'—':String(x).trim();
const R=n=>Math.round(n);
function b64(u){const s=atob(u.slice(u.indexOf(',')+1)),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}

/* ---------- text ---------- */
function run(t,o={}){
  return `<a:r><a:rPr lang="ru-RU" sz="${R((o.sz||12)*100)}" b="${o.b?1:0}"${o.i?' i="1"':''}${o.caps?' cap="all"':''}${o.spc?` spc="${o.spc}"`:''} dirty="0"><a:solidFill><a:srgbClr val="${o.color||C.ink}"/></a:solidFill><a:latin typeface="${FONT}"/><a:cs typeface="${FONT}"/></a:rPr><a:t>${XE(t)}</a:t></a:r>`;
}
function para(runs,o={}){
  const r=Array.isArray(runs)?runs.join(''):runs;
  return `<a:p><a:pPr algn="${o.algn||'l'}"><a:lnSpc><a:spcPct val="${o.ln||100000}"/></a:lnSpc><a:spcBef><a:spcPts val="${R((o.before||0)*100)}"/></a:spcBef><a:spcAft><a:spcPts val="${R((o.after||0)*100)}"/></a:spcAft><a:buNone/></a:pPr>${r}<a:endParaRPr lang="ru-RU" sz="${R((o.sz||12)*100)}" dirty="0"/></a:p>`;
}
const P=(t,o={})=>String(t).split('\n').map(line=>para(run(line,o),o)).join('');

/* ---------- slide ---------- */
class Slide{
  constructor(deck,o={}){this.d=deck;this.sh=[];this.rels=[];this.id=1;this.bg=o.bg||null}
  nid(){return ++this.id}
  img(url){const m=this.d.media(url);let r=this.rels.find(x=>x.t===m);if(!r){r={id:'rIdI'+(this.rels.length+1),t:m};this.rels.push(r)}return r.id}
  box(o){ // rectangle / text box
    const id=this.nid(), geom=o.r?'roundRect':'rect';
    const fill=o.fill?`<a:solidFill><a:srgbClr val="${o.fill}"/></a:solidFill>`:'<a:noFill/>';
    const ln=o.line?`<a:ln w="${o.lw||9525}"><a:solidFill><a:srgbClr val="${o.line}"/></a:solidFill>${o.dash?'<a:prstDash val="dash"/>':''}</a:ln>`:'<a:ln><a:noFill/></a:ln>';
    const ins=o.ins||[0,0,0,0];
    this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${XE(o.name||'Shape '+id)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${R(o.x)}" y="${R(o.y)}"/><a:ext cx="${R(o.w)}" cy="${R(o.h)}"/></a:xfrm><a:prstGeom prst="${geom}"><a:avLst>${o.r?`<a:gd name="adj" fmla="val ${o.r}"/>`:''}</a:avLst></a:prstGeom>${fill}${ln}</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="${R(ins[0])}" tIns="${R(ins[1])}" rIns="${R(ins[2])}" bIns="${R(ins[3])}" anchor="${o.anchor||'t'}" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>${o.text||'<a:p><a:endParaRPr lang="ru-RU" dirty="0"/></a:p>'}</p:txBody></p:sp>`);
  }
  text(x,y,w,h,text,o={}){this.box(Object.assign({x,y,w,h,text},o))}
  pic(url,x,y,w,h,iw,ih,fit){ // fit: 'cover' crops, 'contain' letterboxes
    let src='';
    if(fit==='contain'){const s=Math.min(w/iw,h/ih),nw=iw*s,nh=ih*s;x+=(w-nw)/2;y+=(h-nh)/2;w=nw;h=nh}
    else if(iw&&ih){const A=w/h,a=iw/ih;
      if(a>A){const c=R((1-A/a)/2*100000);src=`<a:srcRect l="${c}" r="${c}"/>`}
      else if(a<A){const c=R((1-a/A)/2*100000);src=`<a:srcRect t="${c}" b="${c}"/>`}}
    const id=this.nid(), rid=this.img(url);
    this.sh.push(`<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Picture ${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/>${src}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${R(x)}" y="${R(y)}"/><a:ext cx="${R(w)}" cy="${R(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`);
  }
  picCrop(url,x,y,w,h,c){ // c: {l,t,r,b} as fractions of the source image
    const id=this.nid(), rid=this.img(url), f=k=>R((c[k]||0)*100000);
    this.sh.push(`<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Picture ${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/><a:srcRect l="${f('l')}" t="${f('t')}" r="${f('r')}" b="${f('b')}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${R(x)}" y="${R(y)}"/><a:ext cx="${R(w)}" cy="${R(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`);
  }
  table(x,y,cols,head,rows,o={}){ // cols: widths in EMU
    const id=this.nid(), hh=o.hh||R(.42*IN), rh=o.rh||R(.4*IN), fs=o.fs||11;
    const ln=(tag,c,w=9525)=>c?`<a:${tag} w="${w}" cap="flat" cmpd="sng"><a:solidFill><a:srgbClr val="${c}"/></a:solidFill><a:prstDash val="solid"/></a:${tag}>`:`<a:${tag} w="0"><a:noFill/></a:${tag}>`;
    const al=o.align||cols.map(()=>'l');
    const cell=(t,ci,ri,last,isHead)=>{
      const L=ci===0?ln('lnL',C.y,12700):ln('lnL',null), Rr=ci===cols.length-1?ln('lnR',C.y,12700):ln('lnR',null);
      const T=isHead?ln('lnT',C.y,12700):ln('lnT',C.line), B=last?ln('lnB',C.y,12700):ln('lnB',C.line);
      const hs=o.hfs||9.5, rich=t&&typeof t==='object'&&t.xml, val=rich?'x':o.blank&&(t===''||t==null)?'':v(t);
      const txt=rich&&!isHead?t.xml:isHead?para(run(t,{sz:hs,b:true,caps:true,spc:o.hspc??40,color:C.ink}),{algn:al[ci],sz:hs}):(val===''?`<a:p><a:pPr algn="${al[ci]}"/><a:endParaRPr lang="ru-RU" sz="${R(fs*100)}" dirty="0"/></a:p>`:para(run(val,{sz:fs,color:val==='—'?'A4A8AB':C.ink,b:(o.boldFirst&&ci===0)||(o.boldLast&&ri===rows.length-1)||(o.boldCol===ci)}),{algn:al[ci],sz:fs}));
      return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${txt}</a:txBody><a:tcPr marL="${R(o.mx&&o.mx[ci]!=null?o.mx[ci]:.1*IN)}" marR="${R(o.mx&&o.mx[ci]!=null?o.mx[ci]:.1*IN)}" marT="${R(o.mt??.05*IN)}" marB="${R(o.mt??.05*IN)}" anchor="ctr">${L}${Rr}${T}${B}<a:solidFill><a:srgbClr val="${isHead||(o.boldLast&&last)?C.ys:C.surf}"/></a:solidFill></a:tcPr></a:tc>`;
    };
    let xml=`<a:tr h="${hh}">${head.map((t,ci)=>cell(t,ci,0,rows.length===0,true)).join('')}</a:tr>`;
    rows.forEach((r,ri)=>{xml+=`<a:tr h="${rh}">${cols.map((_,ci)=>cell(r[ci],ci,ri,ri===rows.length-1,false)).join('')}</a:tr>`});
    const cw=cols.reduce((a,b)=>a+b,0), chh=hh+rh*rows.length;
    this.sh.push(`<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Table ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${R(x)}" y="${R(y)}"/><a:ext cx="${R(cw)}" cy="${R(chh)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1"/><a:tblGrid>${cols.map(w=>`<a:gridCol w="${R(w)}"/>`).join('')}</a:tblGrid>${xml}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`);
  }
  xml(){
    const bg=this.bg?`<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${this.bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`:'';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${bg}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${this.sh.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  }
  relsXml(){
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdL" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>${this.rels.map(r=>`<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${r.t}"/>`).join('')}</Relationships>`;
  }
}

/* ---------- reusable blocks ---------- */
const card=(s,x,y,w,h,fill)=>s.box({x,y,w,h,fill:fill||C.surf,line:C.line,r:2500});
function frame(s,o,meta){ // header band, section number, title, hint, footer
  const A=meta.assets, bandH=R(.62*IN);
  s.box({x:0,y:0,w:W,h:bandH,fill:C.grd});
  const lh=R(.27*IN);s.pic(A.logoBaz,X0,R((bandH-lh)/2),lh*A.logoBazW/A.logoBazH,lh);
  s.text(X0+R(1.1*IN),0,R(3.2*IN),bandH,para(run('АО «Романов» · Дилерская сеть',{sz:10,color:C.ongm}),{sz:10}),{anchor:'ctr'});
  s.text(W-X0-R(2.9*IN),0,R(2.9*IN),bandH,para(run('Анкета кандидата в дилеры',{sz:10,color:C.ongm}),{algn:'r',sz:10}),{anchor:'ctr'});
  s.text(X0,R(.88*IN),CW,R(.32*IN),para([run(o.num,{sz:13,b:true,color:C.acc}),o.tag?run('   '+o.tag,{sz:10,b:true,caps:true,spc:120,color:C.mut}):''],{sz:13}),{anchor:'ctr'});
  s.text(X0,R(1.2*IN),CW,R(.62*IN),para(run(o.title,{sz:28,b:true}),{sz:28}),{anchor:'ctr'});
  if(o.hint)s.text(X0,R(1.82*IN),CW,R(.55*IN),para(run(o.hint,{sz:12.5,color:C.mut}),{sz:12.5}),{anchor:'t'});
  s.box({x:X0,y:H-R(.48*IN),w:CW,h:9525,fill:C.line});
  s.text(X0,H-R(.44*IN),R(5*IN),R(.3*IN),para(run(meta.footer,{sz:9,color:C.mut}),{sz:9}),{anchor:'ctr'});
  s._page=s.d.slides.indexOf(s)+1;
  s.text(W-X0-R(2*IN),H-R(.44*IN),R(2*IN),R(.3*IN),para(run(String(s._page),{sz:9,color:C.mut}),{algn:'r',sz:9}),{anchor:'ctr'});
}
function kv(s,x,y,w,h,items){ // one white card, items laid out in a row: [label,value,share]
  card(s,x,y,w,h);
  const tot=items.reduce((a,i)=>a+(i[2]||1),0), pad=R(.22*IN);let cx=x+pad;const iw=w-2*pad;
  items.forEach(([k,val,sh],i)=>{const cw=iw*(sh||1)/tot;
    s.text(cx,y+R(.16*IN),cw-R(.15*IN),h-R(.3*IN),para(run(k,{sz:9.5,b:true,caps:true,spc:60,color:C.mut}),{sz:9.5,after:4})+para(run(v(val),{sz:val&&String(val).length>60?11:13,b:true,color:v(val)==='—'?'A4A8AB':C.ink}),{sz:13}),{anchor:'t'});
    if(i)s.box({x:cx-R(.08*IN),y:y+R(.16*IN),w:9525,h:h-R(.32*IN),fill:C.line});
    cx+=cw});
}
function kvGrid(s,x,y,w,h,items,cols){ // label/value pairs in a grid inside one card
  card(s,x,y,w,h);
  const rows=Math.ceil(items.length/cols), pad=R(.3*IN), cw=(w-2*pad)/cols, rh=(h-2*pad)/rows;
  items.forEach(([k,val],i)=>{const cx=x+pad+(i%cols)*cw, cy=y+pad+Math.floor(i/cols)*rh;
    s.text(cx,cy,cw-R(.2*IN),rh,para(run(k,{sz:9.5,b:true,caps:true,spc:60,color:C.mut}),{sz:9.5,after:4})+para(run(v(val),{sz:15,b:true,color:v(val)==='—'?'A4A8AB':C.ink}),{sz:15}),{anchor:'t'})});
}
function photo(s,x,y,w,h,label,p){ // caption + photo (cropped to fill) or an empty placeholder
  const capH=R(.32*IN);
  s.text(x,y,w,capH,para(run(label,{sz:11,b:true}),{sz:11}),{anchor:'t'});
  const py=y+capH, ph=h-capH;
  if(p&&p.url){s.box({x:x-9525,y:py-9525,w:w+19050,h:ph+19050,fill:C.surf,line:C.line});s.pic(p.url,x,py,w,ph,p.w,p.h,'cover')}
  else s.box({x,y:py,w,h:ph,fill:C.sunk,line:C.line,dash:true,r:2500,anchor:'ctr',text:para(run('Фото не приложено',{sz:11,color:C.mut}),{algn:'ctr',sz:11})});
}
function tile(s,x,y,w,h,label,value,sub){
  card(s,x,y,w,h);
  s.box({x,y,w:R(.07*IN),h,fill:C.y});
  s.text(x+R(.28*IN),y+R((h<.8*IN?.09:.14)*IN),w-R(.4*IN),h-R(.15*IN),para(run(label,{sz:9.5,b:true,caps:true,spc:60,color:C.mut}),{sz:9.5,after:2})+para([run(value,{sz:h<.8*IN?19:24,b:true}),sub?run('  '+sub,{sz:12,color:C.mut}):''],{sz:h<.8*IN?19:24}),{anchor:'t'});
}
const chunk=(a,n)=>{const out=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out.length?out:[[]]};

/* ---------- package ---------- */
function build(o,od,photos,meta){
  const A=meta.assets, M=[], mediaIdx=new Map();
  const D={slides:[],media(url){if(!mediaIdx.has(url)){const ext=/^data:image\/png/.test(url)?'png':'jpeg';const n=`img${mediaIdx.size+1}.${ext}`;mediaIdx.set(url,n);M.push([n,url])}return mediaIdx.get(url)}};
  const add=o2=>{const s=new Slide(D,o2);D.slides.push(s);return s};
  const footerText=`${o.c_name||'Кандидат'}${o.c_city?', '+o.c_city:''}`;
  const fm={assets:A,footer:footerText};
  const C2=o._centers&&o._centers.length?o._centers:[{}], SR=o._showrooms&&o._showrooms.length?o._showrooms:[{}];
  const planTot=od.reduce((s,r)=>s+r.q.reduce((a,b)=>a+b,0),0), lines=od.filter(r=>r.q.some(Boolean));
  const nReg=(o._regGroups||[]).reduce((s,g)=>s+g.regions.length,0);

  /* cover */
  {const s=add({bg:C.gr});
   {const hh=H*1.18, hw=hh*A.heroW/A.heroH, ix=W-hw, iy=0;
    const l=Math.max(0,-ix)/hw, b=Math.max(0,iy+hh-H)/hh;
    s.picCrop(A.hero,Math.max(0,ix),iy,hw*(1-l),hh*(1-b),{l,b});}
   const lh=R(.5*IN); s.pic(A.logoBaz,R(.7*IN),R(.62*IN),lh*A.logoBazW/A.logoBazH,lh);
   const rh=R(.17*IN); s.pic(A.logoRomanov,R(.7*IN),R(1.32*IN),rh*A.logoRomanovW/A.logoRomanovH,rh);
   s.box({x:R(.7*IN),y:R(2.55*IN),w:R(.55*IN),h:R(.06*IN),fill:C.y});
   s.text(R(.7*IN),R(2.7*IN),R(5.2*IN),R(.35*IN),para(run('Анкета кандидата в дилеры',{sz:12,b:true,caps:true,spc:150,color:C.y}),{sz:12}),{anchor:'t'});
   s.text(R(.7*IN),R(3.1*IN),R(5*IN),R(2.1*IN),para(run(o.c_name||'Кандидат',{sz:32,b:true,color:C.ong}),{sz:32,ln:95000})+(o.c_city?para(run(o.c_city,{sz:18,color:C.ongm}),{sz:18,before:8}):''),{anchor:'t'});
   s.text(R(.7*IN),R(5.75*IN),R(5*IN),R(.9*IN),para(run('Заявка на заключение дилерского соглашения с АО «Романов»',{sz:12,color:C.ongm}),{sz:12,after:4})+para(run(meta.date,{sz:11,color:C.ongm}),{sz:11}),{anchor:'t'});
  }
  /* 00 Заявка */
  {const s=add();frame(s,{num:'00',tag:'Данные компании',title:'Заявка',hint:'Юридическое лицо и контакты для связи.'},fm);
   const kh=R(2.75*IN);
   kvGrid(s,X0,CT,CW,kh,[['Наименование юрлица',o.c_name],['Город',o.c_city],['ИНН',o.c_inn],['Контактное лицо',o.c_person],['Телефон',o.c_phone],['E-mail',o.c_email],['Сайт',o.c_site],['Дата заявки',meta.date]],4);
   const ty=CT+kh+R(.25*IN), th=CB-ty, tw=(CW-3*R(.2*IN))/4;
   [['Регионов присутствия',String(nReg)],['Дилерских центров',String(C2.length)],['Шоурумов',String(SR.length)],[`План продаж ${meta.year}`,String(planTot),'шт.']].forEach(([l,val,sub],i)=>tile(s,X0+i*(tw+R(.2*IN)),ty,tw,th,l,val,sub));
  }
  /* 01 Регионы присутствия */
  {const s=add();frame(s,{num:'01',tag:'География',title:'Регионы присутствия',hint:'Регионы, где работает компания.'},fm);
   const mw=R(7.4*IN), ch=CB-CT; card(s,X0,CT,mw,ch);
   if(photos.regMapPng)s.pic(photos.regMapPng,X0+R(.2*IN),CT+R(.2*IN),mw-R(.4*IN),ch-R(.4*IN),1000,554.7,'contain');
   const lx=X0+mw+R(.2*IN), lw=CW-mw-R(.2*IN); card(s,lx,CT,lw,ch);
   const groups=(o._regGroups||[]).filter(g=>g.regions.length), chars=groups.reduce((a,g)=>a+g.t.length+g.regions.join(', ').length,0);
   const fs=chars<=350?11.5:chars<=700?10:chars<=1200?8.5:chars<=1900?7.5:6.5;
   let t=para([run('Выбрано регионов: ',{sz:10,b:true,caps:true,spc:60,color:C.mut}),run(String(nReg),{sz:16,b:true})],{sz:16,after:8});
   groups.forEach(g=>{t+=para([run(g.t+' ФО',{sz:fs,b:true,color:C.acc}),run(' — '+g.regions.join(', '),{sz:fs})],{sz:fs,after:fs*.5})});
   if(!groups.length)t+=para(run('Регионы не выбраны',{sz:12,color:C.mut}),{sz:12});
   s.text(lx+R(.25*IN),CT+R(.22*IN),lw-R(.5*IN),ch-R(.4*IN),t,{anchor:'t'});
  }
  /* 02 Продажи по годам */
  {const rows=(o._sales||[]).map(r=>[r.brand,r.y24,r.y25,r.y26]);
   chunk(rows,9).forEach((part,k)=>{const s=add();frame(s,{num:'02',tag:'Объём продаж',title:'Продажи по годам'+(k?' (продолжение)':''),hint:'Продажи новой техники по брендам, шт.'},fm);
     s.table(X0,CT,[CW*.4,CW*.2,CW*.2,CW*.2],['Бренд','2024','2025','2026 по н.в.'],part.length?part:[['','','','']],{align:['l','ctr','ctr','ctr'],boldFirst:true})});
  }
  /* 03 Ближайшие бренды в городе */
  {const rows=(o._comp||[]).map(r=>[r.name,r.addr]);
   chunk(rows,7).forEach((part,k)=>{const s=add();frame(s,{num:'03',tag:'Конкуренты',title:'Ближайшие бренды в городе'+(k?' (продолжение)':''),hint:'Дилерские центры других грузовых брендов рядом с кандидатом.'},fm);
     if(k===0){const tw=R(6.9*IN);s.table(X0,CT,[tw*.4,tw*.6],['Название (бренд)','Адрес'],part.length?part:[['','']],{boldFirst:true});
       photo(s,X0+tw+R(.3*IN),CT,CW-tw-R(.3*IN),CB-CT,'Расположение на карте других брендов',photos.compMap0)}
     else s.table(X0,CT,[CW*.35,CW*.65],['Название (бренд)','Адрес'],part,{boldFirst:true})});
  }
  /* 04 Территория центра — one slide per dealer centre */
  C2.forEach((c,j)=>{const t=j?'_'+j:'', s=add();
    frame(s,{num:'04',tag:'Расположение',title:'Территория центра'+(C2.length>1?` ${j+1}`:''),hint:'Где находится центр и как он выглядит со стороны.'},fm);
    const kh=R(1.15*IN); kv(s,X0,CT,CW,kh,[['Адрес дилерского центра',c.addr,2.2],['Контактный телефон',c.phone,1.1],['E-mail',c.email,1.3],['Ссылка на карту',c.link,1.6]]);
    const py=CT+kh+R(.25*IN), pw=(CW-R(.3*IN))/2, ph=CB-py;
    photo(s,X0,py,pw,ph,'Расположение компании на карте',photos['siteMap0'+t]);
    photo(s,X0+pw+R(.3*IN),py,pw,ph,'Фотография центра со стороны',photos['facade0'+t]);
  });
  /* 05 Шоурум — one slide per showroom */
  SR.forEach((h,j)=>{const t=j?'_'+j:'', s=add();
    frame(s,{num:'05',tag:'Выставочный зал',title:'Шоурум'+(SR.length>1?` ${j+1}`:''),hint:'Общая информация о выставочном зале и фотографии.'},fm);
    const kh=R(1.15*IN); kv(s,X0,CT,CW,kh,[['Адрес шоурума',h.name,2.6],['Площадь, м²',h.area,1],['Зон для демонстрации',h.zones,1.2],['Стойка регистрации',h.desk,1.1]]);
    const py=CT+kh+R(.25*IN), gap=R(.25*IN), pw=(CW-2*gap)/3, ph=CB-py;
    [0,1,2].forEach(i=>photo(s,X0+i*(pw+gap),py,pw,ph,`Фото шоурума ${i+1}`,photos['showroom'+i+t]));
  });
  /* 06 Маркетинг */
  {const rows=(o._mkt||[]).map(r=>[r.year,r.city,r.act]);
   chunk(rows,8).forEach((part,k)=>{const s=add();frame(s,{num:'06',tag:'Выставки и форумы',title:'Маркетинг'+(k?' (продолжение)':''),hint:'Участие в выставках, форумах и отраслевых мероприятиях.'},fm);
     s.table(X0,CT,[CW*.14,CW*.3,CW*.56],['Год','Город','Активность'],part.length?part:[['','','']],{align:['ctr','l','l']})});
  }
  /* 07 Ключевые клиенты */
  {const rows=(o._cli||[]).map(r=>[r.name,r.term,r.model,r.type,r.y25,r.y26]);
   chunk(rows,7).forEach((part,k)=>{const s=add();frame(s,{num:'07',tag:'Клиентская база',title:'Ключевые клиенты'+(k?' (продолжение)':''),hint:`Ключевые клиенты за 2025 год и ${meta.year} год по настоящее время.`},fm);
     s.table(X0,CT,[CW*.24,CW*.15,CW*.18,CW*.15,CW*.13,CW*.15],['Компания','Срок сотрудничества','Марка / модель','Тип ТС','2025','2026 по н.в.'],part.length?part:[['','','','','','']],{align:['l','l','l','l','ctr','ctr'],boldFirst:true,fs:10.5})});
  }
  return pkg(D,M,'Анкета кандидата — '+(o.c_name||''));
}
/* ---------- .pptx package around the slides ---------- */
function pkg(D,M,title){
  const f={};
  const ns='xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const grp='<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  f['[Content_Types].xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${D.slides.map((_,i)=>`<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>`;
  f['_rels/.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${REL}extended-properties" Target="docProps/app.xml"/></Relationships>`;
  f['docProps/core.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${XE(title)}</dc:title><dc:creator>АО «Романов»</dc:creator></cp:coreProperties>`;
  f['docProps/app.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office PowerPoint</Application><Slides>${D.slides.length}</Slides></Properties>`;
  f['ppt/presentation.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${ns} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdM"/></p:sldMasterIdLst><p:sldIdLst>${D.slides.map((_,i)=>`<p:sldId id="${256+i}" r:id="rIdS${i+1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${W}" cy="${H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
  f['ppt/_rels/presentation.xml.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdM" Type="${REL}slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rIdT" Type="${REL}theme" Target="theme/theme1.xml"/>${D.slides.map((_,i)=>`<Relationship Id="rIdS${i+1}" Type="${REL}slide" Target="slides/slide${i+1}.xml"/>`).join('')}</Relationships>`;
  f['ppt/slideMasters/slideMaster1.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster ${ns}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${C.bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>${grp}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rIdL1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="2800"><a:latin typeface="${FONT}"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1400"><a:latin typeface="${FONT}"/></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1200"><a:latin typeface="${FONT}"/></a:defRPr></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`;
  f['ppt/slideMasters/_rels/slideMaster1.xml.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdL1" Type="${REL}slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rIdT" Type="${REL}theme" Target="../theme/theme1.xml"/></Relationships>`;
  f['ppt/slideLayouts/slideLayout1.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ${ns} type="blank" preserve="1"><p:cSld name="Пустой"><p:spTree>${grp}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
  f['ppt/slideLayouts/_rels/slideLayout1.xml.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdM" Type="${REL}slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
  f['ppt/theme/theme1.xml']=theme();
  D.slides.forEach((s,i)=>{f[`ppt/slides/slide${i+1}.xml`]=s.xml();f[`ppt/slides/_rels/slide${i+1}.xml.rels`]=s.relsXml()});
  M.forEach(([n,url])=>{f['ppt/media/'+n]=b64(url)});
  return {bytes:BAZFill.zip(f),slides:D.slides.length};
}
function theme(){
  const clr=(n,c)=>`<a:${n}><a:srgbClr val="${c}"/></a:${n}>`;
  const sf='<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="БАЗ"><a:themeElements><a:clrScheme name="БАЗ">${clr('dk1',C.ink)}${clr('lt1','FFFFFF')}${clr('dk2',C.grd)}${clr('lt2',C.bg)}${clr('accent1',C.y)}${clr('accent2',C.gr)}${clr('accent3',C.acc)}${clr('accent4',C.mut)}${clr('accent5',C.line)}${clr('accent6','2F7D4F')}${clr('hlink','1F5FBF')}${clr('folHlink','5B5F62')}</a:clrScheme><a:fontScheme name="БАЗ"><a:majorFont><a:latin typeface="${FONT}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="${FONT}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="БАЗ"><a:fillStyleLst>${sf}${sf}${sf}</a:fillStyleLst><a:lnStyleLst><a:ln w="9525">${sf}</a:ln><a:ln w="19050">${sf}</a:ln><a:ln w="28575">${sf}</a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>${sf}${sf}${sf}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}
return {build};
})();
if(typeof module!=='undefined')module.exports=BAZDeck;
