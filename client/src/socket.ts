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

export const socket = io('http://192.168.178.24:3000/', {
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
