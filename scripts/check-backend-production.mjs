/* global process, console, fetch */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, dirname, basename } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const backend = resolve(import.meta.dirname, '../../NASA_SPACE_APP-BACKEND')
async function main() {
  const pkg = JSON.parse(readFileSync(join(backend, 'package.json'), 'utf8'))
  if (pkg.scripts.start !== 'node dist/main.js' || pkg.scripts['start:prod'] !== 'node dist/main.js') throw new Error('Unexpected production startup script')
  const socket = createServer()
  socket.listen(0, '127.0.0.1')
  await once(socket, 'listening')
  const { port } = socket.address()
  socket.close()
  await once(socket, 'close')
  const directory = mkdtempSync(join(tmpdir(), 'helios-production-check-'))
  const started = Date.now()
  const child = spawn(process.execPath, ['--max-old-space-size=256', 'dist/main.js'], {
    cwd: backend, windowsHide: true, stdio: 'ignore',
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', SIMULATION_DATA_DIR: directory, NODE_ENV: 'production' },
  })
  const stopped = once(child, 'exit')
  try {
    let ready = false
    while (Date.now() - started < 25000) {
      if (child.exitCode !== null) throw new Error(`Production process exited with code ${child.exitCode}`)
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/ai/health`)
        if (response.ok) { ready = true; break }
      } catch { /* Wait for the compiled app to bind its port. */ }
      await delay(200)
    }
    if (!ready) throw new Error('Production process did not open its port')
    const response = await fetch(`http://127.0.0.1:${port}/api/platform/profiles`)
    const body = await response.json()
    if (!response.ok || !Array.isArray(body.profiles) || body.profiles.length !== 5) throw new Error('Roles endpoint did not return the five demo profiles')
    console.log(JSON.stringify({ productionStart: true, heapLimitMB: 256, startupMs: Date.now() - started, aiHealth: 200, rolesStatus: response.status, profiles: body.profiles.length }))
  } finally {
    if (child.exitCode === null) child.kill()
    await stopped
    if (dirname(directory) === tmpdir() && basename(directory).startsWith('helios-production-check-')) rmSync(directory, { recursive: true, force: true })
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
