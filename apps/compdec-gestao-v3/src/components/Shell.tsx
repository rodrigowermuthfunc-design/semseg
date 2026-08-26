import { NavLink, Outlet } from 'react-router-dom'
import { Boxes, CalendarDays, ClipboardList, Gauge, GraduationCap, LayoutDashboard, LogOut, MapPinned, Megaphone, PackageCheck, ShieldCheck, Users, UsersRound, FileLock2, History, UserCog, ContactRound } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { can } from '../lib/permissions'

const items = [
  ['/', 'Dashboard', LayoutDashboard, 'dashboard'],
  ['/estoque', 'Estoque', Boxes, 'inventory'],
  ['/cautelas', 'Cautelas', PackageCheck, 'custodies'],
  ['/solicitacoes', 'Solicitações', ClipboardList, 'requests'],
  ['/nupdecs', 'NUPDECs / Mapa', MapPinned, 'nupdecs'],
  ['/equipes', 'Equipes', UsersRound, 'teams'],
  ['/voluntarios', 'Voluntários', Users, 'volunteers'],
  ['/voluntarios-dados', 'Dados privados', ContactRound, 'private-volunteers'],
  ['/treinamentos', 'Treinamentos', GraduationCap, 'activities'],
  ['/reunioes', 'Reuniões', CalendarDays, 'activities'],
  ['/avisos', 'Avisos', Megaphone, 'alerts'],
  ['/documentos', 'Documentos', FileLock2, 'documents'],
  ['/prontidao', 'Prontidão', Gauge, 'readiness'],
  ['/auditoria', 'Auditoria', History, 'audit'],
  ['/usuarios', 'Usuários e acessos', UserCog, 'users']
] as const

export function Shell() {
  const { user, claims, logout } = useAuth()
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><ShieldCheck size={30}/><div><b>COMPDEC</b><span>Gestão Integrada</span></div></div>
      <nav>{items.filter(i => can(claims?.role, i[3])).map(([path,label,Icon]) =>
        <NavLink key={path} to={path} end={path === '/'}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="account"><div><strong>{user?.displayName || user?.email}</strong><small>{claims?.role}</small></div><button onClick={logout} title="Sair"><LogOut size={18}/></button></div>
    </aside>
    <main className="main"><header className="topbar"><div><b>Coordenadoria Municipal de Proteção e Defesa Civil</b><span>Ambiente autenticado • acesso rastreado</span></div></header><Outlet/></main>
  </div>
}
