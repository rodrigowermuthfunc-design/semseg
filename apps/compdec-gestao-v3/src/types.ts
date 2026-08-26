export type Role = 'SUPER_ADMIN' | 'GESTOR_COMPDEC' | 'COORDENADOR' | 'ALMOXARIFADO' | 'LIDER_NUPDEC' | 'CONSULTA'

export interface SessionClaims {
  role: Role
  nupdecId?: string
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  role: Role
  nupdecId?: string
  active: boolean
}

export interface Nupdec {
  id: string
  name: string
  neighborhood: string
  leaderName?: string
  status: 'ATIVA' | 'FORMACAO' | 'INATIVA'
  meetingPoint?: string
  latitude?: number
  longitude?: number
  volunteerCount?: number
  readiness?: number
}

export interface InventoryItem {
  id: string
  code: string
  name: string
  category: string
  unit: string
  minimumStock: number
  active: boolean
}

export interface StockLocation {
  id: string
  name: string
  type: 'COMPDEC' | 'NUPDEC' | 'EQUIPE'
  nupdecId?: string
  teamId?: string
}

export interface StockBalance {
  itemId: string
  locationId: string
  quantity: number
}
