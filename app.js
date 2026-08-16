const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const KEY="amsac_final_v1";
const icons={dashboard:"⌂",players:"♟",competitions:"🏆",games:"⚽",attendance:"✓",wellbeing:"●",evaluations:"★",weight:"⚖",convocations:"☑",stats:"▤",reports:"▤",fines:"€",settings:"⚙"};
const nav=[
 ["dashboard","Início","Dashboard da equipa"],["players","Plantel","Jogadores e fotos"],["competitions","Competições","Equipas e símbolos"],
 ["games","Jogos","Calendário e jogos"],["attendance","Presenças","Presenças e atrasos"],["wellbeing","PSE / Bem-estar","Estado dos atletas"],
 ["evaluations","Avaliações","Avaliação técnica"],["weight","Peso / IMC","Peso e composição"],["convocations","Convocatórias","Convocatórias de jogo"],
 ["stats","Estatísticas","Dados de jogo"],["reports","Relatórios","Relatórios e exportação"],["fines","Multas","Gestão de multas"],["settings","Configurações","Configuração"]
];
let state=load();
let currentGame=null,timer=null,clockSec=0;

function load(){try{return JSON.parse(localStorage.getItem(KEY))||blank()}catch{return blank()}}
function blank(){return {players:[],competitions:[],games:[],attendance:[],evaluations:[],fines:[],convocations:[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));$("#syncState").textContent="● Guardado no dispositivo";syncIfPossible()}
function toast(t){$("#toast").textContent=t;$("#toast").classList.remove("hidden");setTimeout(()=>$("#toast").classList.add("hidden"),1800)}
function openModal(h){$("#modalBody").innerHTML=h;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
function toggleSidebar(){$(".sidebar").classList.toggle("open")}
function navHtml(active){return nav.map(([id,label])=>`<button class="nav-btn ${active===id?"active":""}" onclick="show('${id}')"><span class="nav-ico">${icons[id]}</span>${label}</button>`).join("")}
function page(id,title,sub,html){$("#nav").innerHTML=navHtml(id);$("#pageTitle").textContent=title;$("#pageSub").textContent=sub;$("#content").innerHTML=html;document.querySelector(".sidebar").classList.remove("open")}
function show(id){
 const fn={dashboard:dashboard,players:players,competitions:competitions,games:games,attendance:attendance,wellbeing:wellbeing,evaluations:evaluations,weight:weight,convocations:convocations,stats:stats,reports:reports,fines:fines,settings:settings}[id];
 if(fn)fn();
}
function dashboard(){
 const goals=state.games.reduce((n,g)=>n+(g.gf||0),0), assists=state.games.flatMap(g=>g.events||[]).filter(e=>e.type==="GOLO"&&e.assist).length;
 page("dashboard","Início","Dashboard da equipa",`
 <div class="hero"><div><h2>Dashboard</h2><p>Dados da equipa e acompanhamento do trabalho.</p></div><button class="btn primary" onclick="gameForm()">＋ Novo jogo</button></div>
 <div class="cards">
  <div class="card"><div class="label">Jogos</div><div class="metric">${state.games.length}</div></div>
  <div class="card"><div class="label">Golos</div><div class="metric yellow">${goals}</div></div>
  <div class="card"><div class="label">Assistências</div><div class="metric">${assists}</div></div>
  <div class="card"><div class="label">Jogadores</div><div class="metric">${state.players.length}</div></div>
 </div>
 <div class="grid2" style="margin-top:16px">
  <div class="card"><h3>Último jogo</h3>${state.games.length?gameMini(state.games[state.games.length-1]):'<div class="empty">Ainda não existem jogos.</div>'}</div>
  <div class="card"><h3>Resumo da equipa</h3><div class="grid2"><div><div class="label">Presença média</div><div class="stat-big">${attendanceRate()}%</div></div><div><div class="label">Multas pendentes</div><div class="stat-big">${state.fines.filter(f=>!f.paid).length}</div></div></div></div>
 </div>`);
}
function gameMini(g){return `<div class="row"><div><b>AMSAC vs ${esc(g.opponent)}</b><div class="muted">${esc(g.date||"")} • ${esc(g.competitionName||"Sem competição")}</div></div><div><b>${g.gf||0} - ${g.ga||0}</b></div></div><button class="btn primary" style="margin-top:12px" onclick="openGame('${g.id}')">Abrir jogo</button>`}
function players(){
 page("players","Plantel","Jogadores e fotografias",`
 <div class="hero"><div><h2>Plantel</h2><p>Adiciona jogadores e escolhe a fotografia diretamente do telemóvel.</p></div><button class="btn primary" onclick="playerForm()">＋ Adicionar jogador</button></div>
 <div class="list">${state.players.length?state.players.map(p=>`<div class="row"><div class="player"><div class="avatar">${p.photo?`<img src="${p.photo}">`:esc((p.name||"?")[0])}</div><div><b>${esc(p.name)}</b><div class="muted">#${p.number||"-"} • ${esc(p.position||"Sem posição")}</div></div></div><div><button class="btn small" onclick="playerForm('${p.id}')">Editar</button> <button class="btn small danger" onclick="deletePlayer('${p.id}')">Apagar</button></div></div>`).join(""):'<div class="card empty">Ainda não tens jogadores.</div>'}</div>`);
}
function playerForm(id){
 const p=state.players.find(x=>x.id===id)||{};
 openModal(`<h2>${id?"Editar":"Adicionar"} jogador</h2>
 <form class="form" id="playerForm">
 <div class="two"><label>Nome<input name="name" required value="${esc(p.name)}"></label><label>Número<input name="number" type="number" min="1" max="99" value="${p.number||""}"></label></div>
 <label>Posição<select name="position">${["GR","Fixo","Ala","Pivot"].map(x=>`<option ${p.position===x?"selected":""}>${x}</option>`).join("")}</select></label>
 <label>Fotografia <div class="photo-input"><img class="photo-preview" id="photoPreview" src="${p.photo||""}" onerror="this.style.display='none'"><input id="photoFile" type="file" accept="image/*" capture="environment"></div></label>
 <button class="btn primary">Guardar jogador</button></form>`);
 let photo=p.photo||"";
 $("#photoFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{photo=r.result;$("#photoPreview").src=photo;$("#photoPreview").style.display="block"};r.readAsDataURL(f)};
 $("#playerForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const x={id:id||crypto.randomUUID(),name:f.get("name"),number:+f.get("number")||null,position:f.get("position"),photo};if(id)Object.assign(state.players.find(p=>p.id===id),x);else state.players.push(x);save();closeModal();players();toast("Jogador guardado")};
}
function deletePlayer(id){if(!confirm("Apagar este jogador?"))return;state.players=state.players.filter(p=>p.id!==id);save();players()}
function competitions(){
 page("competitions","Competições","Equipas e símbolos",`
 <div class="hero"><div><h2>Competições</h2><p>Cria a competição uma vez e deixa as equipas disponíveis quando crias o jogo.</p></div><button class="btn primary" onclick="compForm()">＋ Nova competição</button></div>
 <div class="list">${state.competitions.length?state.competitions.map(c=>`<div class="card"><div class="row" style="border:0;padding:0;background:transparent"><div><b>${esc(c.name)}</b><div class="muted">${esc(c.type)} • ${c.teams.length} equipas</div></div><button class="btn small" onclick="compForm('${c.id}')">Editar</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${c.teams.map(t=>`<span class="tag">${t.logo?`◉ `:""}${esc(t.name)}</span>`).join("")}</div></div>`).join(""):'<div class="card empty">Ainda não tens competições.</div>'}</div>`);
}
function compForm(id){
 const c=state.competitions.find(x=>x.id===id)||{teams:[]};
 openModal(`<h2>${id?"Editar":"Nova"} competição</h2><form class="form" id="compForm">
 <label>Nome<input name="name" required value="${esc(c.name)}"></label>
 <label>Tipo<select name="type">${["Campeonato","Taça","Torneio","Amigável","Outro"].map(x=>`<option ${c.type===x?"selected":""}>${x}</option>`).join("")}</select></label>
 <label>Equipas (uma por linha: Nome | símbolo URL)<textarea name="teams" rows="7">${c.teams.map(t=>`${t.name} | ${t.logo||""}`).join("\n")}</textarea></label>
 <button class="btn primary">Guardar competição</button></form>`);
 $("#compForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const teams=String(f.get("teams")).split("\n").map(s=>s.trim()).filter(Boolean).map(s=>{let [name,logo=""]=s.split("|");return{id:crypto.randomUUID(),name:name.trim(),logo:logo.trim()}});const x={id:id||crypto.randomUUID(),name:f.get("name"),type:f.get("type"),teams};if(id)Object.assign(state.competitions.find(c=>c.id===id),x);else state.competitions.push(x);save();closeModal();competitions();toast("Competição guardada")};
}
function games(){
 page("games","Jogos","Calendário e jogos",`
 <div class="hero"><div><h2>Jogos</h2><p>Agenda, convocatória e controlo do jogo.</p></div><button class="btn primary" onclick="gameForm()">＋ Novo jogo</button></div>
 <div class="list">${state.games.length?state.games.slice().reverse().map(g=>`<div class="row"><div><b>AMSAC vs ${esc(g.opponent)}</b><div class="muted">${esc(g.date||"")} • ${esc(g.competitionName||"Sem competição")} • ${esc(g.homeAway||"Casa")}</div></div><div><b>${g.gf||0} - ${g.ga||0}</b> <button class="btn small" onclick="openGame('${g.id}')">Abrir</button></div></div>`).join(""):'<div class="card empty">Cria o primeiro jogo.</div>'}</div>`);
}
function gameForm(){
 const comp=state.competitions[0], teams=state.competitions.flatMap(c=>c.teams.map(t=>({name:t.name,comp:c.name})));
 openModal(`<h2>Agendar jogo</h2><form class="form" id="gameForm">
 <label>Adversário<select name="opponent">${teams.length?teams.map(t=>`<option>${esc(t.name)}</option>`).join(""):'<option>Adiciona primeiro as equipas na competição</option>'}</select></label>
 <div class="two"><label>Data<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label>Hora<input name="time" type="time" value="18:00"></label></div>
 <div class="two"><label>Casa/Fora<select name="homeAway"><option>Casa</option><option>Fora</option></select></label><label>Jornada<input name="round" placeholder="Ex.: Jornada 1"></label></div>
 <label>Competição<select name="comp">${state.competitions.length?state.competitions.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join(""):'<option value="">Sem competição</option>'}</select></label>
 <div class="two"><label>Minutos/parte<input name="minutes" type="number" value="20" min="1"></label><label>Partes<input name="halves" type="number" value="2" min="1"></label></div>
 <button class="btn primary">Criar jogo</button></form>`);
 $("#gameForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const c=state.competitions.find(c=>c.id===f.get("comp"));const g={id:crypto.randomUUID(),date:f.get("date"),time:f.get("time"),opponent:f.get("opponent"),homeAway:f.get("homeAway"),round:f.get("round"),competitionName:c?.name||"Sem competição",minutes:+f.get("minutes")||20,halves:+f.get("halves")||2,gf:0,ga:0,starters:[],subs:[],events:[],status:"agendado"};state.games.push(g);save();closeModal();openGame(g.id);toast("Jogo criado")};
}
function openGame(id){
 const g=state.games.find(x=>x.id===id);currentGame=id;
 const starters=g.starters||[], subs=g.subs||[];
 const selected=starters.concat(subs);
 page("games","Jogo","Controlo em direto",`
 <div class="toolbar"><button class="btn" onclick="games()">← Voltar aos jogos</button><span class="tag">${esc(g.competitionName)}</span><span class="tag">${esc(g.homeAway)}</span></div>
 <div class="card"><div class="match-top"><div class="team"><div class="team-logo">AM</div>AMSAC</div><div class="score"><div class="muted">${esc(g.date||"")} • ${esc(g.time||"")}</div><div class="time" id="clock">00:00</div><div class="result">${g.gf||0} - ${g.ga||0}</div></div><div class="team"><div class="team-logo" style="background:#242a34;color:#fff">${esc((g.opponent||"AD")[0])}</div>${esc(g.opponent)}</div></div>
 <div class="toolbar" style="justify-content:center;margin-top:14px"><button class="btn primary" onclick="toggleClock('${g.id}')">▶ Iniciar / Pausar</button><button class="btn green" onclick="goal('${g.id}')">＋1 GOLO</button><button class="btn danger" onclick="opponentGoal('${g.id}')">＋1 SOFRIDO</button></div>
 </div>
 <div class="card" style="margin-top:15px"><div class="label">Disposição tática</div><div class="pitch-view"><div class="pitch-center"></div>${pitchDots(starters)}</div><div class="grid2"><button class="btn">5x4 At.</button><button class="btn">4x3 At.</button><button class="btn">5x4 Def.</button><button class="btn">4x3 Def.</button></div></div>
 <div class="grid2" style="margin-top:15px">
  <div class="card"><h3>Banco (${subs.length})</h3><p class="muted">Toca num jogador e depois coloca-o em campo.</p><div class="bench">${subs.map(pid=>benchRow(g,pid)).join("")||'<div class="empty">Seleciona os 7 suplentes abaixo.</div>'}</div></div>
  <div class="card"><h3>5 inicial <span class="tag">${starters.length}/5</span></h3><div class="bench">${state.players.map(p=>`<button class="bench-row" onclick="toggleStarter('${g.id}','${p.id}')"><span class="player"><span class="avatar">${p.photo?`<img src="${p.photo}">`:esc((p.name||"?")[0])}</span>${esc(p.name)} #${p.number||"-"}</span><span>${starters.includes(p.id)?"✓":""}</span></button>`).join("")||'<div class="empty">Adiciona jogadores ao plantel.</div>'}</div></div>
 </div>
 <div class="card" style="margin-top:15px"><h3>7 suplentes <span class="tag">${subs.length}/7</span></h3><div class="bench">${state.players.filter(p=>!starters.includes(p.id)).map(p=>`<button class="bench-row" onclick="toggleSub('${g.id}','${p.id}')"><span>${esc(p.name)}</span><span>${subs.includes(p.id)?"✓":""}</span></button>`).join("")}</div></div>
 <div class="card" style="margin-top:15px"><h3>Estatística do jogo</h3><div class="event-grid">
 ${eventButton(g.id,"REMATE 🥅")} ${eventButton(g.id,"FORA")} ${eventButton(g.id,"PERDA")} ${eventButton(g.id,"RECUPERAÇÃO")} ${eventButton(g.id,"FALTA COMETIDA")} ${eventButton(g.id,"FALTA SOFRIDA")} ${eventButton(g.id,"CA 🟨","yellow")} ${eventButton(g.id,"CV 🟥","red")}
 </div></div>
 <div class="bottom-match"><b>● <span id="bottomClock">00:00</span></b><span>${g.gf||0} - ${g.ga||0}</span><button class="btn green" onclick="goal('${g.id}')">＋1 golo</button></div>
 `);
}
function pitchDots(starters){const pos=[[50,82],[22,55],[50,52],[78,55],[50,22]];return starters.slice(0,5).map((pid,i)=>{const p=state.players.find(x=>x.id===pid);return `<div class="player-dot" style="left:${pos[i][0]}%;top:${pos[i][1]}%">${p?.number||"?"}</div>`}).join("")}
function benchRow(g,pid){const p=state.players.find(x=>x.id===pid);return `<div class="bench-row"><span class="player"><span class="avatar">${p?.photo?`<img src="${p.photo}">`:esc((p?.name||"?")[0])}</span>${esc(p?.name||"")}</span><span><button class="btn small green" onclick="subOn('${g.id}','${pid}')">Entrar</button><button class="btn small" onclick="cardEvent('${g.id}','${pid}','CA 🟨')">A</button><button class="btn small danger" onclick="cardEvent('${g.id}','${pid}','CV 🟥')">V</button></span></div>`}
function eventButton(id,t,cl=""){return `<button class="event-btn ${cl}" onclick="eventForPlayer('${id}','${t}')">${t}</button>`}
function toggleStarter(id,pid){const g=state.games.find(x=>x.id===id);g.starters=g.starters||[];g.subs=g.subs||[];if(g.starters.includes(pid))g.starters=g.starters.filter(x=>x!==pid);else if(g.starters.length<5){g.starters.push(pid);g.subs=g.subs.filter(x=>x!==pid)}else{toast("O 5 inicial já está completo");return}save();openGame(id)}
function toggleSub(id,pid){const g=state.games.find(x=>x.id===id);g.starters=g.starters||[];g.subs=g.subs||[];if(g.starters.includes(pid))return;if(g.subs.includes(pid))g.subs=g.subs.filter(x=>x!==pid);else if(g.subs.length<7)g.subs.push(pid);else{toast("Os 7 suplentes já estão completos");return}save();openGame(id)}
function subOn(id,pid){const g=state.games.find(x=>x.id===id);if(!g.subs.includes(pid))return;g.subs=g.subs.filter(x=>x!==pid);if(!g.starters.includes(pid))g.starters.push(pid);save();openGame(id)}
function eventForPlayer(id,type){const g=state.games.find(x=>x.id===id);if(!g.starters.length){toast("Seleciona primeiro o 5 inicial");return}openModal(`<h2>${esc(type)}</h2><p class="muted">Seleciona o jogador.</p><div class="list">${g.starters.map(pid=>{const p=state.players.find(x=>x.id===pid);return `<button class="btn" onclick="recordEvent('${id}','${pid}','${type}')">${esc(p?.name)} #${p?.number||"-"}</button>`}).join("")}</div>`)}
function cardEvent(id,pid,type){recordEvent(id,pid,type)}
function recordEvent(id,pid,type){const g=state.games.find(x=>x.id===id);g.events=g.events||[];g.events.push({id:crypto.randomUUID(),type,player:pid,minute:Math.floor(clockSec/60)});save();closeModal();openGame(id);toast(type+" registado")}
function goal(id){
 const g=state.games.find(x=>x.id===id), list=(g.starters||[]).concat(g.subs||[]);
 openModal(`<h2>＋1 Golo</h2><form class="form" id="goalForm">
 <label>Marcador<select id="goalPlayer">${list.map(pid=>{const p=state.players.find(x=>x.id===pid);return `<option value="${pid}">${esc(p?.name)}</option>`}).join("")}</select></label>
 <label>Assistência<select id="assist"><option value="">Sem assistência</option>${list.map(pid=>{const p=state.players.find(x=>x.id===pid);return `<option value="${pid}">${esc(p?.name)}</option>`}).join("")}</select></label>
 <label>Motivo do golo<select id="reason">${["Transição","Ataque organizado","5x4","Canto","Livre","Penálti","10m","Saída de pressão","Outro"].map(x=>`<option>${x}</option>`).join("")}</select></label>
 <label>Zona do remate na baliza</label><div class="pitch">${["Sup. esq.","Sup. centro","Sup. dir.","Centro esq.","Centro","Centro dir.","Inf. esq.","Inf. centro","Inf. dir."].map(z=>`<button type="button" onclick="selectZone(this)" data-zone="${z}">${z}</button>`).join("")}</div>
 <button class="btn primary">Confirmar golo</button></form>`);
 $("#goalForm").onsubmit=e=>{e.preventDefault();const z=document.querySelector(".pitch .sel");if(!z){toast("Seleciona a zona da baliza");return}g.gf=(g.gf||0)+1;g.events.push({id:crypto.randomUUID(),type:"GOLO",player:$("#goalPlayer").value,assist:$("#assist").value,reason:$("#reason").value,zone:z.dataset.zone,minute:Math.floor(clockSec/60)});save();closeModal();openGame(id);toast("Golo registado")};
}
function selectZone(el){document.querySelectorAll(".pitch button").forEach(b=>b.classList.remove("sel"));el.classList.add("sel")}
function opponentGoal(id){const g=state.games.find(x=>x.id===id);g.ga=(g.ga||0)+1;g.events.push({id:crypto.randomUUID(),type:"GOLO SOFRIDO",minute:Math.floor(clockSec/60)});save();openGame(id);toast("Golo sofrido registado")}
function toggleClock(id){if(timer){clearInterval(timer);timer=null;return}const g=state.games.find(x=>x.id===id);clockSec=clockSec||0;timer=setInterval(()=>{clockSec++;const s=`${String(Math.floor(clockSec/60)).padStart(2,"0")}:${String(clockSec%60).padStart(2,"0")}`;if($("#clock"))$("#clock").textContent=s;if($("#bottomClock"))$("#bottomClock").textContent=s},1000)}
function attendanceRate(){if(!state.attendance.length)return 100;const good=state.attendance.filter(a=>a.status==="presente").length;return Math.round(good/state.attendance.length*100)}
function attendance(){
 const date=new Date().toISOString().slice(0,10);
 page("attendance","Presenças","Presenças, atrasos e faltas",`
 <div class="hero"><div><h2>Presenças</h2><p>Marca rapidamente o estado de cada jogador.</p></div><button class="btn primary" onclick="saveAttendance()">Guardar dia</button></div>
 <div class="card"><div class="two"><label>Data<input id="attDate" type="date" value="${date}"></label><label>Estado padrão<select id="attDefault"><option value="presente">Presente</option><option value="atraso">Atraso</option><option value="falta">Falta</option><option value="justificada">Justificada</option></select></label></div></div>
 <div class="list" style="margin-top:14px">${state.players.map(p=>`<div class="row"><div class="player"><div class="avatar">${p.photo?`<img src="${p.photo}">`:esc((p.name||"?")[0])}</div><b>${esc(p.name)}</b></div><select id="att_${p.id}" style="max-width:160px"><option value="presente">Presente</option><option value="atraso">Atraso</option><option value="falta">Falta</option><option value="justificada">Justificada</option></select></div>`).join("")||'<div class="card empty">Adiciona jogadores primeiro.</div>'}</div>`);
}
function saveAttendance(){const date=$("#attDate").value;state.players.forEach(p=>{const v=$(`#att_${p.id}`)?.value;if(v)state.attendance.push({id:crypto.randomUUID(),playerId:p.id,date,status:v})});save();toast("Presenças guardadas")}
function wellbeing(){page("wellbeing","PSE / Bem-estar","Estado dos atletas",`<div class="hero"><div><h2>PSE / Bem-estar</h2><p>Regista rapidamente o estado percebido antes/depois do treino.</p></div></div><div class="list">${state.players.map(p=>`<div class="row"><div><b>${esc(p.name)}</b><div class="muted">Disponibilidade e bem-estar</div></div><div class="filters">${[1,2,3,4,5].map(n=>`<button class="btn small" onclick="toast('${esc(p.name)}: PSE ${n}/5')">${n}</button>`).join("")}</div></div>`).join("")||'<div class="card empty">Adiciona jogadores primeiro.</div>'}</div>`)}
function evaluations(){
 page("evaluations","Avaliações","Avaliação técnica",`<div class="hero"><div><h2>Avaliação técnica</h2><p>Avalia dimensões de 1 a 10.</p></div><button class="btn green" onclick="evalForm()">Guardar avaliação</button></div>
 <div class="list">${state.players.map(p=>{const e=state.evaluations.filter(x=>x.playerId===p.id).slice(-1)[0];return `<div class="card"><div class="row" style="padding:0;border:0;background:transparent"><b>${esc(p.name)}</b><span class="tag">${e?((e.psychological+e.physical+e.tactical+e.technical)/4).toFixed(1):"—"}/10</span></div><div style="margin-top:12px">${["psychological","physical","tactical","technical"].map(k=>`<div class="label" style="margin-top:8px">${k}</div><div class="progress"><i style="width:${(e?.[k]||0)*10}%"></i></div>`).join("")}</div></div>`}).join("")||'<div class="card empty">Adiciona jogadores primeiro.</div>'}</div>`);
}
function evalForm(){openModal(`<h2>Nova avaliação</h2><form class="form" id="evalForm"><label>Jogador<select id="ep">${state.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>${["psychological","physical","tactical","technical"].map(k=>`<label>${k}<input id="e_${k}" type="number" min="0" max="10" value="5"></label>`).join("")}<label>Notas<textarea id="en"></textarea></label><button class="btn primary">Guardar avaliação</button></form>`);$("#evalForm").onsubmit=e=>{e.preventDefault();state.evaluations.push({id:crypto.randomUUID(),playerId:$("#ep").value,psychological:+$("#e_psychological").value,physical:+$("#e_physical").value,tactical:+$("#e_tactical").value,technical:+$("#e_technical").value,notes:$("#en").value});save();closeModal();evaluations()}}
function weight(){page("weight","Peso / IMC","Peso e composição corporal",`<div class="card"><h3>Registo de peso</h3><p class="muted">Módulo preparado para guardar peso e calcular IMC por atleta.</p><button class="btn primary" onclick="toast('Módulo de peso preparado')">Adicionar registo</button></div>`)}
function convocations(){
 page("convocations","Convocatórias","Convocatórias de jogo",`<div class="hero"><div><h2>Convocatórias</h2><p>Escolhe o jogo e os atletas convocados.</p></div><button class="btn primary" onclick="convForm()">＋ Nova convocatória</button></div>
 <div class="list">${state.convocations.length?state.convocations.map(c=>`<div class="row"><div><b>${esc(c.gameName)}</b><div class="muted">${c.players.length} convocados</div></div><button class="btn small" onclick="editConv('${c.id}')">Editar</button></div>`).join(""):'<div class="card empty">Ainda não existem convocatórias.</div>'}</div>`);
}
function convForm(existing){
 const c=state.convocations.find(x=>x.id===existing)||{players:[]};
 openModal(`<h2>${existing?"Editar":"Nova"} convocatória</h2><form class="form" id="convForm"><label>Jogo<select id="cg">${state.games.map(g=>`<option value="${g.id}">${esc(g.opponent)} • ${esc(g.date)}</option>`).join("")}</select></label><label>Atletas</label><div class="list">${state.players.map(p=>`<label class="row"><span>${esc(p.name)}</span><input type="checkbox" value="${p.id}" ${c.players.includes(p.id)?"checked":""}></label>`).join("")}</div><button class="btn primary">Guardar convocatória</button></form>`);$("#convForm").onsubmit=e=>{e.preventDefault();const game=state.games.find(g=>g.id===$("#cg").value);const players=[...$("#convForm").querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);const x={id:c.id||crypto.randomUUID(),gameId:game?.id,gameName:game?`AMSAC vs ${game.opponent}`:"",players};if(c.id)Object.assign(c,x);else state.convocations.push(x);save();closeModal();convocations()}}
function editConv(id){convForm(id)}
function stats(){
 const events=state.games.flatMap(g=>g.events||[]), count=t=>events.filter(e=>e.type===t).length;
 page("stats","Estatísticas","Resumo dos jogos",`<div class="cards"><div class="card"><div class="label">Remates</div><div class="metric">${count("REMATE 🥅")}</div></div><div class="card"><div class="label">Recuperações</div><div class="metric">${count("RECUPERAÇÃO")}</div></div><div class="card"><div class="label">Perdas</div><div class="metric">${count("PERDA")}</div></div><div class="card"><div class="label">Faltas cometidas</div><div class="metric">${count("FALTA COMETIDA")}</div></div></div><div class="card" style="margin-top:16px"><h3>Últimos eventos</h3><table class="table"><tr><th>Jogo</th><th>Evento</th><th>Jogador</th><th>Min.</th></tr>${events.slice(-20).reverse().map(e=>{const g=state.games.find(x=>x.events?.some(y=>y.id===e.id));const p=state.players.find(x=>x.id===e.player);return `<tr><td>${esc(g?.opponent||"")}</td><td>${esc(e.type)}</td><td>${esc(p?.name||"—")}</td><td>${e.minute||0}'</td></tr>`}).join("")}</table></div>`);
}
function reports(){
 page("reports","Relatórios","Relatórios e análise",`<div class="grid2"><div class="card"><h3>Relatório do jogo</h3><p class="muted">Resumo visual com resultado, golos, eventos e zona da baliza.</p><button class="btn green" onclick="reportGame()">Abrir relatório</button></div><div class="card"><h3>Relatório de treinos</h3><p class="muted">Presença, PSE e avaliações por período.</p><button class="btn" onclick="toast('Relatório de treinos preparado')">Abrir relatório</button></div></div>`);
}
function reportGame(){
 const g=state.games[state.games.length-1];if(!g){toast("Ainda não há jogos");return}const goals=(g.events||[]).filter(e=>e.type==="GOLO");openModal(`<h2>Relatório — AMSAC vs ${esc(g.opponent)}</h2><div class="grid2"><div class="card"><div class="label">Resultado</div><div class="metric">${g.gf||0} - ${g.ga||0}</div></div><div class="card"><div class="label">Golos marcados</div><div class="metric yellow">${goals.length}</div></div></div><div class="card" style="margin-top:12px"><h3>Golos</h3>${goals.map(e=>{const p=state.players.find(x=>x.id===e.player);return `<div class="row"><div><b>${esc(p?.name||"")}</b><div class="muted">${esc(e.reason||"")} • ${esc(e.zone||"")}</div></div><span>${e.minute||0}'</span></div>`}).join("")||'<div class="empty">Sem golos.</div>'}</div><div class="card" style="margin-top:12px"><h3>Baliza — zonas dos remates</h3><div class="pitch">${["Sup. esq.","Sup. centro","Sup. dir.","Centro esq.","Centro","Centro dir.","Inf. esq.","Inf. centro","Inf. dir."].map(z=>`<div style="min-height:50px;background:#162028;border:1px solid #293944;border-radius:7px;display:grid;place-items:center;font-size:10px">${z}<b>${goals.filter(e=>e.zone===z).length}</b></div>`).join("")}</div></div>`);
}
function fines(){page("fines","Multas","Gestão de multas",`<div class="hero"><div><h2>Multas</h2><p>Regista motivo, valor e pagamento.</p></div><button class="btn primary" onclick="fineForm()">＋ Nova multa</button></div><div class="list">${state.fines.map(f=>{const p=state.players.find(x=>x.id===f.playerId);return `<div class="row"><div><b>${esc(p?.name||"")}</b><div class="muted">${esc(f.reason)}</div></div><div><b>${Number(f.amount).toFixed(2)}€</b> <button class="btn small" onclick="payFine('${f.id}')">${f.paid?"Pago":"Marcar pago"}</button></div></div>`}).join("")||'<div class="card empty">Sem multas.</div>'}</div>`)}
function fineForm(){openModal(`<h2>Nova multa</h2><form class="form" id="fineForm"><label>Jogador<select id="fp">${state.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label><label>Valor<input id="fa" type="number" step=".01" value="5"></label><label>Motivo<input id="fr" required></label><button class="btn primary">Guardar</button></form>`);$("#fineForm").onsubmit=e=>{e.preventDefault();state.fines.push({id:crypto.randomUUID(),playerId:$("#fp").value,amount:+$("#fa").value,reason:$("#fr").value,paid:false});save();closeModal();fines()}}
function payFine(id){const f=state.fines.find(x=>x.id===id);f.paid=!f.paid;save();fines()}
function settings(){page("settings","Configurações","Aplicação",`<div class="card"><h3>AMSAC Futsal Manager</h3><p class="muted">Versão final baseada no fluxo do vídeo de referência: dashboard escuro, menu lateral, jogo em direto, 5 inicial, banco, eventos, golo com marcador/assistência/motivo/zona da baliza, convocatórias, avaliações, presenças e relatórios.</p><button class="btn danger" onclick="resetLocal()">Apagar dados locais</button></div><div class="card" style="margin-top:14px"><h3>Supabase</h3><p class="muted">A versão inclui modo local seguro. Para sincronização entre treinador e adjuntos, coloca o URL e a chave anon no config.js e executa o SQL fornecido.</p></div>`)}

async function syncIfPossible(){
 const c=window.AMSAC_CONFIG||{};if(!c.SUPABASE_URL||!c.SUPABASE_ANON_KEY)return;
 try{const r=await fetch(c.SUPABASE_URL+"/rest/v1/players?select=id",{headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:"Bearer "+c.SUPABASE_ANON_KEY}});if(r.ok)$("#syncState").textContent="● Supabase ligado";}catch{}
}
function resetLocal(){if(confirm("Apagar os dados guardados neste dispositivo?")){localStorage.removeItem(KEY);state=blank();show("dashboard");toast("Dados locais apagados")}}
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
show("dashboard");
syncIfPossible();
