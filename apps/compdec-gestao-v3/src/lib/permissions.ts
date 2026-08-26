import type { Role } from '../types'

export const can = (role: Role | undefined, action: string) => {
  if (!role) return false
  if (role === 'SUPER_ADMIN') return true
  const matrix: Record<Role, string[]> = {
    SUPER_ADMIN: ['*'],
    GESTOR_COMPDEC: ['dashboard','inventory','nupdecs','teams','volunteers','activities','alerts','documents','audit','users','readiness','private-volunteers'],
    COORDENADOR: ['dashboard','inventory','nupdecs','teams','volunteers','activities','alerts','documents','audit','readiness','private-volunteers'],
    ALMOXARIFADO: ['dashboard','inventory','requests','custodies','readiness'],
    LIDER_NUPDEC: ['dashboard','nupdecs','volunteers','activities','requests','documents','readiness'],
    CONSULTA: ['dashboard','nupdecs','teams','readiness']
  }
  return matrix[role].includes(action)
}
