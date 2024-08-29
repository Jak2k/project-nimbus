<script setup lang="ts">
import {
  socket,
  state,
  URL,
  addWord,
  removeWord,
  activateModule,
} from "../socket";

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
    <HeaderBar
      :connected="state.connected"
      :downloadLink="URL"
      :serverPin="serverPin"
      :isAdmin="state.isAdmin"
      :users="state.users"
      w-full
    />
    <h1 text-3xl>{{ t("Welcome") }}</h1>
    <div
      flex
      flex-col
      landscape:flex-row
      w-full
      flex-items-start
      flex-justify-center
      v-if="state.module === 'waiting'"
    >
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
        <button v-if="state.isAdmin" @click="activateModule('wordcloud')" btn dark:text-white>
          <img
            src="../assets/Wordcloud_Image.optimized.svg"
            h-100px
            w-100px
            alt="Wordcloud"
          />
          {{ t("module.wordcloud.name") }}
        </button>
        <QrCode :url="URL" />
      </div>
    </div>

    <WordCloudModule
      v-if="state.module === 'wordcloud'"
      :words="state.moduleData.words || []"
      :isAdmin="state.isAdmin"
      :addWord="addWord"
      :removeWord="removeWord"
    />
  </div>

  <form v-else flex flex-col flex-items-center flex-align-center m-t-10 @submit="e => {e.preventDefault();submitPin()}">
    <h1 text-3xl>{{ t("Welcome") }}</h1>
    <label for="nameInp">{{ t("login.name") }}</label>
    <input v-model="name" type="text" inp id="nameInp" />
    
    <label for="pinInp">{{ t("login.pin") }}</label>
    <input v-model="pin" type="text" inp id="pinInp" />
    <button @click="submitPin()" btn bg-green>
      {{ t("Connect") }}
    </button>
  </form>

  <footer text-center p-5 m-xl>
    <p>
      Made with ❤️ as an <a href="https://github.com/jak2k/project-nimbus" target="_blank" underline text-blue>open-source project</a> by <a href="https://jak2k.schwanenberg.name" target="_blank" underline text-blue>Jak2k</a>.
    </P>
  </footer>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
