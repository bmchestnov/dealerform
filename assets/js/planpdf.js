/* Sales plan as a one-page A4 PDF, laid out like the AO «Romanov» Excel order form
   (all models by group, months, totals, configuration, cabin legend, advance, signature)
   in the website / deck style. Self-contained PDF writer: embedded Liberation Sans subset (Identity-H). */
const BAZPlanPdf=(function(){
const PW=595.28, PH=841.89, M=28, CW=PW-2*M;
const C={grd:'373A3B',bg:'F3F3F1',surf:'FFFFFF',sunk:'E9E9E6',ink:'1F2122',mut:'5B5F62',line:'D3D4D0',lineL:'E4E4E0',y:'FFCD1C',ys:'FFF4C9',hl:'FFFAE6',acc:'7D6200',ongm:'B9BCBD',faint:'A4A8AB'};
const enc=new TextEncoder();
const b64=s=>{const t=atob(s),a=new Uint8Array(t.length);for(let i=0;i<t.length;i++)a[i]=t.charCodeAt(i);return a};
const rgb=h=>[0,2,4].map(i=>(parseInt(h.substr(i,2),16)/255).toFixed(3)).join(' ');
const n=x=>(Math.round(x*100)/100).toString();

function build(o,od,meta){
  const A=meta.assets, F={R:A.Regular,B:A.Bold};
  const glyph=(f,ch)=>{const g=f.map[ch.codePointAt(0)];return g===undefined?(f.map[63]||0):g};
  const width=(s,sz,f)=>{let w=0;for(const ch of String(s))w+=(f.w[glyph(f,ch)]||500);return w*sz/1000};
  const hex=(s,f)=>{let h='';for(const ch of String(s))h+=glyph(f,ch).toString(16).padStart(4,'0');return h};
  let cs='';
  const Y=y=>n(PH-y);
  const rect=(x,y,w,h,fill,stroke,lw)=>{cs+=`q ${fill?rgb(fill)+' rg ':''}${stroke?rgb(stroke)+' RG '+n(lw||.5)+' w ':''}${n(x)} ${Y(y+h)} ${n(w)} ${n(h)} re ${fill&&stroke?'B':fill?'f':'S'} Q\n`};
  const line=(x1,y1,x2,y2,c,lw)=>{cs+=`q ${rgb(c)} RG ${n(lw||.5)} w ${n(x1)} ${Y(y1)} m ${n(x2)} ${Y(y2)} l S Q\n`};
  const text=(s,x,y,sz,o2={})=>{ // y = baseline from top
    s=String(s??''); if(!s)return; const f=o2.b?F.B:F.R, sp=o2.sp||0;
    if(o2.caps)s=s.toUpperCase();
    const w=width(s,sz,f)+sp*Math.max(0,[...s].length-1);
    const tx=o2.al==='r'?x-w:o2.al==='c'?x-w/2:x;
    cs+=`BT /${o2.b?'F2':'F1'} ${n(sz)} Tf ${n(sp)} Tc ${rgb(o2.c||C.ink)} rg ${n(tx)} ${Y(y)} Td <${hex(s,f)}> Tj ET\n`;
  };
  const wrap=(s,maxW,sz,b)=>{const f=b?F.B:F.R,words=String(s||'').replace(/\s+/g,' ').trim().split(' ');const out=[];let cur='';
    for(const wd of words){const t=cur?cur+' '+wd:wd;if(width(t,sz,f)<=maxW||!cur)cur=t;else{out.push(cur);cur=wd}}if(cur)out.push(cur);return out};
  const imgs=[];const image=(key,x,y,h)=>{const L=A.logos[key],w=h*L.w/L.h;imgs.push(key);cs+=`q ${n(w)} 0 0 ${n(h)} ${n(x)} ${Y(y+h)} cm /Im${key} Do Q\n`;return w};

  /* page background + graphite band with logos */
  rect(0,0,PW,PH,C.bg);
  rect(0,0,PW,40,C.grd);
  const lw=image('baz',M,12,16);
  text('АО «Романов» · Дилерская сеть',M+lw+14,24.5,8,{c:C.ongm});
  const rw=A.logos.romanov.w/A.logos.romanov.h*9; image('romanov',PW-M-rw,15.5,9);

  /* title */
  text('08',M,62,9.5,{b:true,c:C.acc});
  text('Продажи по месяцам',M+17,62,7,{b:true,caps:true,sp:.9,c:C.mut});
  text(`План продаж на ${meta.year} год`,M,84,19,{b:true});

  /* dealer card */
  const cy=96, ch=36; rect(M,cy,CW,ch,C.surf,C.line,.6);
  const kv=[['Наименование дилера',o.c_name||'—',.5],['Город',o.c_city||'—',.3],['Дата',meta.date,.2]];
  let kx=M+12; kv.forEach(([k,val,sh],i)=>{const w=(CW-24)*sh;
    if(i)line(kx-8,cy+8,kx-8,cy+ch-8,C.line,.5);
    text(k,kx,cy+14,6,{b:true,caps:true,sp:.6,c:C.mut});
    const vv=wrap(val,w-14,10,true)[0]||'—'; text(vv,kx,cy+27,10,{b:true});
    kx+=w});

  /* table geometry */
  const MON=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const groups=[];od.forEach(r=>{let g=groups.find(x=>x.g===r.g);if(!g){g={g:r.g,rows:[]};groups.push(g)}g.rows.push(r)});
  const cM=64, cMo=20, cT=28, cC=CW-cM-12*cMo-cT;
  const xM=M, xMo=xM+cM, xT=xMo+12*cMo, xC=xT+cT;
  const ty=142, hH=17, gH=12, tH=15, footH=118;
  const nRows=od.length, rH=Math.min(16,(PH-M-footH-ty-hH-groups.length*gH-tH)/nRows);
  const fsN=7.2, fsM=6.6, fsC=Math.min(6,rH*.42);
  let y=ty;
  /* header */
  rect(M,y,CW,hH,C.ys);
  const hy=y+hH/2+2.3;
  text('Модель',xM+6,hy,6,{b:true,caps:true,sp:.4});
  MON.forEach((m,j)=>text(m,xMo+j*cMo+cMo/2,hy,5.8,{b:true,caps:true,al:'c'}));
  text('Итого',xT+cT/2,hy,5.8,{b:true,caps:true,al:'c'});
  text('Особенности комплектации',xC+6,hy,6,{b:true,caps:true,sp:.4});
  y+=hH;
  const monthTot=MON.map(()=>0); let grand=0;
  groups.forEach(G=>{
    rect(M,y,CW,gH,C.sunk); line(M,y,M+CW,y,C.line,.4);
    text(G.g,xM+6,y+gH/2+2.2,6.4,{b:true,caps:true,sp:.5}); y+=gH;
    G.rows.forEach(r=>{
      const tot=r.q.reduce((a,b)=>a+b,0); grand+=tot; r.q.forEach((q,j)=>monthTot[j]+=q);
      if(tot)rect(M,y,CW,rH,C.hl);
      line(M,y,M+CW,y,C.lineL,.35);
      const by=y+rH/2+2.4;
      text(r.m,xM+6,by,fsM,{b:true});
      r.q.forEach((q,j)=>{if(q)text(String(q),xMo+j*cMo+cMo/2,by,fsN,{b:true,al:'c'})});
      text(String(tot),xT+cT/2,by,fsN,{b:!!tot,al:'c',c:tot?C.ink:C.faint});
      const ls=wrap(r.d,cC-10,fsC).slice(0,2), lh=fsC*1.12, top=y+rH/2-(ls.length*lh)/2+fsC*.82;
      ls.forEach((l,i)=>text(l,xC+6,top+i*lh,fsC,{c:C.mut}));
      y+=rH;
    });
  });
  /* vertical rules between month columns (light), stronger around totals */
  const tb=ty+hH, te=y;
  for(let j=0;j<=12;j++)line(xMo+j*cMo,tb,xMo+j*cMo,te,j===0||j===12?C.line:C.lineL,j===0||j===12?.5:.35);
  line(xC,tb,xC,te,C.line,.5);
  /* total row */
  rect(M,y,CW,tH,C.ys); line(M,y,M+CW,y,C.y,.8);
  const ry=y+tH/2+2.5;
  text('Всего',xM+6,ry,7,{b:true,caps:true,sp:.4});
  monthTot.forEach((v,j)=>text(String(v),xMo+j*cMo+cMo/2,ry,fsN,{b:true,al:'c'}));
  text(String(grand),xT+cT/2,ry,8,{b:true,al:'c'});
  text('шт. в плане продаж',xC+6,ry,6.5,{c:C.mut});
  y+=tH;
  rect(M,ty,CW,y-ty,null,C.y,.9);

  /* below the table: cabin legend, advance, signature */
  const fy=y+16;
  text('Расшифровка кабин',M,fy,6,{b:true,caps:true,sp:.6,c:C.mut});
  [['ККН','короткая кабина низкая, без спального места'],['ККС','короткая стандартная, без спального места'],['ДКН','длинная низкая, одно спальное место'],['ДКС','длинная стандартная, одно спальное место'],['ДКВ','длинная высокая, два спальных места']]
    .forEach(([k,d],i)=>{text(k,M,fy+12+i*9.5,6.6,{b:true});text(d,M+22,fy+12+i*9.5,6.6,{c:C.mut})});
  const ax=M+CW*.46, aw=CW*.54;
  rect(ax,fy-9,aw,58,C.surf,C.line,.6); rect(ax,fy-9,3,58,C.y);
  const yes=o.adv_ready==='Да'||o.adv_ready==='Да, частично';
  text('Авансирование',ax+12,fy+3,6,{b:true,caps:true,sp:.6,c:C.mut});
  text(o.adv_ready||'—',ax+12,fy+17,10,{b:true});
  if(yes){text(`Готовы авансировать: ${o.adv_qty||'—'} шт.`,ax+12,fy+30,7.5,{c:C.ink});text(`Размер аванса: ${o.adv_pct||'—'}%`,ax+12,fy+41,7.5,{c:C.ink})}
  else text('Готовность внести аванс за технику БАЗ',ax+12,fy+30,7,{c:C.mut});
  const sy=fy+74;
  text('Генеральный директор',M,sy,8,{b:true});
  line(M+110,sy+1,M+300,sy+1,C.ink,.5); text('(подпись / печать)',M+205,sy+10,6,{c:C.mut,al:'c'});
  line(M+320,sy+1,M+CW,sy+1,C.ink,.5); text('(Ф. И. О.)',M+320+(CW-320)/2,sy+10,6,{c:C.mut,al:'c'});

  /* footer */
  line(M,PH-24,M+CW,PH-24,C.line,.5);
  text(`${o.c_name||'Кандидат'}${o.c_city?', '+o.c_city:''}`,M,PH-13,7,{c:C.mut});
  text('Анкета кандидата в дилеры · АО «Романов»',PW-M,PH-13,7,{c:C.mut,al:'r'});

  return writePdf(cs,F,A,[...new Set(imgs)],`План продаж ${meta.year} — ${o.c_name||''}`);
}

/* ---------- PDF serialisation ---------- */
function writePdf(content,F,A,imgs,title){
  const objs=[]; const add=v=>{objs.push(v);return objs.length};
  const str=s=>enc.encode(s);
  const pdfStr=s=>'<FEFF'+[...String(s)].map(ch=>{const c=ch.codePointAt(0);return c>0xFFFF?'003F':c.toString(16).padStart(4,'0')}).join('')+'>';
  const stream=(dict,bytes)=>({dict:dict+` /Length ${bytes.length}`,bytes});
  const fontObj=(f,tag)=>{
    const ttf=b64(f.ttf), ff=add(stream(`<< /Length1 ${ttf.length}`,ttf)); objs[ff-1].dict+=' >>';
    const fd=add(`<< /Type /FontDescriptor /FontName /${tag}+${f.name} /Flags 32 /FontBBox [${f.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${f.asc} /Descent ${f.desc} /CapHeight ${f.cap} /StemV 80 /FontFile2 ${ff} 0 R >>`);
    const gids=Object.keys(f.w).map(Number).sort((a,b)=>a-b);
    const W='['+gids.map(g=>`${g} [${f.w[g]}]`).join(' ')+']';
    const cid=add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${tag}+${f.name} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fd} 0 R /W ${W} /CIDToGIDMap /Identity /DW 500 >>`);
    const pairs=Object.entries(f.map).map(([cp,g])=>[g,Number(cp)]).sort((a,b)=>a[0]-b[0]);
    let cm='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
    for(let i=0;i<pairs.length;i+=100){const ch=pairs.slice(i,i+100);cm+=`${ch.length} beginbfchar\n`+ch.map(([g,cp])=>`<${g.toString(16).padStart(4,'0')}> <${cp.toString(16).padStart(4,'0')}>`).join('\n')+'\nendbfchar\n'}
    cm+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
    const tu=add(stream('<<',str(cm))); objs[tu-1].dict+=' >>';
    return add(`<< /Type /Font /Subtype /Type0 /BaseFont /${tag}+${f.name} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`);
  };
  const f1=fontObj(F.R,'BAZAAA'), f2=fontObj(F.B,'BAZAAB');
  const im={}; imgs.forEach(k=>{const L=A.logos[k],b=b64(L.jpg);const id=add(stream(`<< /Type /XObject /Subtype /Image /Width ${L.w} /Height ${L.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,b));objs[id-1].dict+=' >>';im[k]=id});
  const cbytes=str(content), co=add(stream('<<',cbytes)); objs[co-1].dict+=' >>';
  const pagesId=objs.length+2;
  const page=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> /XObject << ${Object.entries(im).map(([k,id])=>`/Im${k} ${id} 0 R`).join(' ')} >> >> /Contents ${co} 0 R >>`);
  add(`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);
  const cat=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  const info=add(`<< /Title ${pdfStr(title)} /Author ${pdfStr('АО «Романов»')} /Producer (BAZ dealer form) >>`);
  /* serialise with byte offsets */
  const parts=[str('%PDF-1.4\n'),new Uint8Array([37,226,227,207,211,10])];
  let off=parts[0].length+parts[1].length; const xref=[];
  objs.forEach((v,i)=>{xref.push(off);let chunk;
    if(typeof v==='string')chunk=[str(`${i+1} 0 obj\n${v}\nendobj\n`)];
    else chunk=[str(`${i+1} 0 obj\n${v.dict}\nstream\n`),v.bytes,str('\nendstream\nendobj\n')];
    chunk.forEach(c=>{parts.push(c);off+=c.length})});
  const xs=off;
  let xr=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+xref.map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('');
  xr+=`trailer\n<< /Size ${objs.length+1} /Root ${cat} 0 R /Info ${info} 0 R >>\nstartxref\n${xs}\n%%EOF\n`;
  parts.push(str(xr));
  const total=parts.reduce((a,b)=>a+b.length,0), out=new Uint8Array(total);let p=0;parts.forEach(b=>{out.set(b,p);p+=b.length});
  return out;
}
return {build};
})();
if(typeof module!=='undefined')module.exports=BAZPlanPdf;
