import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {} }))
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
}))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
}))

import { signIn } from '@/services/auth/signIn'
import { get } from 'firebase/database'
import { signInWithEmailAndPassword } from 'firebase/auth'

const mockGet = vi.mocked(get)
const mockSignIn = vi.mocked(signInWithEmailAndPassword)

const admins = {
  'admin-1': { userName: 'juan.perez', email: 'juan@example.com' },
}

// `ReturnType<typeof vi.spyOn>` colapsa los genericos a `unknown[]` y no tipa el spy
// de console.error (TS2322). Inferirlo del helper si funciona.
const espiarConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {})

describe('signIn', () => {
  let consoleErrorSpy: ReturnType<typeof espiarConsoleError>

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      configurable: true,
    })
    consoleErrorSpy = espiarConsoleError()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('returns "network-error" when offline, without touching Firebase', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    })

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('network-error')
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('returns "unexpected-error" when the admins node is empty', async () => {
    mockGet.mockResolvedValue({ val: () => null } as any)

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('unexpected-error')
  })

  it('returns "wrong-userName" when no admin matches the given userName', async () => {
    mockGet.mockResolvedValue({ val: () => admins } as any)

    const result = await signIn('nadie', 'secret')

    expect(result).toBe('wrong-userName')
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('returns "all-good" on successful sign-in', async () => {
    mockGet.mockResolvedValue({ val: () => admins } as any)
    mockSignIn.mockResolvedValue({} as any)

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('all-good')
    expect(mockSignIn).toHaveBeenCalledWith({}, 'juan@example.com', 'secret')
  })

  it('returns "wrong-password" for auth/wrong-password', async () => {
    mockGet.mockResolvedValue({ val: () => admins } as any)
    mockSignIn.mockRejectedValue({ code: 'auth/wrong-password' })

    const result = await signIn('juan.perez', 'bad-secret')

    expect(result).toBe('wrong-password')
  })

  it('returns "wrong-password" for auth/invalid-credential', async () => {
    mockGet.mockResolvedValue({ val: () => admins } as any)
    mockSignIn.mockRejectedValue({ code: 'auth/invalid-credential' })

    const result = await signIn('juan.perez', 'bad-secret')

    expect(result).toBe('wrong-password')
  })

  it('returns "network-error" when Firebase Auth fails with auth/network-request-failed', async () => {
    mockGet.mockResolvedValue({ val: () => admins } as any)
    mockSignIn.mockRejectedValue({ code: 'auth/network-request-failed' })

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('network-error')
  })

  it('returns "unexpected-error" and logs it when Firebase Auth fails for a reason other than wrong credentials or network', async () => {
    const authError = { code: 'auth/too-many-requests' }
    mockGet.mockResolvedValue({ val: () => admins } as any)
    mockSignIn.mockRejectedValue(authError)

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('unexpected-error')
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), authError)
  })

  it('returns "permission-denied" when the rules reject the read of admins/', async () => {
    // Forma real del rechazo: repoGetValue hace `new Error(err)` con el payload
    // crudo del servidor, asi que no hay `.code` que mirar, solo el mensaje.
    // (@firebase/database 1.0.8, dist/index.esm2017.js ~L11019 y ~L3273.)
    const dbError = new Error('Permission denied')
    mockGet.mockRejectedValue(dbError)

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('permission-denied')
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), dbError)
  })

  it('returns "permission-denied" when the error does carry a PERMISSION_DENIED code', async () => {
    // El otro camino: errorForServerCode si setea `.code` en mayusculas.
    const dbError = Object.assign(new Error('algo'), { code: 'PERMISSION_DENIED' })
    mockGet.mockRejectedValue(dbError)

    expect(await signIn('juan.perez', 'secret')).toBe('permission-denied')
  })

  it('returns "unexpected-error" and logs it when reading admins/ fails for an unrelated reason', async () => {
    const dbError = new Error('boom')
    mockGet.mockRejectedValue(dbError)

    const result = await signIn('juan.perez', 'secret')

    expect(result).toBe('unexpected-error')
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), dbError)
  })

  it('returns "network-error" when the read of admins/ never answers', async () => {
    // get() NO rechaza estando sin conexion: encola el pedido y lo reenvia al
    // reconectar. Sin el timeout esta promesa queda colgada para siempre y el
    // boton de login gira sin fin. Es el caso de wifi sin internet, donde
    // navigator.onLine da true.
    vi.useFakeTimers()
    try {
      mockGet.mockReturnValue(new Promise(() => {}) as any)

      const promesa = signIn('juan.perez', 'secret')
      await vi.advanceTimersByTimeAsync(10000)

      await expect(promesa).resolves.toBe('network-error')
    } finally {
      vi.useRealTimers()
    }
  })
})
