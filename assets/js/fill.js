/* Fills AO «Romanov» templates in the browser. No external libraries: store-only ZIP writer + string templating. */
const BAZFill=(function(){
const NB=' ';
const XE=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function b64ToBytes(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
const dataUrlBytes=u=>b64ToBytes(u.slice(u.indexOf(',')+1));
const enc=new TextEncoder();

/* ---- ZIP (method 0 / store) ---- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zip(files){
  const names=Object.keys(files).sort((a,b)=>a==='[Content_Types].xml'?-1:b==='[Content_Types].xml'?1:0);
  const d=new Date(),time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const parts=[],central=[];let off=0;
  for(const n of names){
    const v=files[n], data=typeof v==='string'?enc.encode(v):v, nm=enc.encode(n), crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
    h.setUint16(10,time,true);h.setUint16(12,date,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);
    h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),nm,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
    c.setUint16(12,time,true);c.setUint16(14,date,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);
    c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),nm);
    off+=30+nm.length+data.length;
  }
  const csize=central.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,names.length,true);e.setUint16(10,names.length,true);e.setUint32(12,csize,true);e.setUint32(16,off,true);
  const all=[...parts,...central,new Uint8Array(e.buffer)],out=new Uint8Array(all.reduce((a,b)=>a+b.length,0));let p=0;for(const a of all){out.set(a,p);p+=a.length}
  return out;
}
function unpack(pack){const f={};for(const [k,v] of Object.entries(pack.files))f[k]=v.s!=null?v.s:b64ToBytes(v.b);return f}
function replaceAll(files,token,val){for(const k in files)if(typeof files[k]==='string'&&files[k].includes(token))files[k]=files[k].split(token).join(val)}

/* Copies a slide (with its placeholders suffixed _1, _2…) right after itself; numbers the slide titles when there is more than one. */
function dupSlide(f,base,n,title){
  const paths=[base];
  if(n>1){
    const num=base.match(/slide(\d+)\.xml$/)[1], relsOf=p=>p.replace('slides/','slides/_rels/')+'.rels';
    let pres=f['ppt/presentation.xml'], prels=f['ppt/_rels/presentation.xml.rels'], ct=f['[Content_Types].xml'];
    const rel=prels.match(new RegExp('<Relationship [^>]*Target="slides/slide'+num+'\\.xml"[^>]*/>'))[0], baseRid=rel.match(/Id="([^"]+)"/)[1];
    const anchor=pres.match(new RegExp('<p:sldId id="\\d+" r:id="'+baseRid+'"/>'))[0];
    let maxId=Math.max(...[...pres.matchAll(/<p:sldId id="(\d+)"/g)].map(m=>+m[1]));
    let maxN=Math.max(...Object.keys(f).map(k=>+((k.match(/^ppt\/slides\/slide(\d+)\.xml$/)||[])[1]||0)));
    let ins='';
    for(let j=1;j<n;j++){
      const k=++maxN, path=`ppt/slides/slide${k}.xml`, rid='rIdDup'+k;
      f[path]=f[base].replace(/\{\{(\w+):(\w+)\}\}/g,(m,a,b)=>`{{${a}:${b}_${j}}}`).replace(/\{\{(\w+)\}\}/g,(m,a)=>`{{${a}_${j}}}`);
      f[relsOf(path)]=f[relsOf(base)].replace(/<Relationship [^>]*notesSlide[^>]*\/>/,'').replace(/\{\{IMG:(\w+)\}\}/g,(m,a)=>`{{IMG:${a}_${j}}}`);
      prels=prels.replace('</Relationships>',`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${k}.xml"/></Relationships>`);
      ct=ct.replace('</Types>',`<Override ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml" PartName="/${path}"/></Types>`);
      ins+=`<p:sldId id="${++maxId}" r:id="${rid}"/>`; paths.push(path);
    }
    f['ppt/presentation.xml']=pres.replace(anchor,anchor+ins); f['ppt/_rels/presentation.xml.rels']=prels; f['[Content_Types].xml']=ct;
    paths.forEach((p,i)=>{f[p]=f[p].replace(`<a:t>${title}</a:t>`,`<a:t>${title} ${i+1}</a:t>`)});
  }
  return paths;
}

/* ---- Анкета кандидата (.pptx) ---- */
function anketa(pack,o,photos){
  const f=unpack(pack);
  const data={
    sales:o._sales.map(r=>[r.brand,r.y24,r.y25,r.y26]),
    comp:o._comp.map(r=>[r.name,r.addr]),
    mkt:o._mkt.map(r=>[r.year,r.city,r.act]),
    cli:o._cli.map(r=>[r.name,r.term,r.model,r.type,r.y25,r.y26])
  };
  /* clients table header: Компания | Срок сотрудничества | Марка/модель | Тип ТС | 2025 | 2026 */
  {let x=f['ppt/slides/slide7.xml'];
   [[/<a:t>Наименование компании\/Срок сотрудничества<\/a:t>/,'Наименование компании'],[/<a:t>Модель\/марка<\/a:t>/,'Срок сотрудничества'],[/<a:t>Кол-во[\s\u00a0]*<\/a:t>/,'Марка/модель'],[/<a:t>Тип<\/a:t>/,'Тип ТС']].forEach(([re,t])=>{if(!re.test(x))throw new Error('шапка таблицы клиентов: '+t);x=x.replace(re,`<a:t>${t}</a:t>`)});
   const W=[2200000,1750000,1650000,1500000,1200000,1253575];let k=0;x=x.replace(/<a:gridCol w="\d+"/g,m=>k<W.length?`<a:gridCol w="${W[k++]}"`:m);
   f['ppt/slides/slide7.xml']=x;}
  /* marketing table: extra «Год» column in front (copy of the «Город» column) */
  const ROWS=Object.assign({},pack.rows);
  {const firstTc=x=>x.slice(x.indexOf('<a:tc>'),x.indexOf('</a:tc>')+7);
   let s6=f['ppt/slides/slide6.xml'];
   const hd=firstTc(s6); if(!hd.includes('<a:t>Город</a:t>'))throw new Error('шапка таблицы маркетинга');
   s6=s6.replace(hd,hd.replace('<a:t>Город</a:t>','<a:t>Год</a:t>')+hd);
   s6=s6.replace(/<a:tblGrid><a:gridCol w="6072900"\/><a:gridCol w="4442700"\/><\/a:tblGrid>/,'<a:tblGrid><a:gridCol w="1500000"/><a:gridCol w="4572900"/><a:gridCol w="4442700"/></a:tblGrid>');
   if(!s6.includes('<a:gridCol w="1500000"/>'))throw new Error('сетка таблицы маркетинга');
   f['ppt/slides/slide6.xml']=s6;
   const t=pack.rows.mkt.tpl, c0=firstTc(t), rest=t.replace(c0,'').replace('{{c1}}','{{c2}}');
   ROWS.mkt=Object.assign({},pack.rows.mkt,{tpl:rest.replace('<a:tr h="779275">','<a:tr h="779275">'+c0+c0.replace('{{c0}}','{{c1}}'))});}
  for(const [key,R] of Object.entries(ROWS)){
    const list=data[key]||[], n=Math.max(R.min,list.length);let xml='';
    for(let i=0;i<n;i++){const row=list[i]||[];xml+=R.tpl.replace(/\{\{c(\d+)\}\}/g,(m,j)=>{const v=row[+j];return v===undefined||v===null||v===''?NB:XE(v)})}
    replaceAll(f,'{{ROWS:'+key+'}}',xml);
  }
  /* one territory slide per dealer centre, one showroom slide per showroom */
  const C=o._centers&&o._centers.length?o._centers:[{}], SR=o._showrooms&&o._showrooms.length?o._showrooms:[{}];
  f['ppt/slides/slide5.xml']=f['ppt/slides/slide5.xml'].replace('<a:t>Общая информация о выставочном зале</a:t>','<a:t>Общая информация о выставочном зале{{SRNAME}}</a:t>');
  dupSlide(f,'ppt/slides/slide4.xml',C.length,'ТЕРРИТОРИЯ ЦЕНТРА');
  dupSlide(f,'ppt/slides/slide5.xml',SR.length,'ШОУРУМ');
  const T={TITLE:`${o.c_name}, ${o.c_city}`,S2NOTE:''};
  C.forEach((c,j)=>{const t=j?'_'+j:'';T['MAP_NOTE'+t]='Расположение вашей компании на карте';T['FACADE_NOTE'+t]=photos['facade0'+t]?'':'Фото не приложено'});
  SR.forEach((h,j)=>{const t=j?'_'+j:'';T['AREA'+t]=h.area||'…';T['ZONES'+t]=h.zones||'…';T['DESK'+t]=h.desk?String(h.desk).toLowerCase():'…';T['SRNAME'+t]=h.name?': '+h.name:''});
  for(const [k,v] of Object.entries(T))replaceAll(f,'{{'+k+'}}',XE(v));
  const slotKeys=new Set();for(const k in f)if(typeof f[k]==='string')for(const m of f[k].matchAll(/\{\{IMG:(\w+)\}\}/g))slotKeys.add(m[1]);
  for(const key of slotKeys){
    const S=pack.slots[key.replace(/_\d+$/,'')]; if(!S)throw new Error('нет слота '+key);
    const p=photos[key];let target=S.def,crop='<a:srcRect b="0" l="0" r="0" t="0"/>';
    if(p){
      const name='cand_'+key+'.jpeg';f['ppt/media/'+name]=dataUrlBytes(p.url);target='../media/'+name;
      const A=S.cx/S.cy,a=p.w/p.h;
      if(a>A){const c=Math.round((1-A/a)/2*100000);crop=`<a:srcRect b="0" l="${c}" r="${c}" t="0"/>`}
      else if(a<A){const c=Math.round((1-a/A)/2*100000);crop=`<a:srcRect b="${c}" l="0" r="0" t="${c}"/>`}
    }
    replaceAll(f,'{{IMG:'+key+'}}',target);replaceAll(f,'{{CROP:'+key+'}}',crop);
  }
  /* regions slide: map picture + list grouped by federal district */
  if(pack.regMap&&photos.regMapPng)f[pack.regMap]=dataUrlBytes(photos.regMapPng);
  const rp=(t,o2={})=>`<a:r><a:rPr lang="ru-RU" sz="${o2.sz||1100}"${o2.b?' b="1"':''} dirty="0"><a:solidFill><a:srgbClr val="${o2.c||'000000'}"/></a:solidFill><a:latin typeface="Arial"/><a:cs typeface="Arial"/></a:rPr><a:t>${XE(t)}</a:t></a:r>`;
  const para=(runs)=>`<a:p><a:pPr><a:spcAft><a:spcPts val="400"/></a:spcAft></a:pPr>${runs}</a:p>`;
  const groups=(o._regGroups||[]).filter(g=>g.regions.length);
  const total=groups.reduce((s,g)=>s+g.regions.length,0);
  let rl=para(rp('Выбрано регионов: ',{c:'5F5F5F'})+rp(String(total),{b:true}));
  groups.forEach(g=>{rl+=para(rp(g.t+' ФО',{b:true,c:'0070C0'})+rp(' — '+g.regions.join(', ')))});
  if(!groups.length)rl=para(rp('Регионы не выбраны',{c:'808080'}));
  replaceAll(f,'{{REGLIST}}',rl);
  for(const k in f)if(typeof f[k]==='string'&&/\{\{[\w:]+\}\}/.test(f[k]))throw new Error('шаблон заполнен не полностью: '+k);
  return zip(f);
}

/* ---- План продаж (.xlsx) ---- */
function setCell(xml,ref,inner,t){
  const re=new RegExp('<c r="'+ref+'"( s="\\d+")?(?: t="\\w+")?\\s*/>');
  if(!re.test(xml))throw new Error('нет ячейки '+ref);
  return xml.replace(re,(m,s)=>`<c r="${ref}"${s||''}${t?` t="${t}"`:''}>${inner}</c>`);
}
const COLS='CDEFGHIJKLMN';
function plan(pack,o,orderRows){
  const f=unpack(pack);let sh=f[pack.sheet];
  sh=setCell(sh,'C5',`<is><t>${XE(o.c_name)}</t></is>`,'inlineStr');
  sh=setCell(sh,'K5',`<is><t>${XE(o.c_city)}</t></is>`,'inlineStr');
  orderRows.forEach((r,i)=>{const row=pack.rows[i];r.q.forEach((v,j)=>{if(v>0)sh=setCell(sh,COLS[j]+row,`<v>${v}</v>`)})});
  const yes=o.adv_ready==='Да'||o.adv_ready==='Да, частично';
  const lines=[['P47',`Готовность авансирования: ${o.adv_ready||'—'}`],['P48',yes?`Готовы авансировать: ${o.adv_qty||'—'} шт.`:''],['P49',yes?`Размер аванса: ${o.adv_pct||'—'}%`:'']];
  lines.forEach(([ref,t])=>{if(t)sh=setCell(sh,ref,`<is><t>${XE(t)}</t></is>`,'inlineStr')});
  f[pack.sheet]=sh;
  return zip(f);
}
/* ---- Чек-лист кандидата (.docx), built from scratch in brand style ---- */
function checklist(o,od,photos,logo,meta){
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const run=(t,opt={})=>{const pr=[opt.b?'<w:b/>':'',opt.i?'<w:i/>':'',opt.color?`<w:color w:val="${opt.color}"/>`:'',opt.sz?`<w:sz w:val="${opt.sz}"/><w:szCs w:val="${opt.sz}"/>`:'',opt.caps?'<w:caps/>':'',opt.sp?`<w:spacing w:val="${opt.sp}"/>`:''].join('');
    return String(t).split('\n').map((line,i)=>(i?'<w:r><w:br/></w:r>':'')+`<w:r>${pr?`<w:rPr>${pr}</w:rPr>`:''}<w:t xml:space="preserve">${XE(line)}</w:t></w:r>`).join('')};
  const para=(content,opt={})=>{const pp=[opt.style?`<w:pStyle w:val="${opt.style}"/>`:'',opt.border?`<w:pBdr><w:bottom w:val="single" w:sz="18" w:space="4" w:color="${opt.border}"/></w:pBdr>`:'',`<w:spacing w:before="${opt.before??0}" w:after="${opt.after??80}"/>`,opt.jc?`<w:jc w:val="${opt.jc}"/>`:''].join('');
    return `<w:p><w:pPr>${pp}</w:pPr>${typeof content==='string'?run(content,opt):content.join('')}</w:p>`};
  const cell=(content,w,opt={})=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${opt.fill?`<w:shd w:val="clear" w:color="auto" w:fill="${opt.fill}"/>`:''}${opt.span?`<w:gridSpan w:val="${opt.span}"/>`:''}<w:vAlign w:val="center"/></w:tcPr>${Array.isArray(content)?content.join(''):para(content,Object.assign({after:0},opt))}</w:tc>`;
  const table=(rows,widths,opt={})=>{const bd=opt.noBorder?'none':'single',c=opt.border||'D3D4D0';
    return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a,b)=>a+b,0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(k=>`<w:${k} w:val="${bd}" w:sz="4" w:space="0" w:color="${c}"/>`).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>`};
  const tr=(cells,head)=>`<w:tr>${head?'<w:trPr><w:tblHeader/></w:trPr>':''}${cells.join('')}</w:tr>`;
  const H=(t)=>para(t,{style:'H2',before:260,after:100});
  const v=x=>x===undefined||x===null||String(x).trim()===''?'—':String(x);
  const OK='2F7D4F',MID='8A6D00',NO='8A8D90';
  const st=(k,txt)=>({k,txt});
  const yes=o.adv_ready==='Да'||o.adv_ready==='Да, частично';
  const planTot=od.reduce((s,r)=>s+r.q.reduce((a,b)=>a+b,0),0), models=od.filter(r=>r.q.some(Boolean)).length;
  const monthsTot=od[0]?od[0].q.map((_,j)=>od.reduce((s,r)=>s+r.q[j],0)):[];
  const C=o._centers&&o._centers.length?o._centers:[{}], SR=o._showrooms&&o._showrooms.length?o._showrooms:(o._centers&&o._centers.length?[]:[{}]), mc=C.length>1, ms=SR.length>1;
  const centerItems=C.flatMap((c,j)=>{const t=j?'_'+j:'',off=c.type==='Офис',L=mc?`4. ${off?'Офис':'Центр'} ${j+1}: `:'4. ';return [
    [L+(mc?'адрес':off?'Адрес офиса':'Адрес дилерского центра'),true,c.addr?st('ok','Указан'):st('no','Не указан')],
    ...(off?[]:[
    [L+(mc?'карта расположения':'Карта расположения компании'),false,photos['siteMap0'+t]?st('ok','Приложена'):st('no','Не приложена')],
    [L+(mc?'фото со стороны':'Фото центра со стороны'),false,photos['facade0'+t]?st('ok','Приложено'):st('no','Не приложено')]])]});
  const showItems=SR.flatMap((h,j)=>{const t=j?'_'+j:'',nShow=[0,1,2].filter(i=>photos['showroom'+i+t]).length;return [
    [(ms?`5. Центр ${j+1}: адрес`:'5. Адрес центра'),true,h.name?st('ok','Указан'):st('no','Не указан')],
    [(ms?`5. Центр ${j+1}`:'5. Оснащение')+': площадь, посты, выездной сервис, учебный класс',false,(h.area||h.zones||h.desk||h.cls)?((h.area&&h.zones&&h.desk&&h.cls)?st('ok','Заполнено'):st('mid','Частично')):st('no','Нет данных')],
    [(ms?`5. Центр ${j+1}: фото`:'5. Фото центра'),false,nShow===3?st('ok','3 из 3'):nShow?st('mid',`${nShow} из 3`):st('no','Не приложены')]]});
  const items=[
    ['Заявка: юрлицо, город, ИНН, контакты',true,st('ok','Заполнено')],
    ['1. Регионы присутствия',true,o.regions?st('ok',`Регионов: ${o.regions.split(';').filter(x=>x.trim()).length}`):st('no','Не выбраны')],
    ['2. Продажи по годам',true,o._sales.length?st('ok',`Брендов: ${o._sales.filter(r=>r.brand).length}`):st('no','Нет данных')],
    ['3. Ближайшие бренды в городе',true,o._comp.length?st('ok',`Брендов: ${o._comp.filter(r=>r.name).length}`):st('no','Нет данных')],
    ['3. Карта расположения других брендов',false,photos.compMap0?st('ok','Приложена'):st('no','Не приложена')],
    ...centerItems,
    ...showItems,
    ['6. Маркетинг',false,o._mkt.length?st('ok',`Мероприятий: ${o._mkt.length}`):st('no','Нет данных')],
    ['7. Ключевые клиенты',false,o._cli.length?st('ok',`Клиентов: ${o._cli.length}`):st('no','Нет данных')],
    ['Подтверждение достоверности сведений',true,o.x_true?st('ok','Подтверждено'):st('no','Нет')],
    ['Согласие на обработку персональных данных',true,o.x_pd?st('ok','Дано'):st('no','Нет')],
  ];
  const mark={ok:['✓',OK],mid:['~',MID],no:['—',NO]};
  const filled=items.filter(x=>x[2].k==='ok').length;
  const WT=9638;
  let body='';
  // header: logo + title
  const logoRun=`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1097280" cy="365760"/><wp:docPr id="1" name="Логотип БАЗ"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1097280" cy="365760"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  body+=table([tr([cell([`<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${logoRun}</w:p>`],2400),
    cell([para('Чек-лист кандидата',{b:true,sz:34,after:20,jc:'right'}),para(`в дилеры БАЗ · АО «Романов» · ${meta.date}`,{color:'5B5F62',sz:18,after:0,jc:'right'})],WT-2400)])],[2400,WT-2400],{noBorder:true});
  body+=para('',{border:'FFCD1C',after:120});
  body+=para([run(o.c_name,{b:true,sz:28}),run(`   ${o.c_city}`,{color:'5B5F62',sz:22})],{after:60});
  body+=para(`Заполнено пунктов: ${filled} из ${items.length}. Обязательные пункты отмечены звездочкой.`,{color:'5B5F62',sz:18,after:0});

  body+=H('Данные компании');
  const comp=[['Наименование юрлица',o.c_name],['Город',o.c_city],['Регионы присутствия',o.regions],['ИНН',o.c_inn],['Контактное лицо',o.c_person],['Должность',o.c_pos],['Телефон',o.c_phone],['E-mail',o.c_email],['Сайт',o.c_site],...C.flatMap((c,j)=>{const n=mc?' '+(j+1):'',off=c.type==='Офис';return [[`Тип объекта${n}`,c.type],[`Адрес ${off?'офиса':'дилерского центра'}${n}`,c.addr],[`Телефон${n}`,c.phone],[`E-mail${n}`,c.email],[`Ссылка на карту${n}`,c.link]]}),...SR.map((h,j)=>[`Адрес центра (оснащение)${ms?' '+(j+1):''}`,h.name])];
  body+=table(comp.map(([k,x])=>tr([cell(k,3200,{fill:'F3F3F1',color:'5B5F62'}),cell(v(x),WT-3200,{b:true})])),[3200,WT-3200]);

  body+=H('Комплектность анкеты');
  body+=table([tr([cell('Пункт',5400,{fill:'FFF2CC',b:true,sz:18}),cell('Статус',WT-5400,{fill:'FFF2CC',b:true,sz:18})],true),
    ...items.map(([name,req,s])=>tr([cell([para([run(name),req?run(' *',{color:'B3261E'}):''],{after:0})],5400),cell([para([run(mark[s.k][0]+'  ',{b:true,color:mark[s.k][1]}),run(s.txt,{color:s.k==='no'?NO:'1F2122'})],{after:0})],WT-5400)]))],[5400,WT-5400]);

  body+=H('Файлы для отправки');
  meta.files.forEach(n=>{body+=para([run('☐  ',{color:'5B5F62'}),run(n)],{after:40})});
  body+=para(`Отправьте файлы на ${meta.email} — ${meta.manager}, ${meta.phone}.`,{before:80,color:'5B5F62',sz:18});

  body+=H('Отметки АО «Романов»');
  body+=table([['Дата получения',''],['Специалист по работе с дилерами',meta.manager],['Проверено, замечания',''],['Подпись','']].map(([k,x])=>tr([cell(k,3200,{fill:'F3F3F1',color:'5B5F62'}),cell(x||' ',WT-3200)])),[3200,WT-3200]);

  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1134" w:bottom="1000" w:left="1134" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:color w:val="1F2122"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="ru-RU"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="H2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="1F2122"/><w:spacing w:val="10"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style></w:styles>`;
  const files={
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
    '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
    'docProps/core.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${XE('Чек-лист кандидата — '+o.c_name)}</dc:title><dc:creator>АО «Романов»</dc:creator></cp:coreProperties>`,
    'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>',
    'word/document.xml':doc,'word/styles.xml':styles,'word/media/logo.png':dataUrlBytes(logo)
  };
  return zip(files);
}
return {anketa,plan,checklist,zip,crc32};
})();
if(typeof module!=='undefined')module.exports=BAZFill;
