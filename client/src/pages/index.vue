<script setup lang="ts">
import { socket, state } from '../socket'

defineOptions({
  name: 'IndexPage',
})

const word = ref('')
const pin = ref('')

const { t } = useI18n()

async function submitPin() {
  socket.auth = { pin: pin.value }
  socket.connect()
  const resp = await socket.emitWithAck('join')
  if (resp === 'user') {
    state.started = true
  }
  else if (resp === 'admin') {
    state.started = true
    state.isAdmin = true
  }
  else { state.started = false }
}

function connect() {
  socket.connect()
}

function disconnect() {
  socket.disconnect()
}

async function addWord() {
  const resp = await socket.emitWithAck('addWord', word.value)
  if (resp === 'ok')
    word.value = ''
}
</script>

<template>
  <div v-if="state.started">
    <h1>{{ t('Welcome') }}</h1>
    <p>{{ state.connected ? t("connected") : t("disconnected") }}</p>
    <ul>
      <li
        v-for="item in state.words"
        :key="item"
      >
        {{ item }} <button bg-red text-white v-if="state.isAdmin" @click="socket.emit('removeWord', item)">
          {{ t('Remove') }}
        </button>
      </li>
    </ul>
    <button
      @click="connect()"
    >
      {{ t('Connect') }}
    </button>
    <button
      @click="disconnect()"
    >
      {{ t('Disconnect') }}
    </button>
    <input
      v-model="word"
      type="text"
    >
    <button
      @click="addWord()"
    >
      {{ t('Add word') }}
    </button>
  </div>
  <div v-else>
    <h1>{{ t('Welcome') }}</h1>
    <input
      v-model="pin"
      type="text"
    >
    <button
      @click="submitPin()"
    >
      {{ t('Submit Pin') }}
    </button>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
