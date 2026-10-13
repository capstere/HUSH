/* HUSH 2.0 — original-sketch linework, layered animation, cached room lighting. */
(function (root) {
'use strict';
let reducedMotion=false; const paths=new Map();
const seededRandom=HushRules.random;
const C={ink:'#28384b',paper:'#f1ebdd',pencil:'#8195a8',sky:'#9ebdd2',light:'#c1d6de',mid:'#6085b2',blue:'#416493',deep:'#385981',bed:'#3a526f',night:'#151e31',peach:'#e2ac95',mint:'#b7cdbb',yellow:'#d9c197'};
function ink(ctx,d,fill=C.paper,stroke=C.ink,width=2.2){let p=paths.get(d);if(!p){p=new Path2D(d);if(paths.size>350)paths.clear();paths.set(d,p);}if(fill){ctx.fillStyle=fill;ctx.fill(p);}if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(p);ctx.save();ctx.globalAlpha*=.26;ctx.translate(.7,-.55);ctx.lineWidth=width*.5;ctx.stroke(p);ctx.restore();}}
function line(ctx,d,color=C.ink,w=2){ink(ctx,d,null,color,w);}
function ellipse(ctx,x,y,rx,ry,fill,stroke=null,w=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}}
function text(ctx,s,x,y,size=16,color=C.paper,italic=false,align='center'){ctx.fillStyle=color;ctx.font=`${italic?'italic ':''}${size}px ${italic?'Georgia,serif':'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function rounded(ctx,x,y,w,h,r,fill,stroke=null){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
const pencilTexture=document.createElement('canvas');pencilTexture.width=240;pencilTexture.height=240;{const x=pencilTexture.getContext('2d'),r=seededRandom(971);for(let i=0;i<1900;i++){const a=r()*240,b=r()*240;x.fillStyle=r()>.5?'rgba(5,26,43,.16)':'rgba(255,255,236,.12)';x.fillRect(a,b,r()*1.6+.3,r()*1.6+.3);}for(let i=0;i<130;i++){x.strokeStyle='rgba(213,236,237,.045)';x.beginPath();const a=r()*240,b=r()*240;x.moveTo(a,b);x.lineTo(a+8+r()*8,b+4+r()*8);x.stroke();}}
function drawPillow(ctx,x,y,tilt=0,extra=false){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ink(ctx,'M-106-62 Q-97-70-87-61 Q-24-55 30-61 Q78-58 103-66 Q99-45 103-29 Q91 5 99 34 L108 67 Q71 56 49 64 Q-27 60-83 66 L-109 72 Q-104 55-101 36 Q-103-21-106-62Z',C.paper,C.pencil,2.4);line(ctx,'M-98-54 Q-85-44-83-40 M93-51 81-35 M-94 58-81 45 M92 56 81 43','#a2b3b5',1.3);if(extra){line(ctx,'M-86 53 Q-14 60 70 54',C.blue,2);line(ctx,'M-87 58 Q-12 65 71 59',C.blue,1);}ctx.restore();}
function drawSleeper(ctx,s,t,isHome){const breath=s.breath;const side=false;const awake=s.status==='lost';const pfx=null;const pillowLift=s.lift;drawPillow(ctx,248,212-pillowLift,-.022,!!pfx);
 ctx.save();ctx.translate(0,breath*1.8); // Loose shirt, neck and visible left arm.
 ink(ctx,'M215 284 Q187 290 166 309 Q146 333 145 369 L171 393 Q216 412 305 391 L337 369 Q336 332 315 309 Q293 293 278 286 L273 268 223 268Z',C.paper,C.pencil,2.3);
 line(ctx,'M221 284 Q238 309 275 284 M170 322 164 348 M302 318 308 348 M194 319 190 345 M276 316 279 348','#859da6',1.6);
 // Head subtly leans when turned, but the pillow never covers the face.
 ctx.save();ctx.translate(248+s.side*19,241-pillowLift);ctx.rotate(-.09+s.side*.45+breath*.012);ctx.scale(1-s.side*.16,1);
 if(side){ink(ctx,'M-35-48 Q-6-67 24-44 Q44-32 39-6 L53 7 39 13 Q41 32 22 46 Q1 56-21 40 Q-40 22-42-6Z',C.paper,C.ink,2.5);line(ctx,'M16-10q10 6 16-2 M29 22q6 4 10-1 M4-26 23-29',C.ink,2);ellipse(ctx,-25,3,7,12,C.paper,C.ink,2);}
 else{ink(ctx,'M-44-28 Q-52-5-38 26 Q-28 48-3 52 Q26 49 40 29 Q53 8 46-25 Q35-57 3-54 Q-31-58-44-28Z',C.paper,C.ink,2.5);ellipse(ctx,-44,5,7,12,C.paper,C.pencil,1.5);ellipse(ctx,46,4,7,12,C.paper,C.pencil,1.5);
 if(awake){ellipse(ctx,-20,-2,9,10,C.paper,C.ink,2);ellipse(ctx,23,-2,9,10,C.paper,C.ink,2);ellipse(ctx,-18,-1,3,4,C.ink);ellipse(ctx,21,-1,3,4,C.ink);line(ctx,'M-31-18-10-14 M12-14 32-20 M-7 29q11-5 20 0',C.ink,2.5);}else{line(ctx,'M-30-5q10 9 20 1 M12-3q11 8 21-1',C.ink,2.5);line(ctx,'M-29-15-15-16 M15-15 29-15',C.pencil,1.7);const open=2+s.snore*(3+s.noise*.1);ellipse(ctx,4,29,12,open,C.ink,C.ink,1.5);ellipse(ctx,5,32,7,3.2,'#d29988');}line(ctx,'M3-1-1 10 6 13',C.pencil,2);
 for(let i=0;i<11;i++){const angle=.18+i*.255;const xx=Math.cos(angle)*37,yy=13+Math.sin(angle)*28;line(ctx,`M${xx} ${yy}l-2 4`,'#85999d',1.1);}}
 // Scribbly, asymmetric bed hair.
 ink(ctx,side?'M-40 7 Q-61-11-45-26 Q-64-42-35-44 Q-38-67-14-53 Q2-70 18-53 Q40-61 40-39 L26-30 12-38 1-21-13-34-18-14-29-23Z':'M-44 8 Q-60-2-48-17 Q-66-28-42-35 Q-54-56-28-49 Q-33-70-9-55 Q2-77 18-57 Q38-69 40-46 Q60-41 49-20 L31-29 24-13 10-34 0-18-13-39-24-20-33-27-35-9Z','#e6e3d5',C.ink,2.4);
 line(ctx,'M-43-20-26-32-21-23 M-32-45-12-30-15-47 M-9-52 8-30 11-49 M17-51 30-33 38-40 M-43-35-48-27',C.pencil,1.5);
 ctx.restore();ctx.restore();}
function drawYou(ctx,s,t){const tired=1-s.patience/100,awake=s.status==='lost';const calm=s.relax>.65&&!awake;drawPillow(ctx,480,212,.026);
 // Long, slightly unruly hair on the pillow.
 ink(ctx,'M441 198 Q414 187 426 151 Q424 131 451 124 Q472 108 491 124 Q521 117 534 143 Q549 151 538 183 Q550 220 544 259 L560 291 519 280 438 280 409 293 Q426 270 422 245Z','#e6e3d7',C.pencil,2.2);
 line(ctx,'M448 142 Q433 171 444 207 L431 264 M514 144 Q534 178 521 215 L536 264 M436 169l-2 36 M529 174l4 38 M466 126Q443 131 442 166 M482 124Q461 128 451 148 M493 129Q518 136 522 164 M500 140Q512 148 515 169 M433 231 428 270 M535 230 546 278',C.pencil,1.5);
 ink(ctx,'M455 280 Q433 287 421 309 Q408 330 411 374 L553 377 Q554 337 541 310 Q528 289 505 281 L503 258 459 257Z',C.paper,C.pencil,2.2);line(ctx,'M454 283 Q474 317 505 281 M430 320 428 341 M534 320 536 343',C.pencil,1.7);
 ctx.save();ctx.translate(480,221);ctx.rotate(awake?-.12:s.relax*.08-s.reach*.1);ink(ctx,'M-42-22 Q-37-52-8-50 Q26-54 41-23 Q44 7 30 30 Q14 48-2 48 Q-23 42-34 24 Q-45 6-42-22Z',C.paper,C.ink,2.3);line(ctx,'M-40-21Q-22-48 4-45 M9-45 34-25',C.pencil,2.7);
 if(calm || s.blink<.25){line(ctx,'M-28-2q9 7 16 0 M11-1q10 7 18-1 M-10 26q10 6 20-1',C.ink,2);}else{line(ctx,`M-29 -12 L-12 ${-7+tired*4} M12 ${-7+tired*4} 29-14`,C.ink,2.8);ellipse(ctx,-20,0,2.5,4,C.ink);ellipse(ctx,20,-1,2.5,4,C.ink);line(ctx,'M-12 28q11-7 22-1',C.ink,2.3);line(ctx,'M-27 9-14 10 M14 10 26 8','#a2b0b0',1.5);}
 line(ctx,'M1 0-3 12 4 15',C.pencil,2);ctx.restore();
 // The reference's iconic "hands over ears" pose; relaxed arms in quiet moments.
 ctx.save();ctx.translate(420,347);ctx.rotate(-s.reach*1.02-s.relax*2.35);ctx.translate(-420,-347);ink(ctx,'M426 328 Q414 348 413 366 Q397 374 394 353 L397 281 Q403 255 420 239 L425 215 Q426 210 430 213 L430 231 432 208 Q435 203 438 209 L437 230 440 213 Q444 210 445 215 L441 242 Q451 232 453 240 Q452 247 439 258 L429 277 417 316Z',C.paper,C.pencil,2.3);ctx.restore();
 ctx.save();ctx.translate(547,347);ctx.rotate(s.relax*2.35);ctx.translate(-547,-347);ink(ctx,'M535 330 Q549 353 549 364 Q565 371 566 352 L563 282 Q558 255 540 241 L534 217 Q533 211 529 215 L529 232 527 209 Q524 204 521 210 L523 232 518 214 Q514 211 513 216 L519 244 Q508 233 506 241 Q507 249 522 261 L532 279 542 317Z',C.paper,C.pencil,2.3);ctx.restore();
}
function drawBlanket(ctx,s,t){const breath=s.breath*2.5;const tuck=-s.cozy*9;ctx.save();ctx.translate(0,tuck);ink(ctx,`M126 ${367+breath} Q175 351 244 364 Q298 355 351 365 Q407 350 478 362 Q543 352 603 365 L608 628 Q600 663 575 667 L153 666 Q116 657 116 632Z`,C.blue,C.deep,2.6);
 ink(ctx,`M126 ${367+breath} Q175 351 244 364 Q298 355 351 365 Q407 350 478 362 Q543 352 603 365 L609 415 Q575 429 531 419 Q463 422 431 410 Q370 410 333 420 Q260 410 214 422 Q159 414 116 430Z`,C.mid,null);
 line(ctx,'M133 441 133 631 Q138 649 157 648 L572 648 Q588 646 590 630 L592 442','#91abc5',1.3);line(ctx,'M140 438 140 627 M581 441 581 626','#486b96',1);
 for(let i=0;i<4;i++)line(ctx,`M${185+i*103} 463q-8 53 0 86`,'#587baa',1);
 line(ctx,'M345 437 Q328 486 345 526 M359 544 Q365 582 348 618 M276 437 284 462 M489 570 476 601','#34537e',2);
 // A small moon-and-stars stitched into the duvet.
 ctx.save();ctx.translate(457,560);ctx.rotate(-.24);line(ctx,'M7-26A29 29 0 1 0 26 18A24 24 0 0 1 7-26Z','#8bb4c1',1.5);line(ctx,'M-55 5h12m-6-6v12 M38-37h10m-5-5v10 M-13 48h7m-3-4v8','#8bb4c1',1.5);ctx.restore();
 // Left arm lies outside the blanket, as in the original drawing.
 ctx.save();ctx.globalAlpha=1-s.side;ink(ctx,'M163 326 Q146 327 140 352 L142 399 Q166 426 207 438 L240 454 Q259 466 268 454 Q269 446 258 443 L244 440 Q253 439 248 434 L230 432 Q205 419 179 405 L167 390 175 341Z',C.paper,C.pencil,2.3);line(ctx,'M232 442 254 453 M236 438 260 448 M150 358 150 391',C.pencil,1.4);ctx.restore();
 if(s.warm>0){const w=Math.sin(t*7)*3*s.warm;ellipse(ctx,216,590,18+w,30,C.deep);ellipse(ctx,264,595,17-w,28,C.deep);}
 ctx.restore();}
function ease(a,b,dt,speed=5){return a+(b-a)*(1-Math.exp(-speed*dt));}
class Bedroom {
  constructor(canvas) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.w=0;this.h=0;this.dpr=1;this.time=0;
    this.pose={side:0,cozy:0,relax:0,reach:0,lift:0,warm:0};this.effect=null;this.frame=0;
    this.resize(); this.makeRoom();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
  }
  resize(){
    const r=this.canvas.getBoundingClientRect(); if(r.width<2||r.height<2)return;
    this.w=r.width;this.h=r.height;this.dpr=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);
    this.scale=Math.min(this.w/720,this.h/740);this.ox=(this.w-this.scale*720)/2;this.oy=(this.h-this.scale*740)/2;
  }
  point(e){const r=this.canvas.getBoundingClientRect();return{x:(e.clientX-r.left-this.ox)/this.scale,y:(e.clientY-r.top-this.oy)/this.scale};}
  animate(id,quality=1){this.effect={id,quality,born:this.time};}
  makeRoom(){
    this.room=document.createElement('canvas');this.room.width=1080;this.room.height=1110;const c=this.room.getContext('2d');c.scale(1.5,1.5);
    // The room fades into the interface: no framed illustration or extra dashboard panel.
    const floor=c.createRadialGradient(360,370,80,360,370,410);floor.addColorStop(0,'#202d43');floor.addColorStop(1,C.night);c.fillStyle=floor;c.fillRect(0,0,720,740);
    for(let i=0;i<13;i++)line(c,`M${i*64-15} 40v640`,'#253044',.8);
    c.save();const light=c.createLinearGradient(630,70,160,570);light.addColorStop(0,'#a8c9df18');light.addColorStop(1,'#a8c9df00');ink(c,'M633 60 679 61 331 678 107 619Z',light,null);c.restore();
    c.save();c.shadowColor='#050c23aa';c.shadowBlur=24;c.shadowOffsetY=15;rounded(c,96,50,528,640,23,'#1b293f');c.restore();
    rounded(c,90,48,540,89,17,C.bed);line(c,'M106 64Q360 69 612 67','#6f8da3',1.4);line(c,'M104 123Q360 129 615 123','#283f5c',1.4);
    rounded(c,102,127,516,557,24,'#7da0ba','#486982');rounded(c,111,135,498,539,20,C.sky);
    // Tiny bedside objects stay visually secondary.
    rounded(c,14,333,69,100,12,'#253348');line(c,'M25 421h47','#3e4d61',1.2);
    rounded(c,637,334,69,100,12,'#253348');line(c,'M648 421h47','#3e4d61',1.2);
    const glow=c.createRadialGradient(671,280,5,671,280,83);glow.addColorStop(0,'#dfb48544');glow.addColorStop(1,'#dfb48500');c.fillStyle=glow;c.fillRect(584,193,150,175);
    ellipse(c,671,280,26,26,'#a99274','#1d293c',2);ellipse(c,671,280,20,20,'#dfc39b','#ebd6b5',1);ellipse(c,671,280,9,9,'#e7cca3');
    line(c,'M670 307v20q0 8 7 8','#627181',1.5);
    this.grain=c.createPattern(pencilTexture,'repeat');
  }
  draw(state,dt=1/60,motion=false,home=false,held=null){
    if(!this.w)return;reducedMotion=motion;this.time+=dt;this.frame++;
    const t=state.t, age=this.effect?this.time-this.effect.born:99, effect=this.effect;
    if(age>2.5)this.effect=null;
    const gesture=effect&&age<1.8?Math.sin(Math.min(1,age/1.8)*Math.PI):0;
    const id=held?.id||effect?.id;
    const moving=held?Math.min(1,held.age*1.8):gesture;
    const p=this.pose;
    p.side=ease(p.side,state.buffs.side>0?1:0,dt,3.4);
    p.cozy=ease(p.cozy,state.buffs.cozy>0?1:0,dt,4);
    p.relax=ease(p.relax,state.noise<32&&state.status!=='lost'?1:0,dt,2.2);
    p.reach=ease(p.reach,['hush','pillow','roll','pat','tuck'].includes(id)?moving:0,dt,7);
    p.lift=ease(p.lift,id==='pillow'?moving*9:0,dt,8);
    p.warm=ease(p.warm,id==='warm'?moving:0,dt,5);
    const phase=state.phase ?? (t%4.4)/4.4;
    const breath=motion?0:Math.sin(phase*Math.PI*2-.5)*2;
    const snore=phase>=.49?Math.sin(Math.min(1,(phase-.49)/.41)*Math.PI):0;
    const blink=motion?1:((t+1.7)%6.2<.14?0:1);
    const s=Object.assign({},state,p,{breath,snore:Math.max(0,snore),blink});
    const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);c.save();c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);
    c.drawImage(this.room,0,0,720,740);
    // The phone screen is the event hotspot, mirrored by a large accessible button.
    const phone=state.event?.kind==='phone';c.save();c.translate(48,378);c.rotate(phone&&!motion?Math.sin(t*42)*.055:-.1);rounded(c,-17,-31,34,62,5,'#101a2b','#586779');rounded(c,-13,-24,26,45,3,phone?'#ddc1a3':'#3c5269');line(c,'M-3-27h6','#90a0b0',1);if(phone)text(c,'…',0,4,17,'#283447');c.restore();
    rounded(c,644,357,55,32,5,'#121c2c','#45566a');text(c,state.clock||'02:14',671,378,15,'#d6c19e');
    drawSleeper(c,s,t,home);drawYou(c,s,t);drawBlanket(c,s,t);
    if(state.event?.kind==='cat')this.cat(c,t,motion);
    // One small bit of lettering, not a cloud of hearts and popups.
    c.save();c.globalAlpha=state.status==='lost'?1:(state.noise>32?.3+s.snore*.6:.65);
    if(state.status==='lost')text(c,'“I wasn’t snoring.”',363,490,22,C.paper,true);
    else if(state.noise>32){c.translate(159-(motion?0:s.snore*4),184-(motion?0:s.snore*6));c.rotate(-.12);text(c,state.noise>83?'hrrrRR.':state.noise>54?'hrrr…':'rrr…',0,0,18+state.noise*.05,'#304d69',true);}
    else {text(c,'z',303,183,21,'#79978d',true);text(c,'z',317,164,15,'#79978d',true);}
    c.restore();
    if(id==='hum'&&moving>.1){c.save();c.globalAlpha=moving*.6;text(c,'♪',371,275-(motion?0:Math.sin(t*3)*6),23,C.yellow,true);c.restore();}
    if(state.buffs.rain>0){c.save();c.globalAlpha=.16;for(let i=0;i<14;i++){const x=i<7?18+i*9:632+(i-7)*10;const y=(i*57+(motion?0:t*49))%600+55;line(c,`M${x} ${y}l-3 13`,'#b3c9db',1.2);}c.restore();}
    c.save();c.globalAlpha=.16;c.fillStyle=this.grain;c.fillRect(96,51,528,640);c.restore();
    // A gradual dawn, instead of an abrupt change of scene.
    const dawn=Math.max(0,(state.progress-.78)/.22);if(dawn>0){const g=c.createLinearGradient(630,40,180,670);g.addColorStop(0,`rgba(237,191,135,${dawn*.22})`);g.addColorStop(1,'rgba(237,191,135,0)');c.fillStyle=g;c.fillRect(0,0,720,740);}
    c.restore();
  }
  cat(c,t,motion){const wig=motion?0:Math.sin(t*3)*5;c.save();c.translate(518,596);c.rotate(.16);ellipse(c,0,0,28,38,'#bbaa95',C.ink,2);ink(c,'M-23-31-25-54-8-46Q1-50 10-44L25-53 24-30Q26-10 0-11Q-25-10-23-31Z','#cbbb9f',C.ink,2);line(c,'M-12-31-7-29 M8-29 13-31 M-2-23h4',C.ink,1.8);line(c,`M19 27Q57 ${32+wig} 42 ${-5+wig}`,'#bbaa95',10);c.restore();}
}
root.HushBedroom=Bedroom;
})(window);
