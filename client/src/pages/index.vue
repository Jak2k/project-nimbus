<script setup lang="ts">
import { socket, state, URL, addWord, removeWord, activateModule } from "../socket";

defineOptions({
  name: "IndexPage",
});

const pin = ref("");
const name = useLocalStorage("name", "");
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
  <div v-if="state.started" flex flex-col flex-items-center m-1 p-1>
    <HeaderBar :connected="state.connected" :downloadLink="URL" :serverPin="serverPin" :isAdmin="state.isAdmin"
      :users="state.users" w-full />
    <h1 text-3xl>{{ t("Welcome") }}</h1>
    <div flex flex-col landscape:flex-row w-full flex-items-start flex-justify-center v-if="state.module === 'waiting'">
      <div flex flex-col w-full flex-items-center h-full>
        <h2 text-2xl>{{ t("Users") }}</h2>
        <UserGrid :users="state.users" />
      </div>

      <div flex-col w-full flex flex-items-center h-full>
        <h2 text-2xl>
          {{
            state.isAdmin
            ? t("module.waiting.adminMessage")
            : t("module.waiting.message")
          }}
        </h2>
        <button v-if="state.isAdmin" @click="activateModule('wordcloud')" btn>
          <img src="../assets/Wordcloud_Image.optimized.svg" h-100px w-100px alt="Wordcloud">
          {{ t("module.wordcloud.name") }}
        </button>
        <QrCode :url="URL" />
      </div>
    </div>

    <WordCloudModule v-if="state.module === 'wordcloud'" :words="state.moduleData.words || []" :isAdmin="state.isAdmin"
      :addWord="addWord" :removeWord="removeWord" />
  </div>



  <div v-else flex flex-col flex-items-center flex-align-center m-t-10>
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
