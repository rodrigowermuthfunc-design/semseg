import { getFirestore, FieldValue } from 'firebase-admin/firestore'

type Audit = { actorUid:string; actorEmail?:string; action:string; resourceType:string; resourceId?:string; metadata?:Record<string,unknown> }
export async function audit(entry: Audit){
  const safeMeta = sanitize(entry.metadata || {})
  await getFirestore().collection('auditLogs').add({...entry,metadata:safeMeta,createdAt:FieldValue.serverTimestamp()})
}
function sanitize(input:Record<string,unknown>){const blocked=['password','token','cpf','rg','phone','email','address','birthDate'];return Object.fromEntries(Object.entries(input).filter(([k])=>!blocked.some(b=>k.toLowerCase().includes(b.toLowerCase()))))}
