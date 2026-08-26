import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

const config = useEmulators
  ? {
      apiKey: 'demo-key', authDomain: 'demo-compdec.firebaseapp.com', projectId: 'demo-compdec',
      storageBucket: 'demo-compdec.appspot.com', messagingSenderId: '000000000000', appId: '1:000:web:demo'
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    }

if (!useEmulators && (!config.apiKey || !config.projectId || !config.appId)) {
  throw new Error('Configuração Firebase ausente. Preencha .env.local ou use VITE_USE_EMULATORS=true.')
}

export const app = initializeApp(config)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'southamerica-east1')
export const storage = getStorage(app)

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
} else {
  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
  if (!siteKey) throw new Error('VITE_RECAPTCHA_ENTERPRISE_SITE_KEY é obrigatório em produção.')
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true
  })
}

export { useEmulators }
