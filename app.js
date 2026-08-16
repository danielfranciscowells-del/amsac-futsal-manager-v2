const MENU=[
 ["inicio","⌂","Início"],["plantel","👥","Plantel"],["competicoes","🏆","Competições"],
 ["jogos","⚽","Jogos"],["estatisticas","▥","Estatísticas"],["presencas","✓","Presenças"],
 ["pse","◉","PSE / Bem-estar"],["avaliacoes","★","Avaliações"],["medidas","⚖","Peso / IMC"],
 ["convocatorias","☑","Convocatórias"],["multas","€","Multas"],["relatorios","▤","Relatórios"],["config","⚙","Configurações"]
];

const state={players:[],competitions:[],teams:[],games:[]};
let supabaseClient=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function makeNav(active){
 return MENU.map(x=>`<button class="navBtn ${active===x[0]?"active":""}" onclick="showPage('${x[0]}')"><span class="navIcon">${x[1]}</span>${x[2]}</button>`).join("");
}
function setNav(id){
 $("#desktopNav").innerHTML=makeNav(id);
 $("#mobilePanel").innerHTML=makeNav(id);
}
function toggleMobileMenu(){
 $("#mobilePanel").classList.toggle("show");
 if($("#mobilePanel").classList.contains("show")) $("#mobilePanel").innerHTML=makeNav(window.currentPage||"inicio");
}
function closeModal(){ $("#modal").classList.add("hidden"); }
function openModal(html){ $("#modalBody").innerHTML=html; $("#modal").classList.remove("hidden"); }

function pageHeader(title,sub){
 $("#pageTitle").textContent=title;
 $("#pageSub").textContent=sub;
}

async function loadData(){
 if(!supabaseClient)return;
 const [p,c,t,g]=await Promise.all([
  supabaseClient.from("players").select("*").order("name"),
  supabaseClient.from("competitions").select("*").order("name"),
  supabaseClient.from("teams").select("*").order("name"),
  supabaseClient.from("games").select("*").order("game_date",{ascending:false})
 ]);
 state.players=p.data||[]; state.competitions=c.data||[]; state.teams=t.data||[]; state.games=g.data||[];
}

const pages={
 inicio(){
  pageHeader("Início","Painel da equipa");
  $("#content").innerHTML=`
   <div class="cards">
    <div class="card yellowTop"><div class="label">Jogadores</div><div class="metric">${state.players.length}</div></div>
    <div class="card"><div class="label">Competições</div><div class="metric">${state.competitions.length}</div></div>
    <div class="card"><div class="label">Jogos</div><div class="metric">${state.games.length}</div></div>
    <div class="card"><div class="label">Golos</div><div class="metric">${state.games.reduce((n,g)=>n+(g.home_score||0),0)}</div></div>
   </div>
   <div class="section card"><h3>AMSAC Futsal Manager</h3><p class="muted">O centro de gestão da equipa. Usa o menu para aceder ao plantel, jogos, presenças e análise.</p></div>`;
 },
 plantel(){
  pageHeader("Plantel","Jogadores");
  $("#content").innerHTML=`
   <div class="sectionHeader"><h3>Plantel</h3><button class="btn primary" onclick="playerForm()">＋ Adicionar jogador</button></div>
   <div class="list">${state.players.length?state.players.map(p=>`
    <div class="row"><div class="person"><div class="avatar">${p.photo_url?`<img src="${esc(p.photo_url)}">`:esc((p.name||"?")[0])}</div>
    <div><b>${esc(p.name)}</b><div class="muted">#${p.number||"-"} · ${esc(p.position||"")}</div></div></div>
    <button class="btn light" onclick="playerForm('${p.id}')">Editar</button></div>`).join(""):`<div class="card empty">Ainda não tens jogadores.</div>`}</div>`;
 },
 competicoes(){
  pageHeader("Competições","Competições e equipas");
  $("#content").innerHTML=`
   <div class="toolbar"><button class="btn primary" onclick="competitionForm()">＋ Competição</button><button class="btn dark" onclick="teamForm()">＋ Equipa</button></div>
   <div class="list">${state.competitions.length?state.competitions.map(c=>`
    <div class="row"><div><b>${esc(c.name)}</b><div class="muted">${esc(c.type||"")}</div></div><span class="tag">Competição</span></div>`).join(""):`<div class="card empty">Ainda não tens competições.</div>`}</div>`;
 },
 jogos(){
  pageHeader("Jogos","Calendário e jogo");
  $("#content").innerHTML=`
   <div class="sectionHeader"><h3>Jogos</h3><button class="btn primary" onclick="gameForm()">＋ Novo jogo</button></div>
   ${state.games.length?state.games.map(g=>{const t=state.teams.find(x=>x.id===g.opponent_team_id);return`
    <div class="row"><div><b>AMSAC ${g.home_score||0} — ${g.away_score||0} ${esc(t?.name||"")}</b><div class="muted">${esc(g.game_date||"")}</div></div>
    <button class="btn dark" onclick="openGame('${g.id}')">Abrir</button></div>`}).join(""):`<div class="card empty">Ainda não tens jogos.</div>`}`;
 },
 estatisticas(){
  pageHeader("Estatísticas","Resumo da equipa");
  $("#content").innerHTML=`<div class="cards">
   <div class="card yellowTop"><div class="label">Jogos</div><div class="metric">${state.games.length}</div></div>
   <div class="card"><div class="label">Jogadores</div><div class="metric">${state.players.length}</div></div>
   <div class="card"><div class="label">Competições</div><div class="metric">${state.competitions.length}</div></div>
   <div class="card"><div class="label">Golos</div><div class="metric">${state.games.reduce((n,g)=>n+(g.home_score||0),0)}</div></div>
  </div>`;
 }
};

const placeholder=["presencas","pse","avaliacoes","medidas","convocatorias","multas","relatorios","config"];
placeholder.forEach(id=>pages[id]=()=>{
 const item=MENU.find(x=>x[0]===id);
 pageHeader(item[2],"Gestão da equipa");
 $("#content").innerHTML=`<div class="card empty"><h3>${item[2]}</h3><p>Área preparada na estrutura Stats5. A funcionalidade será acrescentada mantendo este mesmo layout.</p></div>`;
});

function showPage(id){
 window.currentPage=id;
 setNav(id);
 pages[id]?pages[id]():pages.inicio();
 $("#mobilePanel").classList.remove("show");
}

function playerForm(id){
 const p=state.players.find(x=>x.id===id)||{};
 openModal(`<h2>${id?"Editar":"Adicionar"} jogador</h2>
 <form class="form" id="playerForm">
  <div class="two"><label>Nome<input name="name" required value="${esc(p.name)}"></label><label>Número<input name="number" type="number" value="${p.number||""}"></label></div>
  <label>Posição<select name="position">${["GR","Fixo","Ala","Pivot"].map(x=>`<option ${p.position===x?"selected":""}>${x}</option>`).join("")}</select></label>
  <label>Foto (URL)<input name="photo_url" value="${esc(p.photo_url)}" placeholder="Podes alterar mais tarde"></label>
  <button class="btn primary">Guardar jogador</button>
 </form>`);
 $("#playerForm").onsubmit=async e=>{
  e.preventDefault(); const f=new FormData(e.target);
  const d={name:f.get("name"),number:f.get("number")?Number(f.get("number")):null,position:f.get("position"),photo_url:f.get("photo_url")||null};
  const q=id?await supabaseClient.from("players").update(d).eq("id",id):await supabaseClient.from("players").insert(d);
  if(q.error){alert(q.error.message);return;} closeModal();await loadData();showPage("plantel");
 };
}

function competitionForm(){
 openModal(`<h2>Nova competição</h2><form class="form" id="competitionForm">
 <label>Nome<input name="name" required></label>
 <label>Tipo<select name="type"><option>Campeonato</option><option>Taça</option><option>Torneio</option><option>Amigável</option><option>Outros</option></select></label>
 <button class="btn primary">Guardar competição</button></form>`);
 $("#competitionForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  const q=await supabaseClient.from("competitions").insert({name:f.get("name"),type:f.get("type")});
  if(q.error){alert(q.error.message);return;}closeModal();await loadData();showPage("competicoes");
 };
}

function teamForm(){
 openModal(`<h2>Nova equipa</h2><form class="form" id="teamForm">
 <label>Nome<input name="name" required></label><label>URL do símbolo<input name="logo_url"></label>
 <button class="btn primary">Guardar equipa</button></form>`);
 $("#teamForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  const q=await supabaseClient.from("teams").insert({name:f.get("name"),logo_url:f.get("logo_url")||null});
  if(q.error){alert(q.error.message);return;}closeModal();await loadData();showPage("competicoes");
 };
}

function gameForm(){
 openModal(`<h2>Novo jogo</h2><form class="form" id="gameForm">
 <label>Data<input name="date" type="date" required></label>
 <label>Competição<select name="competition">${state.competitions.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label>
 <label>Adversário<select name="opponent">${state.teams.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>
 <div class="two"><label>Minutos por parte<input name="minutes" type="number" value="20" min="1"></label><label>Partes<input name="halves" type="number" value="2" min="1"></label></div>
 <button class="btn primary">Criar jogo</button></form>`);
 $("#gameForm").onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target);
  const q=await supabaseClient.from("games").insert({game_date:f.get("date"),competition_id:f.get("competition")||null,opponent_team_id:f.get("opponent")||null,minutes_per_half:Number(f.get("minutes")),halves:Number(f.get("halves")),home_score:0,away_score:0}).select().single();
  if(q.error){alert(q.error.message);return;}closeModal();await loadData();openGame(q.data.id);
 };
}

function openGame(id){
 const g=state.games.find(x=>x.id===id); const t=state.teams.find(x=>x.id===g?.opponent_team_id);
 pageHeader("Jogo ao vivo","AMSAC · "+(t?.name||"Adversário"));
 $("#content").innerHTML=`
 <div class="gameHero"><div class="team">AMSAC</div><div><div class="clock">${String(g?.minutes_per_half||20).padStart(2,"0")}:00</div><div class="score">${g?.home_score||0} — ${g?.away_score||0}</div></div><div class="team">${esc(t?.name||"Adversário")}</div></div>
 <div class="section"><div class="quickGrid">
  <button class="quickBtn">▶<br>Iniciar</button><button class="quickBtn">⏸<br>Pausar</button>
  <button class="quickBtn" onclick="goalForm('${id}')">＋1 GOLO<br><small>marcador · assistência · zona</small></button>
  <button class="quickBtn">↔<br>Substituição</button>
 </div></div>
 <div class="section card"><div class="sectionHeader"><h3>5 em campo</h3><span class="tag">0 / 5</span></div>
 <div class="quickGrid">${state.players.map(p=>`<button class="quickBtn">${esc(p.name)}</button>`).join("")||`<span class="muted">Adiciona primeiro os jogadores ao plantel.</span>`}</div></div>
 <div class="section"><div class="sectionHeader"><h3>Estatística rápida</h3></div>
 <div class="quickGrid">${["REMATE 🥅","FORA","PERDA","RECUPERAÇÃO","FC","FS","CA 🟨","CV 🟥"].map(x=>`<button class="quickBtn">${x}</button>`).join("")}</div></div>`;
}

function goalForm(id){
 openModal(`<h2>＋1 GOLO</h2><form class="form">
 <label>Marcador<select>${state.players.map(p=>`<option>${esc(p.name)}</option>`).join("")}</select></label>
 <label>Assistência<select><option>Sem assistência</option>${state.players.map(p=>`<option>${esc(p.name)}</option>`).join("")}</select></label>
 <label>Motivo<select>${["Organização ofensiva","Transição","5x4","Canto","Livre","Penálti","Outro"].map(x=>`<option>${x}</option>`).join("")}</select></label>
 <b>Zona da baliza</b><div class="quickGrid">${["Sup. esq.","Sup. centro","Sup. dir.","Centro esq.","Centro","Centro dir.","Inf. esq.","Inf. centro","Inf. dir."].map(x=>`<button type="button" class="quickBtn">${x}</button>`).join("")}</div>
 <button type="button" class="btn primary" onclick="closeModal()">Confirmar golo</button></form>`);
}

async function init(){
 if(window.supabase&&window.AMSAC_CONFIG){
  supabaseClient=window.supabase.createClient(AMSAC_CONFIG.supabaseUrl,AMSAC_CONFIG.supabaseKey);
  await loadData();
 }
 showPage("inicio");
}
init();