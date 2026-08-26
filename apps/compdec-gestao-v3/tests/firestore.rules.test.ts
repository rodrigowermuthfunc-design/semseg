import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import fs from 'node:fs'

let env: RulesTestEnvironment
beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-compdec',firestore:{rules:fs.readFileSync('firestore.rules','utf8')}})})
beforeEach(async()=>env.clearFirestore())
afterAll(async()=>env.cleanup())

const ctx=(uid:string,role:string,nupdecId?:string)=>env.authenticatedContext(uid,{email_verified:true,role,nupdecId})

describe('Firestore Rules COMPDEC',()=>{
  it('bloqueia acesso não autenticado',async()=>{await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'nupdecs/n1')))})
  it('permite gestor ler NUPDEC',async()=>{await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'nupdecs/n1'),{name:'NUPDEC Teste'}));await assertSucceeds(getDoc(doc(ctx('g1','GESTOR_COMPDEC').firestore(),'nupdecs/n1')))})
  it('líder não lê outro NUPDEC',async()=>{await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'nupdecs/n2'),{name:'Outro'})});await assertFails(getDoc(doc(ctx('l1','LIDER_NUPDEC','n1').firestore(),'nupdecs/n2')))})
  it('Consulta não escreve registros',async()=>{await assertFails(setDoc(doc(ctx('c1','CONSULTA').firestore(),'teams/t1'),{name:'Equipe'}))})
  it('cliente não grava auditLogs',async()=>{await assertFails(setDoc(doc(ctx('g1','GESTOR_COMPDEC').firestore(),'auditLogs/a1'),{action:'FAKE'}))})
  it('cliente não altera saldo de estoque',async()=>{await assertFails(setDoc(doc(ctx('a1','ALMOXARIFADO').firestore(),'stockBalances/s1'),{quantity:999999}))})
  it('líder lê voluntário do próprio NUPDEC',async()=>{await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'volunteers/v1'),{displayName:'Teste',nupdecId:'n1'}));await assertSucceeds(getDoc(doc(ctx('l1','LIDER_NUPDEC','n1').firestore(),'volunteers/v1')))})
  it('líder não lê voluntário de outro NUPDEC',async()=>{await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'volunteers/v2'),{displayName:'Teste',nupdecId:'n2'}));await assertFails(getDoc(doc(ctx('l1','LIDER_NUPDEC','n1').firestore(),'volunteers/v2')))})
})
