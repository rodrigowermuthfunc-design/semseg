import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { subscribeCollection } from '../lib/data'

type Props = { title:string; subtitle:string; collectionName:string; columns:Array<[string,string]>; createLabel?:string; onCreate?:()=>void }
export function GenericPage({title,subtitle,collectionName,columns,createLabel,onCreate}:Props){
  const [rows,setRows]=useState<any[]>([]); const [q,setQ]=useState(''); const [loading,setLoading]=useState(true)
  useEffect(()=>subscribeCollection(collectionName, r=>{setRows(r);setLoading(false)}),[collectionName])
  const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
  return <section className="page"><div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div>{createLabel&&<button className="primary" onClick={onCreate}><Plus size={17}/>{createLabel}</button>}</div>
    <div className="toolbar"><div className="search"><Search size={17}/><input placeholder="Pesquisar..." value={q} onChange={e=>setQ(e.target.value)}/></div><span className="muted">{loading?<><RefreshCw size={14}/> carregando</>:`${filtered.length} registros`}</span></div>
    <div className="table-card"><table><thead><tr>{columns.map(([_,l])=><th key={l}>{l}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id}>{columns.map(([k])=><td key={k}>{format(r[k])}</td>)}</tr>)}{!loading&&!filtered.length&&<tr><td colSpan={columns.length} className="empty">Nenhum registro encontrado.</td></tr>}</tbody></table></div>
  </section>
}
const format=(v:any)=>{if(v==null||v==='')return '—';if(typeof v==='boolean')return v?'Sim':'Não';if(typeof v==='object'&&typeof v.toDate==='function')return v.toDate().toLocaleString('pt-BR');if(Array.isArray(v))return v.join(', ');return String(v)}
