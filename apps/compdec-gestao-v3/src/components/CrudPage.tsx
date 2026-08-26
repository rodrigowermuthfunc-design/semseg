import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Edit3, Plus, Search, X } from 'lucide-react'
import { subscribeCollection, secureMutation } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import type { Role } from '../types'

export type Field = { key:string; label:string; type?:'text'|'number'|'date'|'select'|'textarea'; options?:string[]; required?:boolean }
type Props = { title:string; subtitle:string; collectionName:string; columns:Array<[string,string]>; fields:Field[]; allowedWriteRoles:Role[]; extra?:ReactNode }

export function CrudPage({title,subtitle,collectionName,columns,fields,allowedWriteRoles,extra}:Props){
  const {claims}=useAuth(); const [rows,setRows]=useState<any[]>([]); const [q,setQ]=useState(''); const [editing,setEditing]=useState<any|null>(null); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('')
  useEffect(()=>{
    const leaderScope = claims?.role === 'LIDER_NUPDEC' && claims.nupdecId
      ? { nupdecId: claims.nupdecId, byDocumentId: collectionName === 'nupdecs' }
      : undefined
    return subscribeCollection(collectionName,setRows,250,leaderScope)
  },[collectionName,claims?.role,claims?.nupdecId])
  const writable=!!claims?.role&&allowedWriteRoles.includes(claims.role)
  const filtered=useMemo(()=>rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase())),[rows,q])
  const open=(row:any={})=>setEditing({...row})
  const save=async()=>{if(!editing)return;setSaving(true);setMessage('');try{const payload:any={};for(const f of fields){let v=editing[f.key];if(f.type==='number'&&v!=='')v=Number(v);payload[f.key]=v??''}await secureMutation('upsertManagedRecord',{collection:collectionName,id:editing.id||undefined,data:payload});setEditing(null);setMessage('Registro salvo com auditoria.')}catch(e){setMessage(e instanceof Error?e.message:'Falha ao salvar')}finally{setSaving(false)}}
  return <section className="page"><div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div>{writable&&<button className="primary" onClick={()=>open()}><Plus size={17}/>Novo registro</button>}</div>{message&&<div className="notice">{message}</div>}{extra}
    <div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Pesquisar..." value={q} onChange={e=>setQ(e.target.value)}/></div><span className="muted">{filtered.length} registros</span></div>
    <div className="table-card"><table><thead><tr>{columns.map(([_,l])=><th key={l}>{l}</th>)}{writable&&<th>Ações</th>}</tr></thead><tbody>{filtered.map(r=><tr key={r.id}>{columns.map(([k])=><td key={k}>{format(r[k])}</td>)}{writable&&<td><button className="icon-btn" onClick={()=>open(r)} title="Editar"><Edit3 size={16}/></button></td>}</tr>)}{!filtered.length&&<tr><td colSpan={columns.length+(writable?1:0)} className="empty">Nenhum registro.</td></tr>}</tbody></table></div>
    {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}><div className="modal"><div className="modal-head"><div><h2>{editing.id?'Editar':'Novo'} registro</h2><small>{title}</small></div><button className="icon-btn" onClick={()=>setEditing(null)}><X size={18}/></button></div><div className="form-grid">{fields.map(f=><label key={f.key} className={f.type==='textarea'?'span2':''}>{f.label}{f.type==='select'?<select value={editing[f.key]??''} onChange={e=>setEditing({...editing,[f.key]:e.target.value})} required={f.required}><option value="">Selecione</option>{f.options?.map(o=><option key={o}>{o}</option>)}</select>:f.type==='textarea'?<textarea rows={4} value={editing[f.key]??''} onChange={e=>setEditing({...editing,[f.key]:e.target.value})} required={f.required}/>:<input type={f.type||'text'} value={editing[f.key]??''} onChange={e=>setEditing({...editing,[f.key]:e.target.value})} required={f.required}/>}</label>)}</div><div className="modal-actions"><button className="secondary" onClick={()=>setEditing(null)}>Cancelar</button><button className="primary" disabled={saving} onClick={save}>{saving?'Salvando...':'Salvar'}</button></div></div></div>}
  </section>
}
function format(v:any){if(v==null||v==='')return '—';if(typeof v==='boolean')return v?'Sim':'Não';if(v?.toDate)return v.toDate().toLocaleString('pt-BR');if(Array.isArray(v))return v.join(', ');return String(v)}
