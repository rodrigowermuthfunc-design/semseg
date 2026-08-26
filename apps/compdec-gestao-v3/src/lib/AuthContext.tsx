import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { auth } from './firebase'
import type { Role, SessionClaims } from '../types'

type AuthState = {
  user: User | null
  claims: SessionClaims | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshClaims: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<SessionClaims | null>(null)
  const [loading, setLoading] = useState(true)

  const loadClaims = async (u: User | null, force = false) => {
    if (!u) { setClaims(null); return }
    const token = await u.getIdTokenResult(force)
    const role = token.claims.role as Role | undefined
    if (!role) { setClaims(null); return }
    setClaims({ role, nupdecId: token.claims.nupdecId as string | undefined })
  }

  useEffect(() => onAuthStateChanged(auth, async u => {
    setUser(u)
    try { await loadClaims(u) } finally { setLoading(false) }
  }), [])

  const value = useMemo<AuthState>(() => ({
    user, claims, loading,
    login: async (email, password) => {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password)
      if (!result.user.emailVerified) {
        await signOut(auth)
        throw new Error('E-mail ainda não verificado. Acesso bloqueado.')
      }
      await loadClaims(result.user, true)
    },
    logout: () => signOut(auth),
    refreshClaims: () => loadClaims(auth.currentUser, true)
  }), [user, claims, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
