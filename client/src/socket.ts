import { io } from 'socket.io-client'

export const state = reactive<{
  pin: string
  started: boolean
  connected: boolean
  isAdmin: boolean
  users: string[]

  module: string
  moduleData: any
}>({
  pin: '',
  started: false,
  connected: false,
  isAdmin: false,
  users: [],

  module: 'waiting',
  moduleData: {},
})

const window = globalThis?.window || {}

export const URL = import.meta.env.DEV ? 'http://localhost:3000' : `${window?.location?.protocol || 'https'}//${window?.location?.host || ''}`

export const socket = io(URL, {
  autoConnect: false,
})

socket.on('connect', () => {
  state.connected = true
})

socket.on('disconnect', () => {
  state.connected = false
})

socket.on('updateWords', (words: string[]) => {
  state.moduleData.words = words
})

socket.on('updateUsers', (users: string[]) => {
  state.users = users
})

socket.on('updateModule', (module: string) => {
  state.module = module
})

export function addWord(word: string, onSuccess: () => void) {
  if (state.module !== 'wordcloud')
    return

  socket.emit('addWord', word)

  socket.on('actionSuccess', () => {
    onSuccess()
    socket.off('actionSuccess')
  })
}

export function removeWord(word: string) {
  if (state.module !== 'wordcloud' || !state.isAdmin)
    return

  socket.emit('removeWord', word)
}

export function activateModule(module: string) {
  socket.emit('activateModule', module)
}
