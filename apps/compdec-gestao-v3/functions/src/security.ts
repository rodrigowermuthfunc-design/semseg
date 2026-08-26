import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

export type Role = 'SUPER_ADMIN'|'GESTOR_COMPDEC'|'COORDENADOR'|'ALMOXARIFADO'|'LIDER_NUPDEC'|'CONSULTA'

export function requireAuth(req: CallableRequest<unknown>) {
  if (!req.auth) throw new HttpsError('unauthenticated','Autenticação obrigatória.')
  if (req.auth.token.email_verified !== true) throw new HttpsError('permission-denied','E-mail não verificado.')
  return req.auth
}

export function requireRole(req: CallableRequest<unknown>, allowed: Role[]) {
  const auth = requireAuth(req)
  const role = auth.token.role as Role | undefined
  if (!role || !allowed.includes(role)) throw new HttpsError('permission-denied','Perfil sem permissão.')
  return { auth, role, nupdecId: auth.token.nupdecId as string | undefined }
}

export function requireAppCheck(req: CallableRequest<unknown>) {
  if (!process.env.FUNCTIONS_EMULATOR && !req.app) throw new HttpsError('failed-precondition','App Check obrigatório.')
}
