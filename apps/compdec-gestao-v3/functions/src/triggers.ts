import { FieldValue } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { db } from './common.js'

async function syncCount(nupdecId:string){
  if(!nupdecId)return
  const active=await db.collection('volunteers').where('nupdecId','==',nupdecId).where('status','==','ATIVO').get()
  await db.doc(`nupdecs/${nupdecId}`).set({volunteerCount:active.size,volunteerCountUpdatedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true})
}

export const syncVolunteerCount = onDocumentWritten('volunteers/{volunteerId}',async event=>{
  const before=event.data?.before.data()
  const after=event.data?.after.data()
  const ids=new Set([String(before?.nupdecId||''),String(after?.nupdecId||'')].filter(Boolean))
  await Promise.all([...ids].map(syncCount))
})
