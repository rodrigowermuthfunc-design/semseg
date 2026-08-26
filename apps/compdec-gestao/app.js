const STORAGE_KEY='compdec_gestao_v2';
const TODAY=()=>new Date().toISOString().slice(0,10);
const defaultData={
  settings:{role:'GESTOR'},
  locations:[
    {id:'loc1',name:'Estoque Central COMPDEC',type:'COMPDEC',refId:'compdec'},
    {id:'loc2',name:'Equipe Operacional 01',type:'EQUIPE',refId:'e1'},
    {id:'loc3',name:'NUPDEC Exemplo',type:'NUPDEC',refId:'n1'}
  ],
  inventory:[
    {id:'i1',code:'DC-EST-0001',name:'Lona 4x5 m',category:'Abrigo e proteção',unit:'un',min:30,condition:'Operacional',validity:'',serial:'',stocks:{loc1:180,loc2:10,loc3:8}},
    {id:'i2',code:'DC-EPI-0002',name:'Colete refletivo',category:'EPI',unit:'un',min:15,condition:'Operacional',validity:'',serial:'',stocks:{loc1:48,loc2:12,loc3:6}},
    {id:'i3',code:'DC-ILU-0003',name:'Lanterna recarregável',category:'Iluminação',unit:'un',min:10,condition:'Operacional',validity:'',serial:'',stocks:{loc1:22,loc2:6,loc3:3}},
    {id:'i4',code:'DC-COM-0004',name:'Rádio comunicador',category:'Comunicação',unit:'un',min:6,condition:'Operacional',validity:'',serial:'',stocks:{loc1:14,loc2:4,loc3:2}}
  ],
  movements:[],
  custodies:[
    {id:'c1',itemId:'i3',itemName:'Lanterna recarregável',qty:2,origin:'loc1',holderType:'Equipe',holder:'Equipe Operacional 01',issued:'2026-08-10',due:'2026-09-10',status:'Em cautela',conditionOut:'Bom',conditionReturn:'',notes:'Uso em apoio preventivo.'}
  ],
  requests:[
    {id:'s1',nupdecId:'n1',itemId:'i1',qty:10,purpose:'Reforço do estoque preventivo',date:'2026-08-21',requester:'Liderança NUPDEC',status:'Pendente',decision:'',decidedAt:''}
  ],
  nupdecs:[
    {id:'n1',name:'NUPDEC Exemplo',neighborhood:'Bairro Exemplo',status:'Ativa',leader:'Maria Souza',phone:'',lat:-29.1667,lng:-51.5167,meetingPoint:'Escola Comunitária',coverage:'Setor comunitário demonstrativo',created:'2026-03-10',lastInventoryCheck:'2026-08-01',notes:'Núcleo demonstrativo para testes do sistema.'}
  ],
  teams:[
    {id:'e1',name:'Equipe Operacional 01',type:'Operacional',leader:'Carlos Lima',members:6,status:'Ativa',notes:'Atendimento de campo e apoio preventivo.'}
  ],
  volunteers:[
    {id:'v1',name:'Maria Souza',phone:'',email:'',neighborhood:'Bairro Exemplo',nupdec:'n1',skills:'Primeiros socorros',status:'Ativo',availability:'Finais de semana',joined:'2026-03-10',emergencyContact:''},
    {id:'v2',name:'João Martins',phone:'',email:'',neighborhood:'Bairro Exemplo',nupdec:'n1',skills:'Logística',status:'Ativo',availability:'Noite',joined:'2026-03-15',emergencyContact:''}
  ],
  trainings:[
    {id:'t1',title:'Noções de percepção de risco',date:'2026-07-18',type:'Instrução',nupdecId:'n1',audience:'NUPDEC Exemplo',participants:2,instructor:'COMPDEC',notes:'Orientações preventivas e comunicação de risco.',attendance:['v1','v2'],attachments:[]}
  ],
  meetings:[
    {id:'r1',title:'Reunião mensal NUPDEC',date:'2026-08-05',nupdecId:'n1',audience:'NUPDEC Exemplo',participants:2,minutes:'Definidos pontos de encontro e próximos treinamentos.',attendance:['v1','v2'],attachments:[]}
  ],
  alerts:[
    {id:'a1',title:'Aviso preventivo de chuva intensa',date:'2026-08-20',level:'Atenção',targetNupdec:'',audience:'Todas as NUPDECs',channels:'WhatsApp, redes sociais',status:'Emitido',notes:'Orientações para acompanhamento dos canais oficiais.'}
  ],
  documents:[],
  auditLogs:[
    {id:'log1',at:'2026-08-26T09:00:00-03:00',role:'GESTOR',action:'Inicialização',module:'Sistema',details:'Base demonstrativa criada.'}
  ]
};

let db=load();
let current='dashboard';
let mapInstance=null;
let deferredInstallPrompt=null;

const navItems=[
  ['dashboard','▦','Dashboard'],['estoque','▣','Estoque'],['cautelas','⇄','Cautelas'],['solicitacoes','✓','Solicitações'],
  ['nupdecs','⌖','NUPDECs'],['prontidao','◉','Prontidão'],['mapa','◎','Mapa'],['equipes','👥','Equipes'],
  ['voluntarios','♙','Voluntários'],['treinamentos','▤','Treinamentos'],['reunioes','◷','Reuniões'],['avisos','⚠','Avisos'],
  ['documentos','▧','Documentos'],['auditoria','≡','Auditoria'],['relatorios','▥','Relatórios']
];
const subtitles={
  dashboard:'Visão geral da operação e indicadores de prontidão',estoque:'Controle por local, equipe e NUPDEC com QR Code',cautelas:'Entrega, custódia e devolução de equipamentos',solicitacoes:'Pedidos de materiais das NUPDECs e fluxo de aprovação',
  nupdecs:'Cadastro, histórico e gestão dos núcleos comunitários',prontidao:'Indicadores de capacidade e preparação de cada NUPDEC',mapa:'Distribuição territorial das NUPDECs',equipes:'Estrutura e efetivo das equipes',
  voluntarios:'Cadastro, habilidades, disponibilidade e histórico',treinamentos:'Instruções, capacitações, simulados e listas de presença',reunioes:'Registro de reuniões, atas e participantes',avisos:'Histórico de avisos e comunicações emitidas',
  documentos:'Atas, fotos, certificados e outros anexos',auditoria:'Trilha de alterações e ações sensíveis',relatorios:'Indicadores e exportações para acompanhamento'
};

function clone(v){return JSON.parse(JSON.stringify(v));}
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!saved)return clone(defaultData);
    return {...clone(defaultData),...saved,settings:{...defaultData.settings,...(saved.settings||{})}};
  }catch{return clone(defaultData)}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(db));}
function uid(p){return p+Math.random().toString(36).slice(2,10);}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function fmtDate(d){if(!d)return'-';return new Date(d+'T12:00:00').toLocaleDateString('pt-BR');}
function fmtDateTime(d){if(!d)return'-';try{return new Date(d).toLocaleString('pt-BR')}catch{return d}}
function daysSince(d){if(!d)return Infinity;return Math.floor((Date.now()-new Date(d+'T12:00:00').getTime())/86400000);}
function totalStock(item){return Object.values(item.stocks||{}).reduce((a,b)=>a+Number(b||0),0);}
function locationStock(item,locId){return Number(item.stocks?.[locId]||0);}
function membersInNupdec(id){return db.volunteers.filter(v=>v.nupdec===id&&v.status==='Ativo').length;}
function nupdecName(id){return db.nupdecs.find(n=>n.id===id)?.name||'Sem vínculo';}
function locationFor(type,refId){return db.locations.find(l=>l.type===type&&l.refId===refId);}
function volunteerName(id){return db.volunteers.find(v=>v.id===id)?.name||id;}
function itemName(id){return db.inventory.find(i=>i.id===id)?.name||id;}
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.add('hidden'),2500);}
function audit(action,module,details){db.auditLogs.unshift({id:uid('log'),at:new Date().toISOString(),role:db.settings.role,action,module,details});db.auditLogs=db.auditLogs.slice(0,500);}
function canManage(){return ['GESTOR','COORDENADOR'].includes(db.settings.role);}
function canStock(){return ['GESTOR','COORDENADOR','ALMOXARIFADO'].includes(db.settings.role);}
function canCommunityEdit(){return canManage()||db.settings.role==='LIDER';}
function canDelete(){return db.settings.role==='GESTOR';}
function roleLabel(){return {GESTOR:'Gestor COMPDEC',COORDENADOR:'Coordenador Operacional',ALMOXARIFADO:'Almoxarifado',LIDER:'Líder NUPDEC',CONSULTA:'Consulta'}[db.settings.role]||db.settings.role;}
function statusClass(v=''){v=String(v).toLowerCase();if(v.includes('pend')||v.includes('aten')||v.includes('cautela')||v.includes('forma'))return'warn';if(v.includes('reje')||v.includes('inativ')||v.includes('venc')||v.includes('emerg'))return'danger';if(v.includes('aprov')||v.includes('ativa')||v.includes('emit')||v.includes('devol')||v.includes('normal')||v.includes('operacional'))return'ok';return'info';}
function pill(v){return `<span class="pill ${statusClass(v)}">${esc(v||'-')}</span>`;}
function cardKpi(label,value,badge){return `<div class="card kpi"><div><div class="label">${esc(label)}</div><div class="value">${value}</div></div><div class="badge">${esc(badge)}</div></div>`;}

function readiness(n){
  const members=membersInNupdec(n.id);
  const lastMeeting=db.meetings.filter(x=>x.nupdecId===n.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const lastTraining=db.trainings.filter(x=>x.nupdecId===n.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const lastAlert=db.alerts.filter(x=>x.status==='Emitido'&&(x.targetNupdec===''||x.targetNupdec===n.id)).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const hasGeo=Number.isFinite(Number(n.lat))&&Number.isFinite(Number(n.lng));
  const checks=[
    {label:'NUPDEC ativa',points:15,ok:n.status==='Ativa'},
    {label:'5+ voluntários ativos',points:20,ok:members>=5},
    {label:'Reunião nos últimos 60 dias',points:15,ok:lastMeeting&&daysSince(lastMeeting.date)<=60},
    {label:'Treinamento nos últimos 120 dias',points:20,ok:lastTraining&&daysSince(lastTraining.date)<=120},
    {label:'Estoque conferido em até 60 dias',points:15,ok:n.lastInventoryCheck&&daysSince(n.lastInventoryCheck)<=60},
    {label:'Ponto georreferenciado',points:5,ok:hasGeo},
    {label:'Comunicação testada em até 60 dias',points:10,ok:lastAlert&&daysSince(lastAlert.date)<=60}
  ];
  const score=checks.reduce((s,c)=>s+(c.ok?c.points:0),0);
  const level=score>=80?'Alta':score>=60?'Moderada':score>=40?'Baixa':'Crítica';
  return {score,level,checks,members,lastMeeting,lastTraining,lastAlert};
}

function renderNav(){
  document.querySelector('#nav').innerHTML=navItems.map(([id,ic,label])=>`<button class="nav-btn ${current===id?'active':''}" data-page="${id}"><span class="nav-icon">${ic}</span><span class="nav-label">${label}</span></button>`).join('');
  document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{current=b.dataset.page;render();});
}
function render(){
  renderNav();
  const meta=navItems.find(x=>x[0]===current);
  document.querySelector('#pageTitle').textContent=meta?.[2]||'COMPDEC';
  document.querySelector('#pageSubtitle').textContent=subtitles[current]||'';
  const noQuick=['dashboard','mapa','prontidao','auditoria','relatorios','documentos'];
  document.querySelector('#quickAddBtn').style.display=noQuick.includes(current)?'none':'inline-block';
  if(mapInstance){mapInstance.remove();mapInstance=null;}
  const routes={dashboard:renderDashboard,estoque:renderInventory,cautelas:renderCustodies,solicitacoes:renderRequests,nupdecs:renderNupdecs,prontidao:renderReadiness,mapa:renderMap,equipes:renderTeams,voluntarios:renderVolunteers,treinamentos:renderTrainings,reunioes:renderMeetings,avisos:renderAlerts,documentos:renderDocuments,auditoria:renderAudit,relatorios:renderReports};
  (routes[current]||renderDashboard)();
}

function renderDashboard(){
  const activeV=db.volunteers.filter(v=>v.status==='Ativo').length;
  const low=db.inventory.filter(i=>locationStock(i,'loc1')<=Number(i.min||0)).length;
  const pending=db.requests.filter(r=>r.status==='Pendente').length;
  const overdue=db.custodies.filter(c=>c.status==='Em cautela'&&c.due&&daysSince(c.due)>0).length;
  const readinessAvg=db.nupdecs.length?Math.round(db.nupdecs.reduce((s,n)=>s+readiness(n).score,0)/db.nupdecs.length):0;
  const recent=[
    ...db.trainings.map(x=>({date:x.date,text:`Treinamento: ${x.title}`})),...db.meetings.map(x=>({date:x.date,text:`Reunião: ${x.title}`})),...db.alerts.map(x=>({date:x.date,text:`Aviso: ${x.title}`})),...db.movements.map(x=>({date:x.date,text:`Estoque: ${x.itemName} (${x.qty})`}))
  ].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,7);
  document.querySelector('#content').innerHTML=`
    <div class="grid kpis">
      ${cardKpi('NUPDECs ativas',db.nupdecs.filter(n=>n.status==='Ativa').length,'Território')}
      ${cardKpi('Voluntários ativos',activeV,'Pessoas')}
      ${cardKpi('Prontidão média',readinessAvg+'%','NUPDECs')}
      ${cardKpi('Solicitações pendentes',pending,'Aprovação')}
    </div>
    <div class="grid two" style="margin-top:16px">
      <div class="card"><div class="section-head"><div><h2>Prontidão dos núcleos</h2><p>Situação calculada por cadastro, efetivo, atividades, estoque e comunicação</p></div><button class="btn small ghost" onclick="go('prontidao')">Abrir painel</button></div>
        <div class="compact-list">${db.nupdecs.slice(0,6).map(n=>{const r=readiness(n);return `<div class="compact-item"><div><strong>${esc(n.name)}</strong><div class="muted">${esc(n.neighborhood)} · ${r.members} voluntários</div><div class="progress" style="margin-top:7px"><i style="width:${r.score}%"></i></div></div><div><strong>${r.score}%</strong><div class="muted">${r.level}</div></div></div>`}).join('')||'<div class="empty">Nenhuma NUPDEC cadastrada.</div>'}</div>
      </div>
      <div class="card"><div class="section-head"><div><h2>Pendências operacionais</h2><p>Itens que exigem atenção do gestor</p></div></div>
        <div class="compact-list">
          <div class="compact-item"><span><i class="status-dot ${low?'warn':''}"></i>Itens em estoque mínimo</span><strong>${low}</strong></div>
          <div class="compact-item"><span><i class="status-dot ${pending?'warn':''}"></i>Solicitações aguardando decisão</span><strong>${pending}</strong></div>
          <div class="compact-item"><span><i class="status-dot ${overdue?'danger':''}"></i>Cautelas vencidas</span><strong>${overdue}</strong></div>
          <div class="compact-item"><span><i class="status-dot"></i>Documentos anexados</span><strong>${db.documents.length}</strong></div>
        </div>
      </div>
    </div>
    <div class="grid two" style="margin-top:16px">
      <div class="card"><div class="section-head"><div><h2>Distribuição de recursos</h2><p>Quantidade total por local de custódia</p></div></div><div class="stat-list">${resourceDistribution()}</div></div>
      <div class="card"><div class="section-head"><div><h2>Atividades recentes</h2><p>Treinamentos, reuniões, avisos e estoque</p></div></div><div class="activity">${recent.map(a=>`<div class="activity-item"><div class="dot"></div><div><strong>${esc(a.text)}</strong><span>${fmtDate(a.date)}</span></div></div>`).join('')||'<div class="empty">Sem registros recentes.</div>'}</div></div>
    </div>
    <div class="grid three" style="margin-top:16px">
      <div class="card"><h3>Perfil atual</h3><p class="muted"><strong>${roleLabel()}</strong><br>As permissões desta versão são demonstrativas. Em produção, serão aplicadas no Firebase Authentication e nas regras do Firestore.</p></div>
      <div class="card"><h3>Rastreabilidade</h3><p class="muted"><strong>${db.auditLogs.length}</strong> registros de auditoria e <strong>${db.movements.length}</strong> movimentações de estoque armazenadas.</p></div>
      <div class="card"><h3>Uso em campo</h3><p class="muted">A versão está preparada como PWA, permitindo instalação no celular e cache da interface depois do primeiro acesso.</p></div>
    </div>`;
}
function resourceDistribution(){
  const vals=db.locations.map(l=>({l,q:db.inventory.reduce((s,i)=>s+locationStock(i,l.id),0)}));
  const max=Math.max(1,...vals.map(x=>x.q));
  return vals.map(({l,q})=>`<div class="stat-row"><span>${esc(l.name)}</span><div class="progress"><i style="width:${q/max*100}%"></i></div><strong>${q}</strong></div>`).join('');
}

function renderInventory(){
  const rows=db.inventory.map(i=>{const comp=locationStock(i,'loc1');const low=comp<=Number(i.min||0);return `<tr><td><strong>${esc(i.name)}</strong><div class="muted"><span class="code">${esc(i.code||i.id)}</span> · ${esc(i.category)}</div></td><td>${esc(i.unit)}</td><td>${comp}</td><td>${totalStock(i)}</td><td>${pill(low?'Repor':'Normal')}</td><td><div class="actions"><button class="btn small ghost" onclick="showItem('${i.id}')">QR / Detalhes</button>${canStock()?`<button class="btn small ghost" onclick="openMovement('${i.id}')">Movimentar</button><button class="btn small ghost" onclick="editInventory('${i.id}')">Editar</button>`:''}</div></td></tr>`}).join('');
  document.querySelector('#content').innerHTML=`<div class="alert">Cada material possui identificação própria e QR Code. O histórico de movimentações e cautelas preserva a rastreabilidade da custódia.</div><div class="card"><div class="section-head"><div><h2>Itens de estoque</h2><p>${db.inventory.length} itens cadastrados</p></div><div class="toolbar"><input class="search" id="invSearch" placeholder="Buscar item, código ou categoria..."></div></div><div style="overflow:auto"><table><thead><tr><th>Item</th><th>Un.</th><th>COMPDEC</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody id="invRows">${rows}</tbody></table></div></div>
  <div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Últimas movimentações</h2><p>Entrada, saída, transferência, consumo e atendimento de solicitações</p></div></div>${renderMovementTable(db.movements.slice(0,15))}</div>`;
  document.querySelector('#invSearch').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#invRows tr').forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(q)?'':'none');};
}
function renderMovementTable(arr){if(!arr.length)return'<div class="empty">Nenhuma movimentação registrada.</div>';return `<div style="overflow:auto"><table><thead><tr><th>Data</th><th>Item</th><th>Origem</th><th>Destino</th><th>Qtd.</th><th>Responsável</th></tr></thead><tbody>${arr.map(m=>`<tr><td>${fmtDate(m.date)}</td><td>${esc(m.itemName)}</td><td>${esc(m.fromName||'-')}</td><td>${esc(m.toName||'-')}</td><td>${m.qty}</td><td>${esc(m.responsible||'-')}</td></tr>`).join('')}</tbody></table></div>`;}

function renderCustodies(){
  const open=db.custodies.filter(c=>c.status==='Em cautela').length;
  const overdue=db.custodies.filter(c=>c.status==='Em cautela'&&c.due&&daysSince(c.due)>0).length;
  document.querySelector('#content').innerHTML=`<div class="grid kpis">${cardKpi('Cautelas abertas',open,'Custódia')}${cardKpi('Cautelas vencidas',overdue,overdue?'Atenção':'Normal')}${cardKpi('Devoluções',db.custodies.filter(c=>c.status==='Devolvida').length,'Histórico')}${cardKpi('Equipamentos em cautela',db.custodies.filter(c=>c.status==='Em cautela').reduce((s,c)=>s+Number(c.qty||0),0),'Quantidade')}</div>
  <div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Termos de cautela</h2><p>Controle de entrega, responsável, prazo e condição do material</p></div></div><div style="overflow:auto"><table><thead><tr><th>Item</th><th>Responsável</th><th>Entrega</th><th>Prazo</th><th>Qtd.</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.custodies.map(c=>`<tr><td><strong>${esc(c.itemName)}</strong><div class="muted">${esc(c.conditionOut||'')}</div></td><td>${esc(c.holder)}<div class="muted">${esc(c.holderType)}</div></td><td>${fmtDate(c.issued)}</td><td class="${c.status==='Em cautela'&&c.due&&daysSince(c.due)>0?'danger-text':''}">${fmtDate(c.due)}</td><td>${c.qty}</td><td>${pill(c.status)}</td><td><div class="actions">${c.status==='Em cautela'&&canStock()?`<button class="btn small ghost" onclick="returnCustody('${c.id}')">Registrar devolução</button>`:''}<button class="btn small ghost" onclick="showCustody('${c.id}')">Termo</button></div></td></tr>`).join('')||'<tr><td colspan="7" class="empty">Nenhuma cautela registrada.</td></tr>'}</tbody></table></div></div>`;
}

function renderRequests(){
  const pending=db.requests.filter(r=>r.status==='Pendente').length;
  const approved=db.requests.filter(r=>r.status==='Aprovada').length;
  document.querySelector('#content').innerHTML=`<div class="grid kpis">${cardKpi('Pendentes',pending,'Decisão')}${cardKpi('Aprovadas',approved,'Atendidas')}${cardKpi('Rejeitadas',db.requests.filter(r=>r.status==='Rejeitada').length,'Histórico')}${cardKpi('Total',db.requests.length,'Solicitações')}</div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Solicitações de materiais</h2><p>Fluxo entre NUPDEC e gestão/almoxarifado</p></div></div>${db.requests.map(r=>{const n=db.nupdecs.find(n=>n.id===r.nupdecId);return `<div class="request-card"><div class="request-head"><div><strong>${esc(n?.name||'NUPDEC')}</strong><div class="muted">${esc(itemName(r.itemId))} · ${r.qty} unidade(s) · ${fmtDate(r.date)}</div></div>${pill(r.status)}</div><p>${esc(r.purpose||'Sem justificativa.')}</p><div class="split-actions"><small class="muted">Solicitante: ${esc(r.requester||'-')}${r.decision?` · Decisão: ${esc(r.decision)}`:''}</small><div class="actions">${r.status==='Pendente'&&canStock()?`<button class="btn small primary" onclick="decideRequest('${r.id}','Aprovada')">Aprovar e movimentar</button><button class="btn small danger" onclick="decideRequest('${r.id}','Rejeitada')">Rejeitar</button>`:''}</div></div></div>`}).join('')||'<div class="empty">Nenhuma solicitação registrada.</div>'}</div>`;
}

function renderNupdecs(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Núcleos comunitários</h2><p>Cadastro territorial, liderança e situação operacional</p></div></div><div style="overflow:auto"><table><thead><tr><th>NUPDEC</th><th>Região</th><th>Liderança</th><th>Voluntários</th><th>Prontidão</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.nupdecs.map(n=>{const r=readiness(n);return `<tr><td><strong>${esc(n.name)}</strong><div class="muted">Criada em ${fmtDate(n.created)}</div></td><td>${esc(n.neighborhood)}</td><td>${esc(n.leader||'-')}</td><td>${r.members}</td><td><strong>${r.score}%</strong><div class="muted">${r.level}</div></td><td>${pill(n.status)}</td><td><div class="actions"><button class="btn small ghost" onclick="showNupdec('${n.id}')">Ficha completa</button>${canCommunityEdit()?`<button class="btn small ghost" onclick="editNupdec('${n.id}')">Editar</button>`:''}</div></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">Nenhuma NUPDEC cadastrada.</td></tr>'}</tbody></table></div></div>`;
}

function renderReadiness(){
  document.querySelector('#content').innerHTML=`<div class="alert">O índice de prontidão é um indicador gerencial. Ele combina situação do núcleo, voluntários ativos, reuniões, treinamentos, conferência de estoque, georreferenciamento e comunicação.</div><div class="readiness-grid">${db.nupdecs.map(n=>{const r=readiness(n);return `<div class="readiness-card"><div class="readiness-head"><div><h3>${esc(n.name)}</h3><div class="muted">${esc(n.neighborhood)} · ${r.members} voluntários</div>${pill(r.level)}</div><div class="score-ring" style="--score:${r.score}"><span>${r.score}%</span></div></div><div class="checklist">${r.checks.map(c=>`<div class="checkline"><span>${esc(c.label)}</span><strong class="${c.ok?'success-text':'warning-text'}">${c.ok?'OK':'Pendente'}</strong></div>`).join('')}</div><div class="actions" style="margin-top:12px"><button class="btn small ghost" onclick="showNupdec('${n.id}')">Ver ficha</button></div></div>`}).join('')||'<div class="empty">Cadastre NUPDECs para calcular a prontidão.</div>'}</div>`;
}

function renderMap(){
  const valid=db.nupdecs.filter(n=>Number.isFinite(Number(n.lat))&&Number.isFinite(Number(n.lng)));
  document.querySelector('#content').innerHTML=`<div class="map-summary"><div class="mini"><strong>${db.nupdecs.length}</strong><span>NUPDECs cadastradas</span></div><div class="mini"><strong>${valid.length}</strong><span>Georreferenciadas</span></div><div class="mini"><strong>${db.volunteers.filter(v=>v.status==='Ativo').length}</strong><span>Voluntários ativos</span></div></div><div class="card"><div id="map"></div></div>`;
  if(typeof L==='undefined'){document.querySelector('#map').innerHTML='<div class="empty">O mapa precisa ser carregado ao menos uma vez com internet para funcionar nesta versão.</div>';return;}
  mapInstance=L.map('map').setView([-29.1667,-51.5167],11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(mapInstance);
  valid.forEach(n=>{const r=readiness(n);L.marker([Number(n.lat),Number(n.lng)]).addTo(mapInstance).bindPopup(`<strong>${esc(n.name)}</strong><br>${esc(n.neighborhood)}<br>Liderança: ${esc(n.leader||'-')}<br>Voluntários ativos: ${r.members}<br>Prontidão: ${r.score}%<br>Ponto de encontro: ${esc(n.meetingPoint||'-')}`);});
  if(valid.length>1){const group=L.featureGroup(valid.map(n=>L.marker([Number(n.lat),Number(n.lng)])));mapInstance.fitBounds(group.getBounds().pad(.2));}
}

function renderTeams(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Equipes</h2><p>Estrutura operacional e responsáveis</p></div></div><div style="overflow:auto"><table><thead><tr><th>Equipe</th><th>Tipo</th><th>Responsável</th><th>Efetivo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.teams.map(e=>`<tr><td><strong>${esc(e.name)}</strong><div class="muted">${esc(e.notes||'')}</div></td><td>${esc(e.type)}</td><td>${esc(e.leader)}</td><td>${e.members||0}</td><td>${pill(e.status)}</td><td>${canManage()?`<button class="btn small ghost" onclick="editTeam('${e.id}')">Editar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhuma equipe cadastrada.</td></tr>'}</tbody></table></div></div>`;
}

function renderVolunteers(){
  document.querySelector('#content').innerHTML=`<div class="grid kpis">${cardKpi('Ativos',db.volunteers.filter(v=>v.status==='Ativo').length,'Voluntários')}${cardKpi('Pendentes',db.volunteers.filter(v=>v.status==='Pendente').length,'Cadastro')}${cardKpi('Com NUPDEC',db.volunteers.filter(v=>v.nupdec).length,'Vínculo')}${cardKpi('Total',db.volunteers.length,'Pessoas')}</div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Voluntários</h2><p>Cadastro, disponibilidade, habilidades e capacitações</p></div><input class="search" id="volSearch" placeholder="Buscar voluntário..."></div><div style="overflow:auto"><table><thead><tr><th>Nome</th><th>NUPDEC</th><th>Disponibilidade</th><th>Habilidades</th><th>Status</th><th>Ações</th></tr></thead><tbody id="volRows">${db.volunteers.map(v=>`<tr><td><strong>${esc(v.name)}</strong><div class="muted">${esc(v.phone||v.email||'')}</div></td><td>${esc(nupdecName(v.nupdec))}</td><td>${esc(v.availability||'-')}</td><td>${esc(v.skills||'-')}</td><td>${pill(v.status)}</td><td><div class="actions"><button class="btn small ghost" onclick="showVolunteer('${v.id}')">Histórico</button>${canCommunityEdit()?`<button class="btn small ghost" onclick="editVolunteer('${v.id}')">Editar</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhum voluntário cadastrado.</td></tr>'}</tbody></table></div></div>`;
  document.querySelector('#volSearch').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#volRows tr').forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(q)?'':'none');};
}

function renderTrainings(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Treinamentos e instruções</h2><p>Capacitações, simulados, listas de presença e anexos</p></div></div><div style="overflow:auto"><table><thead><tr><th>Atividade</th><th>Data</th><th>NUPDEC / Público</th><th>Instrutor</th><th>Presenças</th><th>Ações</th></tr></thead><tbody>${db.trainings.map(t=>`<tr><td><strong>${esc(t.title)}</strong><div class="muted">${esc(t.type)}</div></td><td>${fmtDate(t.date)}</td><td>${esc(t.nupdecId?nupdecName(t.nupdecId):t.audience||'-')}</td><td>${esc(t.instructor||'-')}</td><td>${(t.attendance||[]).length||t.participants||0}</td><td><div class="actions"><button class="btn small ghost" onclick="showActivity('training','${t.id}')">Detalhes</button>${canCommunityEdit()?`<button class="btn small ghost" onclick="editTraining('${t.id}')">Editar / Presença</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhum treinamento registrado.</td></tr>'}</tbody></table></div></div>`;
}
function renderMeetings(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Reuniões</h2><p>Atas, deliberações e listas de presença</p></div></div><div style="overflow:auto"><table><thead><tr><th>Reunião</th><th>Data</th><th>NUPDEC / Público</th><th>Presenças</th><th>Ata</th><th>Ações</th></tr></thead><tbody>${db.meetings.map(r=>`<tr><td><strong>${esc(r.title)}</strong></td><td>${fmtDate(r.date)}</td><td>${esc(r.nupdecId?nupdecName(r.nupdecId):r.audience||'-')}</td><td>${(r.attendance||[]).length||r.participants||0}</td><td>${esc((r.minutes||'').slice(0,80))}${(r.minutes||'').length>80?'…':''}</td><td><div class="actions"><button class="btn small ghost" onclick="showActivity('meeting','${r.id}')">Detalhes</button>${canCommunityEdit()?`<button class="btn small ghost" onclick="editMeeting('${r.id}')">Editar / Presença</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhuma reunião registrada.</td></tr>'}</tbody></table></div></div>`;
}
function renderAlerts(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Avisos e comunicações</h2><p>Registro dos avisos emitidos e canais utilizados</p></div></div><div style="overflow:auto"><table><thead><tr><th>Aviso</th><th>Data</th><th>Nível</th><th>Destino</th><th>Canais</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.alerts.map(a=>`<tr><td><strong>${esc(a.title)}</strong></td><td>${fmtDate(a.date)}</td><td>${pill(a.level)}</td><td>${esc(a.targetNupdec?nupdecName(a.targetNupdec):a.audience||'Todas')}</td><td>${esc(a.channels||'-')}</td><td>${pill(a.status)}</td><td>${canCommunityEdit()?`<button class="btn small ghost" onclick="editAlert('${a.id}')">Editar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">Nenhum aviso registrado.</td></tr>'}</tbody></table></div></div>`;
}

function renderDocuments(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Central de documentos</h2><p>Atas, fotos, listas, certificados e documentos vinculados</p></div>${canCommunityEdit()?'<button class="btn primary" onclick="addDocument()">+ Anexar documento</button>':''}</div><div class="alert">Neste protótipo, arquivos pequenos podem ser guardados no navegador para demonstração. Em produção, os anexos devem ficar no Firebase Storage.</div><div style="overflow:auto"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Vínculo</th><th>Data</th><th>Tamanho</th><th>Ações</th></tr></thead><tbody>${db.documents.map(d=>`<tr><td><strong>${esc(d.title||d.fileName)}</strong><div class="muted">${esc(d.fileName||'')}</div></td><td>${esc(d.type||'-')}</td><td>${esc(d.linkLabel||'-')}</td><td>${fmtDate(d.date)}</td><td>${esc(formatBytes(d.size||0))}</td><td><div class="actions">${d.dataUrl?`<button class="btn small ghost" onclick="openDocument('${d.id}')">Abrir</button>`:''}${canDelete()?`<button class="btn small danger" onclick="deleteDocument('${d.id}')">Excluir</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhum documento anexado.</td></tr>'}</tbody></table></div></div>`;
}
function renderAudit(){
  document.querySelector('#content').innerHTML=`<div class="card"><div class="section-head"><div><h2>Trilha de auditoria</h2><p>Registro de inclusões, alterações, aprovações e movimentações</p></div></div><div style="overflow:auto"><table><thead><tr><th>Data/hora</th><th>Perfil</th><th>Ação</th><th>Módulo</th><th>Detalhes</th></tr></thead><tbody>${db.auditLogs.map(l=>`<tr><td>${fmtDateTime(l.at)}</td><td>${esc(l.role)}</td><td><strong>${esc(l.action)}</strong></td><td>${esc(l.module)}</td><td>${esc(l.details)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Sem registros.</td></tr>'}</tbody></table></div></div>`;
}
function renderReports(){
  const avg=db.nupdecs.length?Math.round(db.nupdecs.reduce((s,n)=>s+readiness(n).score,0)/db.nupdecs.length):0;
  document.querySelector('#content').innerHTML=`<div class="grid kpis">${cardKpi('NUPDECs',db.nupdecs.length,'Território')}${cardKpi('Prontidão média',avg+'%','Indicador')}${cardKpi('Voluntários',db.volunteers.length,'Cadastros')}${cardKpi('Movimentações',db.movements.length,'Estoque')}</div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Exportações</h2><p>CSV por módulo e backup integral em JSON</p></div></div><div class="toolbar"><button class="btn ghost" onclick="exportCSV('inventory')">Estoque CSV</button><button class="btn ghost" onclick="exportCSV('nupdecs')">NUPDECs CSV</button><button class="btn ghost" onclick="exportCSV('volunteers')">Voluntários CSV</button><button class="btn ghost" onclick="exportCSV('trainings')">Treinamentos CSV</button><button class="btn ghost" onclick="exportCSV('meetings')">Reuniões CSV</button><button class="btn ghost" onclick="exportCSV('alerts')">Avisos CSV</button><button class="btn ghost" onclick="exportCSV('custodies')">Cautelas CSV</button><button class="btn ghost" onclick="exportCSV('requests')">Solicitações CSV</button><button class="btn ghost" onclick="exportCSV('readiness')">Prontidão CSV</button></div></div>`;
}

function go(page){current=page;render();window.scrollTo({top:0,behavior:'smooth'});}
function openModal(title,hint,fields,onSubmit,values={}){
  document.querySelector('#modalTitle').textContent=title;document.querySelector('#modalHint').textContent=hint||'';
  const form=document.querySelector('#modalForm');
  form.innerHTML=`<div class="form-grid">${fields.map(f=>fieldHTML(f,values[f.name])).join('')}</div><div class="form-actions"><button type="button" class="btn ghost" onclick="closeModal()">Cancelar</button><button class="btn primary" type="submit">Salvar</button></div>`;
  form.onsubmit=async e=>{e.preventDefault();const data=collectFormData(form,fields);const result=await onSubmit(data);if(result===false)return;closeModal();save();render();toast('Registro salvo com sucesso');};
  document.querySelector('#modalBackdrop').classList.remove('hidden');document.querySelector('#modalBackdrop').setAttribute('aria-hidden','false');
}
function collectFormData(form,fields){
  const fd=new FormData(form),out={};
  fields.forEach(f=>{if(f.type==='multicheck')out[f.name]=fd.getAll(f.name);else if(f.type==='file')out[f.name]=fd.get(f.name);else out[f.name]=fd.get(f.name)??'';});
  return out;
}
function fieldHTML(f,val){
  const full=f.full?' full':'';let control='';const required=f.required?'required':'';
  if(f.type==='select'){control=`<select name="${f.name}" ${required}>${(f.options||[]).map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(val??'')===String(v)?'selected':''}>${esc(l)}</option>`}).join('')}</select>`;}
  else if(f.type==='textarea'){control=`<textarea name="${f.name}" ${required}>${esc(val??'')}</textarea>`;}
  else if(f.type==='multicheck'){const selected=Array.isArray(val)?val:[];control=`<div class="detail-card multi-group">${(f.options||[]).map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<label style="display:flex;gap:8px;align-items:center;margin:6px 0;font-weight:400"><input type="checkbox" name="${f.name}" value="${esc(v)}" ${selected.includes(v)?'checked':''}> ${esc(l)}</label>`}).join('')||'<span class="muted">Nenhuma opção disponível.</span>'}</div>`;}
  else if(f.type==='file'){control=`<input type="file" name="${f.name}" ${f.accept?`accept="${esc(f.accept)}"`:''} ${required}>`;}
  else{control=`<input type="${f.type||'text'}" name="${f.name}" value="${esc(val??'')}" ${f.step?`step="${f.step}"`:''} ${required}>`;}
  return `<div class="field${full}"><label>${esc(f.label)}</label>${control}${f.help?`<div class="permission-note">${esc(f.help)}</div>`:''}</div>`;
}
function closeModal(){document.querySelector('#modalBackdrop').classList.add('hidden');document.querySelector('#modalBackdrop').setAttribute('aria-hidden','true');}
function openDetail(title,hint,html){document.querySelector('#detailTitle').textContent=title;document.querySelector('#detailHint').textContent=hint||'';document.querySelector('#detailBody').innerHTML=html;document.querySelector('#detailBackdrop').classList.remove('hidden');document.querySelector('#detailBackdrop').setAttribute('aria-hidden','false');}
function closeDetail(){document.querySelector('#detailBackdrop').classList.add('hidden');document.querySelector('#detailBackdrop').setAttribute('aria-hidden','true');}
function upsert(arr,id,data,prefix){const idx=arr.findIndex(x=>x.id===id);if(idx>=0)arr[idx]={...arr[idx],...data};else arr.push({id:uid(prefix),...data});}
function opts(fn){return typeof fn==='function'?fn():fn;}
function fields(list){return list.map(f=>({...f,options:opts(f.options)}));}

const F={
 inventory:[{name:'code',label:'Código patrimonial / interno',required:true},{name:'name',label:'Nome do item',required:true},{name:'category',label:'Categoria',required:true},{name:'unit',label:'Unidade',required:true},{name:'min',label:'Estoque mínimo COMPDEC',type:'number',required:true},{name:'condition',label:'Condição',type:'select',options:['Operacional','Em manutenção','Inoperante']},{name:'validity',label:'Validade',type:'date'},{name:'serial',label:'Nº de série / lote'}],
 nupdec:[{name:'name',label:'Nome da NUPDEC',required:true},{name:'neighborhood',label:'Bairro / região',required:true},{name:'leader',label:'Liderança',required:true},{name:'phone',label:'Telefone'},{name:'status',label:'Status',type:'select',options:['Ativa','Em formação','Inativa']},{name:'meetingPoint',label:'Ponto de encontro',full:true},{name:'coverage',label:'Área / setores de cobertura',type:'textarea',full:true},{name:'lat',label:'Latitude',type:'number',step:'any'},{name:'lng',label:'Longitude',type:'number',step:'any'},{name:'created',label:'Data de criação',type:'date'},{name:'lastInventoryCheck',label:'Última conferência de estoque',type:'date'},{name:'notes',label:'Observações',type:'textarea',full:true}],
 team:[{name:'name',label:'Nome da equipe',required:true},{name:'type',label:'Tipo',required:true},{name:'leader',label:'Responsável',required:true},{name:'members',label:'Efetivo',type:'number'},{name:'status',label:'Status',type:'select',options:['Ativa','Inativa']},{name:'notes',label:'Observações',type:'textarea',full:true}],
 volunteer:[{name:'name',label:'Nome',required:true},{name:'phone',label:'Telefone'},{name:'email',label:'E-mail',type:'email'},{name:'neighborhood',label:'Bairro'},{name:'nupdec',label:'NUPDEC',type:'select',options:()=>[['','Sem vínculo'],...db.nupdecs.map(n=>[n.id,n.name])]},{name:'status',label:'Status',type:'select',options:['Ativo','Inativo','Pendente']},{name:'availability',label:'Disponibilidade'},{name:'joined',label:'Data de ingresso',type:'date'},{name:'skills',label:'Habilidades / capacitações',type:'textarea',full:true},{name:'emergencyContact',label:'Contato de emergência',full:true}],
 training:[{name:'title',label:'Título',required:true},{name:'date',label:'Data',type:'date',required:true},{name:'type',label:'Tipo',type:'select',options:['Instrução','Treinamento','Simulado','Palestra','Oficina']},{name:'nupdecId',label:'NUPDEC vinculada',type:'select',options:()=>[['','Sem vínculo específico'],...db.nupdecs.map(n=>[n.id,n.name])]},{name:'audience',label:'Público / observação de destino'},{name:'instructor',label:'Instrutor'},{name:'notes',label:'Conteúdo / observações',type:'textarea',full:true},{name:'attendance',label:'Lista de presença',type:'multicheck',options:()=>db.volunteers.filter(v=>v.status==='Ativo').map(v=>[v.id,`${v.name} — ${nupdecName(v.nupdec)}`]),full:true}],
 meeting:[{name:'title',label:'Título',required:true},{name:'date',label:'Data',type:'date',required:true},{name:'nupdecId',label:'NUPDEC vinculada',type:'select',options:()=>[['','Sem vínculo específico'],...db.nupdecs.map(n=>[n.id,n.name])]},{name:'audience',label:'Público / observação de destino'},{name:'minutes',label:'Ata / deliberações',type:'textarea',full:true},{name:'attendance',label:'Lista de presença',type:'multicheck',options:()=>db.volunteers.filter(v=>v.status==='Ativo').map(v=>[v.id,`${v.name} — ${nupdecName(v.nupdec)}`]),full:true}],
 alert:[{name:'title',label:'Título',required:true},{name:'date',label:'Data',type:'date',required:true},{name:'level',label:'Nível',type:'select',options:['Informativo','Atenção','Alerta','Emergência']},{name:'targetNupdec',label:'NUPDEC específica',type:'select',options:()=>[['','Todas / geral'],...db.nupdecs.map(n=>[n.id,n.name])]},{name:'audience',label:'Público'},{name:'channels',label:'Canais utilizados'},{name:'status',label:'Status',type:'select',options:['Rascunho','Emitido','Encerrado']},{name:'notes',label:'Mensagem / observações',type:'textarea',full:true}]
};

function editInventory(id){if(!canStock())return toast('Perfil sem permissão para estoque.');const x=db.inventory.find(i=>i.id===id)||{code:`DC-${String(db.inventory.length+1).padStart(4,'0')}`,condition:'Operacional'};openModal(id?'Editar item':'Novo item','O QR Code será gerado automaticamente a partir do identificador do item.',fields(F.inventory),d=>{d.min=+d.min||0;if(id){upsert(db.inventory,id,d,'i');audit('Edição','Estoque',`Item ${d.name} atualizado.`);}else{const item={id:uid('i'),...d,stocks:Object.fromEntries(db.locations.map(l=>[l.id,0]))};db.inventory.push(item);audit('Criação','Estoque',`Item ${d.name} cadastrado.`);}},x);}
function editNupdec(id){if(!canCommunityEdit())return toast('Perfil sem permissão.');const x=db.nupdecs.find(i=>i.id===id)||{status:'Em formação',created:TODAY(),lastInventoryCheck:''};openModal(id?'Editar NUPDEC':'Nova NUPDEC','Inclua coordenadas para exibição no mapa e acompanhamento territorial.',fields(F.nupdec),d=>{d.lat=d.lat===''?null:+d.lat;d.lng=d.lng===''?null:+d.lng;if(id){upsert(db.nupdecs,id,d,'n');const loc=locationFor('NUPDEC',id);if(loc)loc.name=d.name;audit('Edição','NUPDECs',`${d.name} atualizada.`);}else{const nid=uid('n');db.nupdecs.push({id:nid,...d});const lid=uid('loc');db.locations.push({id:lid,name:d.name,type:'NUPDEC',refId:nid});db.inventory.forEach(i=>i.stocks[lid]=0);audit('Criação','NUPDECs',`${d.name} criada.`);}},x);}
function editTeam(id){if(!canManage())return toast('Perfil sem permissão.');const x=db.teams.find(i=>i.id===id)||{status:'Ativa'};openModal(id?'Editar equipe':'Nova equipe','Gerencie estrutura, responsável e efetivo.',fields(F.team),d=>{d.members=+d.members||0;if(id){upsert(db.teams,id,d,'e');const loc=locationFor('EQUIPE',id);if(loc)loc.name=d.name;audit('Edição','Equipes',`${d.name} atualizada.`);}else{const eid=uid('e');db.teams.push({id:eid,...d});const lid=uid('loc');db.locations.push({id:lid,name:d.name,type:'EQUIPE',refId:eid});db.inventory.forEach(i=>i.stocks[lid]=0);audit('Criação','Equipes',`${d.name} criada.`);}},x);}
function editVolunteer(id){if(!canCommunityEdit())return toast('Perfil sem permissão.');const x=db.volunteers.find(i=>i.id===id)||{status:'Ativo',joined:TODAY()};openModal(id?'Editar voluntário':'Novo voluntário','Cadastre somente os dados necessários e respeite as regras de acesso e LGPD.',fields(F.volunteer),d=>{upsert(db.volunteers,id,d,'v');audit(id?'Edição':'Criação','Voluntários',`${d.name} ${id?'atualizado':'cadastrado'}.`);},x);}
function editTraining(id){if(!canCommunityEdit())return toast('Perfil sem permissão.');const x=db.trainings.find(i=>i.id===id)||{date:TODAY(),type:'Treinamento',attendance:[]};openModal(id?'Editar treinamento':'Novo treinamento','A lista de presença alimenta automaticamente o histórico dos voluntários.',fields(F.training),d=>{d.attendance=d.attendance||[];d.participants=d.attendance.length;upsert(db.trainings,id,d,'t');audit(id?'Edição':'Criação','Treinamentos',`${d.title} · ${d.participants} presença(s).`);},x);}
function editMeeting(id){if(!canCommunityEdit())return toast('Perfil sem permissão.');const x=db.meetings.find(i=>i.id===id)||{date:TODAY(),attendance:[]};openModal(id?'Editar reunião':'Nova reunião','Registre ata, deliberações e lista nominal de presença.',fields(F.meeting),d=>{d.attendance=d.attendance||[];d.participants=d.attendance.length;upsert(db.meetings,id,d,'r');audit(id?'Edição':'Criação','Reuniões',`${d.title} · ${d.participants} presença(s).`);},x);}
function editAlert(id){if(!canCommunityEdit())return toast('Perfil sem permissão.');const x=db.alerts.find(i=>i.id===id)||{date:TODAY(),level:'Informativo',status:'Emitido',targetNupdec:''};openModal(id?'Editar aviso':'Novo aviso','Registre público, nível e canais utilizados.',fields(F.alert),d=>{upsert(db.alerts,id,d,'a');audit(id?'Edição':'Criação','Avisos',`${d.title} · ${d.status}.`);},x);}

function openMovement(itemId){if(!canStock())return toast('Perfil sem permissão para movimentar estoque.');const item=db.inventory.find(i=>i.id===itemId);if(!item)return;const options=db.locations.map(l=>[l.id,l.name]);openModal('Movimentar estoque',item.name,[{name:'from',label:'Origem',type:'select',options:[['','Entrada externa'],...options]},{name:'to',label:'Destino',type:'select',options:[['','Saída / consumo'],...options]},{name:'qty',label:'Quantidade',type:'number',required:true},{name:'date',label:'Data',type:'date',required:true},{name:'responsible',label:'Responsável',required:true},{name:'reason',label:'Motivo / observação',type:'textarea',full:true}],d=>{const q=+d.qty||0;if(q<=0){toast('Informe uma quantidade válida.');return false;}if(d.from&&locationStock(item,d.from)<q){toast('Saldo insuficiente na origem.');return false;}applyMovement(item,d.from,d.to,q,d.date,d.responsible,d.reason);return true;},{date:TODAY(),responsible:roleLabel()});}
function applyMovement(item,from,to,qty,date,responsible,reason){if(from)item.stocks[from]=locationStock(item,from)-qty;if(to)item.stocks[to]=locationStock(item,to)+qty;const fl=db.locations.find(l=>l.id===from),tl=db.locations.find(l=>l.id===to);db.movements.unshift({id:uid('m'),itemId:item.id,itemName:item.name,qty,date,responsible,reason,from,fromName:fl?.name||'',to,toName:tl?.name||''});audit('Movimentação','Estoque',`${item.name}: ${qty} ${item.unit} de ${fl?.name||'entrada externa'} para ${tl?.name||'saída/consumo'}.`);}

function addCustody(){if(!canStock())return toast('Perfil sem permissão.');openModal('Nova cautela','A saída é vinculada ao responsável e fica registrada até a devolução.',[
  {name:'itemId',label:'Item',type:'select',options:db.inventory.map(i=>[i.id,`${i.name} — disponível COMPDEC: ${locationStock(i,'loc1')}`]),required:true},{name:'qty',label:'Quantidade',type:'number',required:true},{name:'holderType',label:'Tipo de responsável',type:'select',options:['Servidor / agente','Equipe','NUPDEC','Voluntário','Outro']},{name:'holder',label:'Responsável / destinatário',required:true},{name:'issued',label:'Data de entrega',type:'date',required:true},{name:'due',label:'Previsão de devolução',type:'date'},{name:'conditionOut',label:'Condição na entrega',type:'select',options:['Novo','Bom','Regular','Com ressalva']},{name:'notes',label:'Finalidade / observações',type:'textarea',full:true}
],d=>{const item=db.inventory.find(i=>i.id===d.itemId);const q=+d.qty||0;if(!item||q<=0)return false;if(locationStock(item,'loc1')<q){toast('Saldo insuficiente no estoque central.');return false;}item.stocks.loc1-=q;db.custodies.unshift({id:uid('c'),itemId:item.id,itemName:item.name,qty:q,origin:'loc1',holderType:d.holderType,holder:d.holder,issued:d.issued,due:d.due,status:'Em cautela',conditionOut:d.conditionOut,conditionReturn:'',notes:d.notes});db.movements.unshift({id:uid('m'),itemId:item.id,itemName:item.name,qty:q,date:d.issued,responsible:d.holder,reason:'Cautela de equipamento',from:'loc1',fromName:'Estoque Central COMPDEC',to:'',toName:`Cautela: ${d.holder}`});audit('Cautela','Estoque',`${item.name} · ${q} unidade(s) entregue(s) a ${d.holder}.`);return true;},{issued:TODAY(),conditionOut:'Bom'});}
function returnCustody(id){const c=db.custodies.find(x=>x.id===id);if(!c||c.status!=='Em cautela'||!canStock())return;openModal('Registrar devolução',`${c.itemName} · ${c.holder}`,[{name:'date',label:'Data de devolução',type:'date',required:true},{name:'conditionReturn',label:'Condição na devolução',type:'select',options:['Bom','Regular','Com avaria','Inoperante']},{name:'notesReturn',label:'Observações',type:'textarea',full:true}],d=>{const item=db.inventory.find(i=>i.id===c.itemId);if(item)item.stocks[c.origin]=locationStock(item,c.origin)+Number(c.qty||0);c.status='Devolvida';c.returned=d.date;c.conditionReturn=d.conditionReturn;c.notesReturn=d.notesReturn;db.movements.unshift({id:uid('m'),itemId:c.itemId,itemName:c.itemName,qty:c.qty,date:d.date,responsible:c.holder,reason:'Devolução de cautela',from:'',fromName:`Cautela: ${c.holder}`,to:c.origin,toName:db.locations.find(l=>l.id===c.origin)?.name||'Estoque'});audit('Devolução','Cautelas',`${c.itemName} devolvido por ${c.holder}.`);},{date:TODAY(),conditionReturn:'Bom'});}
function showCustody(id){const c=db.custodies.find(x=>x.id===id);if(!c)return;openDetail('Termo de cautela',`Registro ${c.id}`,`<div class="detail-grid"><div class="detail-card"><h3>Material</h3><p><strong>${esc(c.itemName)}</strong></p><p>Quantidade: ${c.qty}</p><p>Condição de saída: ${esc(c.conditionOut||'-')}</p><p>Condição de retorno: ${esc(c.conditionReturn||'-')}</p></div><div class="detail-card"><h3>Responsável</h3><p>${esc(c.holder)}</p><p>${esc(c.holderType)}</p><p>Entrega: ${fmtDate(c.issued)}</p><p>Prazo: ${fmtDate(c.due)}</p><p>Status: ${pill(c.status)}</p></div><div class="detail-card" style="grid-column:1/-1"><h3>Finalidade / observações</h3><p>${esc(c.notes||'-')}</p>${c.notesReturn?`<p><strong>Na devolução:</strong> ${esc(c.notesReturn)}</p>`:''}</div></div>`);}

function addRequest(){if(!canCommunityEdit()&&!canStock())return toast('Perfil sem permissão.');openModal('Solicitar material','A solicitação ficará pendente até aprovação do gestor ou almoxarifado.',[
  {name:'nupdecId',label:'NUPDEC solicitante',type:'select',options:db.nupdecs.map(n=>[n.id,n.name]),required:true},{name:'itemId',label:'Material',type:'select',options:db.inventory.map(i=>[i.id,i.name]),required:true},{name:'qty',label:'Quantidade',type:'number',required:true},{name:'date',label:'Data',type:'date',required:true},{name:'requester',label:'Solicitante',required:true},{name:'purpose',label:'Justificativa / finalidade',type:'textarea',full:true,required:true}
],d=>{d.qty=+d.qty||0;if(d.qty<=0)return false;db.requests.unshift({id:uid('s'),...d,status:'Pendente',decision:'',decidedAt:''});audit('Solicitação','Estoque',`${nupdecName(d.nupdecId)} solicitou ${d.qty} de ${itemName(d.itemId)}.`);},{date:TODAY(),requester:roleLabel()});}
function decideRequest(id,status){if(!canStock())return toast('Perfil sem permissão.');const r=db.requests.find(x=>x.id===id);if(!r||r.status!=='Pendente')return;const item=db.inventory.find(i=>i.id===r.itemId);if(status==='Aprovada'){
  const loc=locationFor('NUPDEC',r.nupdecId);if(!item||!loc)return toast('Não foi possível localizar item ou estoque da NUPDEC.');if(locationStock(item,'loc1')<Number(r.qty)){return toast('Saldo insuficiente no estoque central.');}
  applyMovement(item,'loc1',loc.id,Number(r.qty),TODAY(),roleLabel(),`Atendimento da solicitação ${r.id}`);
}
  r.status=status;r.decidedAt=TODAY();r.decision=`${status} por ${roleLabel()}`;audit('Decisão','Solicitações',`${r.id} ${status.toLowerCase()}.`);save();render();toast(`Solicitação ${status.toLowerCase()}.`);
}

function showItem(id){const i=db.inventory.find(x=>x.id===id);if(!i)return;const custodyOpen=db.custodies.filter(c=>c.itemId===id&&c.status==='Em cautela').reduce((s,c)=>s+Number(c.qty||0),0);openDetail(i.name,`Código ${i.code||i.id}`,`<div class="qr-wrap"><div id="qrTarget" class="qr-box"></div><div><p><strong>Código:</strong> <span class="code">${esc(i.code||i.id)}</span></p><p><strong>Categoria:</strong> ${esc(i.category)}</p><p><strong>Total em estoque:</strong> ${totalStock(i)} ${esc(i.unit)}</p><p><strong>Em cautela:</strong> ${custodyOpen}</p><p><strong>Condição:</strong> ${esc(i.condition||'-')}</p><p><strong>Validade:</strong> ${fmtDate(i.validity)}</p><button class="btn ghost" onclick="printItemQr('${i.id}')">Imprimir identificação</button></div></div><div class="card" style="margin-top:16px;box-shadow:none"><h3>Distribuição</h3><div class="compact-list">${db.locations.map(l=>`<div class="compact-item"><span>${esc(l.name)}</span><strong>${locationStock(i,l.id)} ${esc(i.unit)}</strong></div>`).join('')}</div></div>`);setTimeout(()=>renderQr('qrTarget',`COMPDEC|ITEM|${i.id}|${i.code||''}|${i.name}`),0);}
function renderQr(targetId,text){const el=document.getElementById(targetId);if(!el)return;el.innerHTML='';if(typeof QRCode==='undefined'){el.innerHTML=`<span class="code">${esc(text)}</span>`;return;}new QRCode(el,{text,width:140,height:140});}
function printItemQr(id){const i=db.inventory.find(x=>x.id===id);if(!i)return;const target=document.querySelector('#qrTarget img')||document.querySelector('#qrTarget canvas');let src='';if(target?.tagName==='IMG')src=target.src;else if(target?.toDataURL)src=target.toDataURL();const w=window.open('','_blank','width=500,height=600');w.document.write(`<html><head><title>${esc(i.code)}</title><style>body{font-family:Arial;text-align:center;padding:30px}.box{border:2px solid #111;padding:20px;display:inline-block}img{width:220px;height:220px}.code{font-size:20px;font-weight:bold}</style></head><body><div class="box"><h2>DEFESA CIVIL - COMPDEC</h2>${src?`<img src="${src}">`:''}<p class="code">${esc(i.code||i.id)}</p><p>${esc(i.name)}</p></div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}

function showNupdec(id){const n=db.nupdecs.find(x=>x.id===id);if(!n)return;const r=readiness(n);const members=db.volunteers.filter(v=>v.nupdec===id);const loc=locationFor('NUPDEC',id);const stock=loc?db.inventory.filter(i=>locationStock(i,loc.id)>0).map(i=>`${i.name}: ${locationStock(i,loc.id)} ${i.unit}`):[];const tr=db.trainings.filter(x=>x.nupdecId===id).sort((a,b)=>b.date.localeCompare(a.date));const mt=db.meetings.filter(x=>x.nupdecId===id).sort((a,b)=>b.date.localeCompare(a.date));const al=db.alerts.filter(x=>!x.targetNupdec||x.targetNupdec===id).sort((a,b)=>b.date.localeCompare(a.date));openDetail(n.name,`${n.neighborhood} · prontidão ${r.score}%`,`<div class="detail-grid"><div class="detail-card"><h3>Estrutura</h3><p><strong>Liderança:</strong> ${esc(n.leader||'-')}</p><p><strong>Contato:</strong> ${esc(n.phone||'-')}</p><p><strong>Ponto de encontro:</strong> ${esc(n.meetingPoint||'-')}</p><p><strong>Cobertura:</strong> ${esc(n.coverage||'-')}</p><p><strong>Última conferência de estoque:</strong> ${fmtDate(n.lastInventoryCheck)}</p></div><div class="detail-card"><h3>Prontidão ${r.score}%</h3>${r.checks.map(c=>`<div class="checkline"><span>${esc(c.label)}</span><strong class="${c.ok?'success-text':'warning-text'}">${c.ok?'OK':'Pendente'}</strong></div>`).join('')}</div><div class="detail-card"><h3>Voluntários (${members.length})</h3>${members.map(v=>`<p>${esc(v.name)} · ${pill(v.status)}</p>`).join('')||'<p class="muted">Sem voluntários.</p>'}</div><div class="detail-card"><h3>Materiais no núcleo</h3>${stock.map(s=>`<p>${esc(s)}</p>`).join('')||'<p class="muted">Sem materiais registrados.</p>'}</div><div class="detail-card"><h3>Treinamentos</h3>${tr.slice(0,5).map(x=>`<p>${fmtDate(x.date)} · ${esc(x.title)}</p>`).join('')||'<p class="muted">Sem registros.</p>'}</div><div class="detail-card"><h3>Reuniões</h3>${mt.slice(0,5).map(x=>`<p>${fmtDate(x.date)} · ${esc(x.title)}</p>`).join('')||'<p class="muted">Sem registros.</p>'}</div><div class="detail-card" style="grid-column:1/-1"><h3>Avisos relacionados</h3>${al.slice(0,6).map(x=>`<p>${fmtDate(x.date)} · ${pill(x.level)} · ${esc(x.title)}</p>`).join('')||'<p class="muted">Sem registros.</p>'}</div></div>`);}

function showVolunteer(id){const v=db.volunteers.find(x=>x.id===id);if(!v)return;const trainings=db.trainings.filter(t=>(t.attendance||[]).includes(id)).sort((a,b)=>b.date.localeCompare(a.date));const meetings=db.meetings.filter(t=>(t.attendance||[]).includes(id)).sort((a,b)=>b.date.localeCompare(a.date));openDetail(v.name,`${nupdecName(v.nupdec)} · ${v.status}`,`<div class="detail-grid"><div class="detail-card"><h3>Cadastro</h3><p>Telefone: ${esc(v.phone||'-')}</p><p>E-mail: ${esc(v.email||'-')}</p><p>Disponibilidade: ${esc(v.availability||'-')}</p><p>Ingresso: ${fmtDate(v.joined)}</p><p>Habilidades: ${esc(v.skills||'-')}</p></div><div class="detail-card"><h3>Resumo</h3><p>Treinamentos/instruções: <strong>${trainings.length}</strong></p><p>Reuniões: <strong>${meetings.length}</strong></p><p>Vínculo: <strong>${esc(nupdecName(v.nupdec))}</strong></p></div><div class="detail-card"><h3>Capacitações</h3>${trainings.map(t=>`<p>${fmtDate(t.date)} · ${esc(t.title)} (${esc(t.type)})</p>`).join('')||'<p class="muted">Sem registros.</p>'}</div><div class="detail-card"><h3>Participação em reuniões</h3>${meetings.map(m=>`<p>${fmtDate(m.date)} · ${esc(m.title)}</p>`).join('')||'<p class="muted">Sem registros.</p>'}</div></div>`);}
function showActivity(type,id){const arr=type==='training'?db.trainings:db.meetings;const x=arr.find(y=>y.id===id);if(!x)return;const docs=db.documents.filter(d=>d.linkType===type&&d.linkId===id);openDetail(x.title,fmtDate(x.date),`<div class="detail-grid"><div class="detail-card"><h3>Informações</h3><p>NUPDEC: ${esc(x.nupdecId?nupdecName(x.nupdecId):x.audience||'-')}</p>${type==='training'?`<p>Tipo: ${esc(x.type)}</p><p>Instrutor: ${esc(x.instructor||'-')}</p><p>Conteúdo: ${esc(x.notes||'-')}</p>`:`<p>Ata / deliberações: ${esc(x.minutes||'-')}</p>`}</div><div class="detail-card"><h3>Lista de presença (${(x.attendance||[]).length})</h3>${(x.attendance||[]).map(v=>`<p>${esc(volunteerName(v))}</p>`).join('')||'<p class="muted">Sem presença nominal.</p>'}</div><div class="detail-card" style="grid-column:1/-1"><h3>Anexos vinculados</h3>${docs.map(d=>`<p>${esc(d.title||d.fileName)} · ${esc(d.type)}</p>`).join('')||'<p class="muted">Nenhum anexo vinculado.</p>'}</div></div>`);}

function addDocument(){if(!canCommunityEdit())return toast('Perfil sem permissão.');const linkOptions=[['','Sem vínculo específico'],...db.nupdecs.map(n=>[`nupdec:${n.id}`,`NUPDEC — ${n.name}`]),...db.trainings.map(t=>[`training:${t.id}`,`Treinamento — ${t.title}`]),...db.meetings.map(m=>[`meeting:${m.id}`,`Reunião — ${m.title}`]),...db.volunteers.map(v=>[`volunteer:${v.id}`,`Voluntário — ${v.name}`])];openModal('Anexar documento','Arquivos de até 700 KB podem ser armazenados neste protótipo. Para produção, use Firebase Storage.',[
  {name:'title',label:'Título do documento',required:true},{name:'type',label:'Tipo',type:'select',options:['Ata','Foto','Lista de presença','Certificado','Relatório','Termo','Outro']},{name:'link',label:'Vincular a',type:'select',options:linkOptions},{name:'date',label:'Data',type:'date',required:true},{name:'file',label:'Arquivo',type:'file',accept:'.pdf,.jpg,.jpeg,.png,.webp,.txt',required:true,full:true}
],async d=>{const file=d.file;if(!(file instanceof File)||!file.size){toast('Selecione um arquivo.');return false;}if(file.size>700*1024){toast('Neste protótipo, use arquivos de até 700 KB.');return false;}const dataUrl=await fileToDataUrl(file);const [linkType,linkId]=String(d.link||'').includes(':')?String(d.link).split(':'):['',''];const linkLabel=linkOptions.find(x=>x[0]===d.link)?.[1]||'Sem vínculo específico';db.documents.unshift({id:uid('doc'),title:d.title,type:d.type,date:d.date,fileName:file.name,mime:file.type,size:file.size,dataUrl,linkType,linkId,linkLabel});audit('Anexo','Documentos',`${d.title} anexado (${file.name}).`);return true;},{date:TODAY(),type:'Ata'});}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
function openDocument(id){const d=db.documents.find(x=>x.id===id);if(d?.dataUrl)window.open(d.dataUrl,'_blank');}
function deleteDocument(id){if(!canDelete())return;const d=db.documents.find(x=>x.id===id);if(!d)return;if(!confirm(`Excluir o documento "${d.title}"?`))return;db.documents=db.documents.filter(x=>x.id!==id);audit('Exclusão','Documentos',`${d.title} excluído.`);save();render();toast('Documento excluído.');}
function formatBytes(n){if(!n)return'0 B';if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;return`${(n/1048576).toFixed(1)} MB`;}

function quickAdd(){
  const actions={estoque:()=>editInventory(),cautelas:addCustody,solicitacoes:addRequest,nupdecs:()=>editNupdec(),equipes:()=>editTeam(),voluntarios:()=>editVolunteer(),treinamentos:()=>editTraining(),reunioes:()=>editMeeting(),avisos:()=>editAlert()};
  if(db.settings.role==='CONSULTA')return toast('Perfil somente para consulta.');actions[current]?.();
}
function exportCSV(type){
  let arr=[];
  if(type==='inventory')arr=db.inventory.map(i=>({codigo:i.code,item:i.name,categoria:i.category,unidade:i.unit,total:totalStock(i),compdec:locationStock(i,'loc1'),minimo:i.min,condicao:i.condition,validade:i.validity}));
  if(type==='nupdecs')arr=db.nupdecs.map(n=>({...n,voluntarios_ativos:membersInNupdec(n.id),prontidao:readiness(n).score}));
  if(type==='volunteers')arr=db.volunteers.map(v=>({...v,nupdec_nome:nupdecName(v.nupdec)}));
  if(type==='trainings')arr=db.trainings.map(t=>({...t,nupdec_nome:nupdecName(t.nupdecId),attendance:(t.attendance||[]).map(volunteerName).join(', ')}));
  if(type==='meetings')arr=db.meetings.map(t=>({...t,nupdec_nome:nupdecName(t.nupdecId),attendance:(t.attendance||[]).map(volunteerName).join(', ')}));
  if(type==='alerts')arr=db.alerts.map(a=>({...a,nupdec_nome:a.targetNupdec?nupdecName(a.targetNupdec):'Todas'}));
  if(type==='custodies')arr=db.custodies;
  if(type==='requests')arr=db.requests.map(r=>({...r,nupdec_nome:nupdecName(r.nupdecId),item_nome:itemName(r.itemId)}));
  if(type==='readiness')arr=db.nupdecs.map(n=>{const r=readiness(n);return {nupdec:n.name,bairro:n.neighborhood,voluntarios:r.members,prontidao:r.score,nivel:r.level,ultima_reuniao:r.lastMeeting?.date||'',ultimo_treinamento:r.lastTraining?.date||'',ultima_conferencia_estoque:n.lastInventoryCheck||''};});
  if(!arr.length)return toast('Sem dados para exportar.');
  const keys=[...new Set(arr.flatMap(o=>Object.keys(o)))];const csv=[keys.join(';'),...arr.map(o=>keys.map(k=>`"${String(Array.isArray(o[k])?o[k].join(', '):o[k]??'').replaceAll('"','""')}"`).join(';'))].join('\n');downloadBlob('\ufeff'+csv,`${type}.csv`,'text/csv;charset=utf-8');
}
function backup(){downloadBlob(JSON.stringify(db,null,2),`backup_compdec_${TODAY()}.json`,'application/json');}
function downloadBlob(text,name,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

function setupPWA(){
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;document.querySelector('#installBtn').hidden=false;});
  document.querySelector('#installBtn').onclick=async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;document.querySelector('#installBtn').hidden=true;};
  const updateOnline=()=>{const el=document.querySelector('#offlineStatus');const online=navigator.onLine;el.textContent=online?'Online':'Modo offline';el.classList.toggle('offline',!online);};window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);updateOnline();
}

document.querySelector('#closeModal').onclick=closeModal;
document.querySelector('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal();};
document.querySelector('#closeDetail').onclick=closeDetail;
document.querySelector('#detailBackdrop').onclick=e=>{if(e.target.id==='detailBackdrop')closeDetail();};
document.querySelector('#quickAddBtn').onclick=quickAdd;
document.querySelector('#backupBtn').onclick=backup;
document.querySelector('#roleSelect').value=db.settings.role;
document.querySelector('#roleSelect').onchange=e=>{db.settings.role=e.target.value;audit('Troca de perfil','Sistema',`Perfil de demonstração alterado para ${roleLabel()}.`);save();render();toast('Perfil alterado para demonstração.');};
setupPWA();
render();
