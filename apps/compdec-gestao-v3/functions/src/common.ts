import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { z } from 'zod'
import type { Role } from './security.js'

if (!getApps().length) initializeApp()
export const db = getFirestore()
export const adminAuth = getAuth()
export const managers: Role[] = ['SUPER_ADMIN','GESTOR_COMPDEC','COORDENADOR']
export const stockRoles: Role[] = [...managers,'ALMOXARIFADO']
export const id = z.string().min(1).max(128)
export const positiveQty = z.number().positive().max(1_000_000)
