import { io } from 'socket.io-client'

export const state = reactive<{
  pin: string
  started: boolean
  connected: boolean
  words: string[]
  isAdmin: boolean
}>({
  pin: '',
  started: false,
  connected: false,
  isAdmin: false,
  words: [],
})

const URL = import.meta.env.DEV ? 'http://localhost:3000' : import.meta.env.BASE_URL as string

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
  state.words = words
})
