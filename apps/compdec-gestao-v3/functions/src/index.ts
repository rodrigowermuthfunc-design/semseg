import { setGlobalOptions } from 'firebase-functions/v2/options'
setGlobalOptions({ region: 'southamerica-east1', memory: '256MiB', timeoutSeconds: 30, maxInstances: 20 })

export { moveStock, createMaterialRequest, approveMaterialRequest, rejectMaterialRequest, createCustody, returnCustody } from './stock.js'
export { adminCreateUser, setUserRole } from './users.js'
export { upsertManagedRecord, upsertVolunteerPrivate, registerDocument } from './records.js'
export { recalculateReadiness } from './readiness.js'
