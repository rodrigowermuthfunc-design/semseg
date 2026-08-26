import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Boxes, Gauge, MapPinned, Users } from 'lucide-react'
import { collection, documentId, onSnapshot, query, where, type Query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'

export function Dashboard(){
 const { claims }=useAuth()
 const [counts,setCounts]=useState({nupdecs:0,volunteers:0,items:0,requests:0})
 useEffect(()=>{
  if(!claims?.role)return
  const unsubs:Array<()=>void>=[]
  const safe=(q:Query,key:keyof typeof counts,predicate?:(d:any)=>boolean)=>unsubs.push(onSnapshot(q,s=>setCounts(x=>({...x,[key]:predicate?s.docs.filter(d=>predicate(d.data())).length:s.size})),()=>setCounts(x=>({...x,[key]:0}))))
  const isManager=['SUPER_ADMIN','GESTOR_COMPDEC','COORDENADOR'].includes(claims.role)
  const isStock=isManager||claims.role==='ALMOXARIFADO'
  if(claims.role==='LIDER_NUPDEC'&&claims.nupdecId){
    safe(query(collection(db,'nupdecs'),where(documentId(),'==',claims.nupdecId)),'nupdecs')
    safe(query(collection(db,'volunteers'),where('nupdecId','==',claims.nupdecId)),'volunteers')
    safe(query(collection(db,'materialRequests'),where('nupdecId','==',claims.nupdecId)),'requests',d=>d.status==='PENDENTE')
  }else{
    safe(query(collection(db,'nupdecs')),'nupdecs')
    if(isManager)safe(query(collection(db,'volunteers')),'volunteers')
    if(isStock){safe(query(collection(db,'inventoryItems')),'items');safe(query(collection(db,'materialRequests')),'requests',d=>d.status==='PENDENTE')}
  }
  return()=>unsubs.forEach(u=>u())
 },[claims?.role,claims?.nupdecId])
 return <section className="page"><div className="page-head"><div><h1>Visão operacional</h1><p>Situação consolidada conforme o seu perfil de acesso.</p></div></div>
  <div className="kpis"><Kpi icon={<MapPinned/>} label="NUPDECs visíveis" value={counts.nupdecs}/><Kpi icon={<Users/>} label="Voluntários visíveis" value={counts.volunteers}/><Kpi icon={<Boxes/>} label="Itens cadastrados" value={counts.items}/><Kpi icon={<AlertTriangle/>} label="Solicitações pendentes" value={counts.requests}/></div>
  <div className="grid2"><div className="panel"><h2><Gauge size={19}/> Prontidão operacional</h2><p>Use o módulo Prontidão para acompanhar treinamento, reuniões, comunicação, localização e conferência de estoque de cada núcleo.</p></div><div className="panel"><h2>Segurança e LGPD</h2><p>Dados pessoais são segregados, o acesso é por função, exclusões destrutivas são bloqueadas e operações críticas passam pelo backend auditável.</p></div></div>
 </section>
}
function Kpi({icon,label,value}:{icon:ReactNode,label:string,value:number}){return <div className="kpi"><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>}
