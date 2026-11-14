import { openDB } from 'idb'
import { isAppState } from '../domain/guard'
import type { AppState } from '../../shared/types'

async function database() {
  return openDB('vitalink', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    },
  })
}

export async function loadState(): Promise<AppState | null> {
  const db = await database()
  const value: unknown = await db.get('kv', 'state')
  return isAppState(value) ? value : null
}

export async function saveState(state: AppState): Promise<void> {
  const db = await database()
  await db.put('kv', { ...state, notice: null }, 'state')
}
