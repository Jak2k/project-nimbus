<script setup lang="ts">
import { socket, state } from '../socket'

defineOptions({
  name: 'IndexPage',
})

const word = ref('')
const pin = ref('')
const name = ref('')

const { t } = useI18n()

async function submitPin() {
  socket.auth = { pin: pin.value, name: name.value }
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
    <h1 text-3xl>{{ t('Welcome') }}</h1>
    <h2 text-2xl>{{ t('Users') }}</h2>
    <ul>
      <li
        v-for="item in state.users"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
    <p>{{ state.connected ? t("connected") : t("disconnected") }}</p>
    <ul>
      <li
        v-for="item in state.words"
        :key="item"
      >
        {{ item }} <button bg-red btn v-if="state.isAdmin" @click="socket.emitWithAck('removeWord', item)">
          {{ t('Remove') }}
        </button>
      </li>
    </ul>
    <input
      v-model="word"
      type="text"
      inp
    >
    <button
      @click="addWord()"
      bg-green
      btn
    >
      {{ t('Add word') }}
    </button>
  </div>
  <div v-else>
    <h1 text-3xl>{{ t('Welcome') }}</h1>
    <input
      v-model="pin"
      type="password"
      inp
    >
    <input
      v-model="name"
      type="text"
      inp
    >
    <button
      @click="submitPin()"
      btn
      bg-green
    >
      {{ t('Connect') }}
    </button>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
