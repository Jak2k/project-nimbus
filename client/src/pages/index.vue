<script setup lang="ts">
import { socket, state, URL, addWord, removeWord, activateModule } from "../socket";

defineOptions({
  name: "IndexPage",
});

const pin = ref("");
const name = ref("");
const serverPin = ref("");

const { t } = useI18n();

async function submitPin() {
  socket.auth = { pin: pin.value, name: name.value };
  socket.connect();
  const { sessionPin, userType } = await socket.emitWithAck("join");
  if (userType === "user") {
    state.started = true;
  } else if (userType === "admin") {
    state.started = true;
    state.isAdmin = true;
  } else {
    state.started = false;
  }
  serverPin.value = sessionPin;
}
</script>

<template>
  <div v-if="state.started">
    <HeaderBar
      :connected="state.connected"
      :downloadLink="URL"
      :serverPin="serverPin"
    />
    <h1 text-3xl>{{ t("Welcome") }}</h1>
    <h2 text-2xl>{{ t("Users") }}</h2>
    <ul>
      <li v-for="item in state.users" :key="item">
        {{ item }}
      </li>
    </ul>

    <div v-if="state.module === 'waiting'">
      <h2 text-2xl>
        {{
          state.isAdmin
            ? t("module.waiting.adminMessage")
            : t("module.waiting.message")
        }}
      </h2>
      <button
        v-if="state.isAdmin"
        @click="activateModule('wordcloud')"
        bg-green
        btn
      >
        {{ t("module.wordcloud.name") }}
      </button>
    </div>
    <WordCloudModule
      v-if="state.module === 'wordcloud'"
      :words="state.moduleData.words || []"
      :isAdmin="state.isAdmin"
      :addWord="addWord"
      :removeWord="removeWord"
    />
  </div>
  <div v-else>
    <h1 text-3xl>{{ t("Welcome") }}</h1>
    <input v-model="pin" type="password" inp />
    <input v-model="name" type="text" inp />
    <button @click="submitPin()" btn bg-green>
      {{ t("Connect") }}
    </button>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
