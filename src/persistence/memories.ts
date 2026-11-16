import { openDB } from 'idb'
import type { UserMemory } from '../platform/api'

async function database() {
  return openDB('vitalink-memories', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('memories')) {
        db.createObjectStore('memories')
      }
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images')
      }
    },
  })
}

export async function readLocalMemories(profileId: string): Promise<UserMemory[]> {
  try {
    const db = await database()
    const value: unknown = await db.get('memories', profileId)
    if (Array.isArray(value)) return value as UserMemory[]
    return []
  } catch {
    return []
  }
}

export async function writeLocalMemories(profileId: string, memories: UserMemory[]): Promise<void> {
  try {
    const db = await database()
    await db.put('memories', memories, profileId)
  } catch {
    /* ignore offline write error */
  }
}

export async function clearLocalMemories(profileId: string): Promise<void> {
  try {
    const db = await database()
    await db.delete('memories', profileId)
  } catch {
    /* ignore */
  }
}

export async function readLocalMemoryImage(memoryId: string): Promise<string | null> {
  try {
    const db = await database()
    const val = await db.get('images', memoryId)
    return typeof val === 'string' ? val : null
  } catch {
    return null
  }
}

export async function writeLocalMemoryImage(memoryId: string, dataUrl: string): Promise<void> {
  try {
    const db = await database()
    await db.put('images', dataUrl, memoryId)
  } catch {
    /* ignore */
  }
}

export async function deleteLocalMemoryImage(memoryId: string): Promise<void> {
  try {
    const db = await database()
    await db.delete('images', memoryId)
  } catch {
    /* ignore */
  }
}
