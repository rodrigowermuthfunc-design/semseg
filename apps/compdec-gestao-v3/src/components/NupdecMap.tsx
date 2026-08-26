import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'
import 'leaflet/dist/leaflet.css'

export function NupdecMap(){
  const { claims } = useAuth()
  const [rows,setRows]=useState<any[]>([])
  useEffect(()=>{
    const base = collection(db,'nupdecs')
    const q = claims?.role === 'LIDER_NUPDEC' && claims.nupdecId
      ? query(base, where(documentId(),'==',claims.nupdecId))
      : query(base)
    return onSnapshot(q,s=>setRows(s.docs.map(d=>({id:d.id,...d.data()}))),()=>setRows([]))
  },[claims?.role,claims?.nupdecId])
  const points=rows.filter(r=>Number.isFinite(Number(r.latitude))&&Number.isFinite(Number(r.longitude)))
  return <div className="map-panel"><MapContainer center={[-29.17,-51.52]} zoom={11} scrollWheelZoom={false} style={{height:360,width:'100%'}}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{points.map(r=><CircleMarker key={r.id} center={[Number(r.latitude),Number(r.longitude)]} radius={9}><Popup><b>{r.name}</b><br/>{r.neighborhood}<br/>{r.volunteerCount||0} voluntários<br/>{r.meetingPoint||'Ponto de encontro não informado'}</Popup></CircleMarker>)}</MapContainer>{!points.length&&<div className="map-empty">Cadastre latitude e longitude para visualizar as NUPDECs no mapa.</div>}</div>
}
