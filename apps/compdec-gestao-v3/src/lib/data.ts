import { collection, documentId, limit, onSnapshot, query, where, type DocumentData } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'

type Scope = { nupdecId?: string; byDocumentId?: boolean }

export function subscribeCollection(name: string, cb: (rows: Array<{id:string} & DocumentData>) => void, max = 250, scope?: Scope) {
  const constraints = [] as any[]
  if (scope?.nupdecId) constraints.push(where(scope.byDocumentId ? documentId() : 'nupdecId', '==', scope.nupdecId))
  constraints.push(limit(max))
  const q = query(collection(db, name), ...constraints)
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([]))
}

export async function secureMutation<T = unknown>(name: string, payload: unknown): Promise<T> {
  const fn = httpsCallable(functions, name)
  const res = await fn(payload)
  return res.data as T
}
