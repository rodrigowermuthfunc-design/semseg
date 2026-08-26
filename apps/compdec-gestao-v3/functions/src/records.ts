import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { audit } from './audit.js'
import { db, managers, stockRoles } from './common.js'
import { requireAppCheck, requireAuth, requireRole, type Role } from './security.js'

const managedSchemas = {
  nupdecs: z.object({name:z.string().min(2).max(120),neighborhood:z.string().min(2).max(120),leaderName:z.string().max(120).optional().default(''),status:z.enum(['ATIVA','FORMACAO','INATIVA']),meetingPoint:z.string().max(300).optional().default(''),latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional()}),
  teams: z.object({name:z.string().min(2).max(120),type:z.string().min(2).max(100),leaderName:z.string().max(120).optional().default(''),status:z.enum(['ATIVA','INATIVA'])}),
  volunteers: z.object({displayName:z.string().min(2).max(120),nupdecId:z.string().max(128).optional().default(''),nupdecName:z.string().max(120).optional().default(''),status:z.enum(['ATIVO','INATIVO','PENDENTE']),skills:z.union([z.string().max(500),z.array(z.string().max(80)).max(30)]).optional().default('')}),
  trainings: z.object({title:z.string().min(2).max(160),type:z.string().min(2).max(80),nupdecId:z.string().max(128).optional().default(''),nupdecName:z.string().max(120).optional().default(''),date:z.string().min(8).max(40),participantCount:z.number().int().min(0).max(10000).optional().default(0),participantIds:z.string().max(5000).optional().default(''),notes:z.string().max(3000).optional().default('')}),
  meetings: z.object({title:z.string().min(2).max(160),nupdecId:z.string().max(128).optional().default(''),nupdecName:z.string().max(120).optional().default(''),date:z.string().min(8).max(40),participantCount:z.number().int().min(0).max(10000).optional().default(0),participantIds:z.string().max(5000).optional().default(''),minutes:z.string().max(10000).optional().default('')}),
  alerts: z.object({level:z.enum(['INFORMATIVO','ATENCAO','ALERTA','EMERGENCIA']),title:z.string().min(2).max(180),audience:z.string().min(2).max(250),nupdecId:z.string().max(128).optional().default(''),channels:z.string().max(300).optional().default(''),message:z.string().max(5000).optional().default('')}),
  inventoryItems: z.object({code:z.string().min(1).max(80),name:z.string().min(2).max(160),category:z.string().min(2).max(120),unit:z.string().min(1).max(40),minimumStock:z.number().min(0).max(1000000),active:z.boolean().default(true)}),
  stockLocations: z.object({name:z.string().min(2).max(160),type:z.enum(['COMPDEC','NUPDEC','EQUIPE']),nupdecId:z.string().max(128).optional().default(''),teamId:z.string().max(128).optional().default('')})
} as const

type ManagedCollection = keyof typeof managedSchemas
const managerOnly = new Set<ManagedCollection>(['nupdecs','teams','alerts'])
const stockOnly = new Set<ManagedCollection>(['inventoryItems','stockLocations'])

export const upsertManagedRecord = onCall({enforceAppCheck:true},async req=>{
  requireAppCheck(req); const a=requireAuth(req); const role=a.token.role as Role|undefined; if(!role)throw new HttpsError('permission-denied','Perfil ausente.')
  const envelope=z.object({collection:z.enum(['nupdecs','teams','volunteers','trainings','meetings','alerts','inventoryItems','stockLocations']),id:z.string().max(128).optional(),data:z.record(z.string(),z.unknown())}).parse(req.data)
  const collection=envelope.collection as ManagedCollection
  if(managerOnly.has(collection)&&!managers.includes(role))throw new HttpsError('permission-denied','Operação restrita à gestão.')
  if(stockOnly.has(collection)&&!stockRoles.includes(role))throw new HttpsError('permission-denied','Operação restrita ao estoque.')
  if(['volunteers','trainings','meetings'].includes(collection)&&!managers.includes(role)&&role!=='LIDER_NUPDEC')throw new HttpsError('permission-denied','Perfil sem permissão.')
  const parsed=(managedSchemas[collection] as z.ZodTypeAny).parse(envelope.data) as Record<string,unknown>
  if(role==='LIDER_NUPDEC'){const own=String(a.token.nupdecId||'');if(!own)throw new HttpsError('permission-denied','Líder sem NUPDEC vinculada.');if(String(parsed.nupdecId||'')!==own)throw new HttpsError('permission-denied','Acesso limitado ao próprio NUPDEC.')}
  const ref=envelope.id?db.doc(`${collection}/${envelope.id}`):db.collection(collection).doc();const before=envelope.id?await ref.get():null
  await ref.set({...parsed,updatedAt:FieldValue.serverTimestamp(),...(before?.exists?{}:{createdAt:FieldValue.serverTimestamp()}),updatedByUid:a.uid},{merge:true})
  if(collection==='nupdecs'&&!before?.exists){const loc=db.collection('stockLocations').doc();await loc.set({name:`Estoque ${String(parsed.name)}`,type:'NUPDEC',nupdecId:ref.id,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()})}
  await audit({actorUid:a.uid,actorEmail:a.token.email as string|undefined,action:before?.exists?'RECORD_UPDATE':'RECORD_CREATE',resourceType:collection,resourceId:ref.id,metadata:{fields:Object.keys(parsed)}});return{ok:true,id:ref.id}
})

export const upsertVolunteerPrivate = onCall({enforceAppCheck:true},async req=>{requireAppCheck(req);const{auth}=requireRole(req,managers);const data=z.object({volunteerId:z.string().min(1).max(128),nupdecId:z.string().max(128).optional().default(''),phone:z.string().max(40).optional().default(''),email:z.string().email().or(z.literal('')).optional().default(''),address:z.string().max(400).optional().default(''),emergencyContact:z.string().max(200).optional().default(''),notes:z.string().max(2000).optional().default('')}).parse(req.data);await db.doc(`volunteerPrivate/${data.volunteerId}`).set({...data,updatedAt:FieldValue.serverTimestamp()},{merge:true});await audit({actorUid:auth.uid,action:'VOLUNTEER_PRIVATE_UPDATE',resourceType:'volunteerPrivate',resourceId:data.volunteerId,metadata:{fields:['phone','email','address','emergencyContact','notes']}});return{ok:true}})

export const registerDocument = onCall({enforceAppCheck:true},async req=>{requireAppCheck(req);const a=requireAuth(req);const role=a.token.role as Role|undefined;if(!role||(!managers.includes(role)&&role!=='LIDER_NUPDEC'))throw new HttpsError('permission-denied','Sem permissão.');const data=z.object({title:z.string().min(2).max(180),category:z.enum(['ATA','RELATORIO','CERTIFICADO','TERMO','FOTO','OUTRO']),nupdecId:z.string().max(128).optional().default(''),storagePath:z.string().min(3).max(1000),contentType:z.enum(['application/pdf','image/jpeg','image/png']),size:z.number().int().min(1).max(10*1024*1024)}).parse(req.data);if(role==='LIDER_NUPDEC'&&String(a.token.nupdecId||'')!==data.nupdecId)throw new HttpsError('permission-denied','Acesso limitado ao próprio NUPDEC.');const ref=db.collection('documents').doc();await ref.set({...data,createdByUid:a.uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});await audit({actorUid:a.uid,action:'DOCUMENT_REGISTER',resourceType:'document',resourceId:ref.id,metadata:{category:data.category,nupdecId:data.nupdecId,size:data.size,contentType:data.contentType}});return{ok:true,id:ref.id}})
