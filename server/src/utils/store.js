// Deprecated in-memory store replaced by Mongo implementation
export const db = { users: [], recipes: [] }
export function newId(){ return '0' }
export function createUser(){ throw new Error('Not used') }
export function verifyUser(){ throw new Error('Not used') }
export function toClientRecipe(){ throw new Error('Not used') }
export function recomputeAvg(){ throw new Error('Not used') }
