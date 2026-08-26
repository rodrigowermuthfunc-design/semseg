import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMultiFactorResolver, onAuthStateChanged, signInWithEmailAndPassword, signOut, TotpMultiFactorGenerator, type User, type UserCredential } from 'firebase/auth'
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
      let result: UserCredential
      try {
        result = await signInWithEmailAndPassword(auth, email.trim(), password)
      } catch (err: any) {
        if (err?.code !== 'auth/multi-factor-auth-required') throw err
        const resolver = getMultiFactorResolver(auth, err)
        const hint = resolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID)
        if (!hint) throw new Error('A conta exige um segundo fator não suportado neste cliente. Contate o administrador.')
        const otp = window.prompt('Digite o código de 6 dígitos do seu aplicativo autenticador:')?.trim()
        if (!otp) throw new Error('Código MFA obrigatório.')
        const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, otp)
        result = await resolver.resolveSignIn(assertion)
      }
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
