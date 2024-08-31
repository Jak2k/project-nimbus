<script setup lang="ts">
import LoginModule from "~/components/LoginModule.vue";
import {
  socket,
  state,
  URL,
  activateModule,
  secret,
  restart,
} from "../socket";

defineOptions({
  name: "IndexPage",
});

const serverPin = ref("");

async function submitPin(pin: String, name: String) {
  socket.auth = { pin: pin, name: name, secret: secret };
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
  <div v-if="state.started" flex flex-col flex-items-center p-1>
    <HeaderBar
      :connected="state.connected"
      :downloadLink="URL"
      :serverPin="serverPin"
      :isAdmin="state.isAdmin"
      :users="state.users"
      w-full
    />
    
    <WaitingModule
      v-if="state.module === 'waiting'"
      :users="state.users"
      :isAdmin="state.isAdmin"
      :activateModule="activateModule"
      :URL="URL"
      :quit="restart"
    />
    

    <WordCloudModule
      v-if="state.module === 'wordcloud'"
      :isAdmin="state.isAdmin"
      :socket="socket"
    />
  </div>

  <LoginModule v-else :submitPin />

  <footer text-center p-xl>
    <p>
      Made as an <a href="https://github.com/jak2k/project-nimbus" target="_blank" underline text-blue>open-source project</a> by <a href="https://jak2k.schwanenberg.name" target="_blank" underline text-blue>Jak2k</a>.
    </p>
  </footer>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
