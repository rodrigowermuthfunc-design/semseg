import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export function Login() {
  const { user, claims, login } = useAuth()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  if (user && claims) return <Navigate to="/" replace />
  return <div className="login-page"><form className="login-card" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await login(email,password)}catch(err){setError(err instanceof Error?err.message:'Falha no login')}finally{setBusy(false)}}}>
    <div className="login-logo"><ShieldCheck size={42}/></div><h1>COMPDEC</h1><p>Gestão Integrada e Segura</p>
    <label>E-mail institucional<input autoComplete="username" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
    <label>Senha<input autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/></label>
    {error && <div className="error">{error}</div>}
    <button className="primary" disabled={busy}><LockKeyhole size={17}/>{busy?'Autenticando...':'Entrar'}</button>
    <small>Não compartilhe credenciais. Ações administrativas são auditadas.</small>
  </form></div>
}
