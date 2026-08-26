import { useEffect, useMemo, useState } from 'react'
import { Edit3, Search, ShieldCheck, X } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { secureMutation } from '../lib/data'

type PrivateRow={id:string;volunteerId?:string;nupdecId?:string;phone?:string;email?:string;address?:string;emergencyContact?:string;notes?:string}

export function VolunteerPrivate(){
  const [volunteers,setVolunteers]=useState<any[]>([])
  const [privates,setPrivates]=useState<PrivateRow[]>([])
  const [q,setQ]=useState('')
  const [editing,setEditing]=useState<any|null>(null)
  const [msg,setMsg]=useState('')
  const [saving,setSaving]=useState(false)
  useEffect(()=>{const a=onSnapshot(collection(db,'volunteers'),s=>setVolunteers(s.docs.map(d=>({id:d.id,...d.data()}))));const b=onSnapshot(collection(db,'volunteerPrivate'),s=>setPrivates(s.docs.map(d=>({id:d.id,...d.data()}))));return()=>{a();b()}},[])
  const rows=useMemo(()=>volunteers.map(v=>({...v,private:privates.find(p=>p.id===v.id||p.volunteerId===v.id)})).filter(v=>JSON.stringify(v).toLowerCase().includes(q.toLowerCase())),[volunteers,privates,q])
  const edit=(v:any)=>setEditing({volunteerId:v.id,nupdecId:v.nupdecId||'',phone:v.private?.phone||'',email:v.private?.email||'',address:v.private?.address||'',emergencyContact:v.private?.emergencyContact||'',notes:v.private?.notes||''})
  const save=async()=>{if(!editing)return;setSaving(true);setMsg('');try{await secureMutation('upsertVolunteerPrivate',editing);setEditing(null);setMsg('Dados privados atualizados com auditoria.')}catch(e){setMsg(e instanceof Error?e.message:'Falha ao salvar')}finally{setSaving(false)}}
  return <section className="page"><div className="page-head"><div><h1>Dados privados dos voluntários</h1><p>Área restrita à gestão. Contatos e informações pessoais ficam separados do cadastro operacional.</p></div><div className="security-badge"><ShieldCheck size={17}/>Acesso restrito</div></div>{msg&&<div className="notice">{msg}</div>}<div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Pesquisar voluntário..." value={q} onChange={e=>setQ(e.target.value)}/></div><span className="muted">{rows.length} registros</span></div><div className="table-card"><table><thead><tr><th>Voluntário</th><th>NUPDEC</th><th>Telefone</th><th>E-mail</th><th>Contato emergência</th><th>Ação</th></tr></thead><tbody>{rows.map(v=><tr key={v.id}><td>{v.displayName}</td><td>{v.nupdecName||v.nupdecId||'—'}</td><td>{v.private?.phone||'—'}</td><td>{v.private?.email||'—'}</td><td>{v.private?.emergencyContact||'—'}</td><td><button className="icon-btn" onClick={()=>edit(v)} title="Editar dados privados"><Edit3 size={16}/></button></td></tr>)}</tbody></table></div>{editing&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><h2>Dados privados</h2><small>Somente gestão autorizada</small></div><button className="icon-btn" onClick={()=>setEditing(null)}><X size={18}/></button></div><div className="form-grid"><label>Telefone<input value={editing.phone} onChange={e=>setEditing({...editing,phone:e.target.value})}/></label><label>E-mail<input type="email" value={editing.email} onChange={e=>setEditing({...editing,email:e.target.value})}/></label><label className="span2">Endereço<input value={editing.address} onChange={e=>setEditing({...editing,address:e.target.value})}/></label><label className="span2">Contato de emergência<input value={editing.emergencyContact} onChange={e=>setEditing({...editing,emergencyContact:e.target.value})}/></label><label className="span2">Observações restritas<textarea rows={4} value={editing.notes} onChange={e=>setEditing({...editing,notes:e.target.value})}/></label></div><div className="modal-actions"><button className="secondary" onClick={()=>setEditing(null)}>Cancelar</button><button className="primary" disabled={saving} onClick={save}>{saving?'Salvando...':'Salvar'}</button></div></div></div>}</section>
}
