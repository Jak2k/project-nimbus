<script setup lang="ts">
import { type Socket } from "socket.io-client";

const { socket, isAdmin, user } = defineProps<{
  isAdmin: boolean;
  socket: Socket;
  user: String;
}>();

function doneAlone() {
  socket.emit("partnermatcher.doneAlone");
}

function doneTogether() {
  socket.emit("partnermatcher.donePartnered");
}

function undo() {
  socket.emit("partnermatcher.undo");
}

const users = ref<{
  name: string;
  status: "alone" | "waiting" | "partnered" | "done";
  partner?: string;
}[]>([]);

socket.on("partnermatcher.updateUsers", (userData: any) => {
  users.value = userData;
});

const thisUser = computed(() => users.value.find((u) => u.name === user));

const { t } = useI18n();
</script>

<template>
    <h2 text-2xl>{{ t("module.partnermatcher.name") }}</h2>
    <div v-if="isAdmin">
      <h2>{{ t(`module.partnermatcher.users`) }}</h2>
      <ul>
        <li v-for="user in users" :key="user.name" list-disc>
          {{ user.name }}: {{ t(`module.partnermatcher.${user.status}`) }}
          <span v-if="user.partner">({{ user.partner }})</span>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>{{ t(`module.partnermatcher.${thisUser?.status}`) }}</p>
      <button v-if="thisUser?.status === 'partnered' || thisUser?.status === 'waiting'" @click="undo" btn bg-red>{{ t('module.partnermatcher.undo') }}</button>
      <p v-if="thisUser?.partner">{{ t('module.partnermatcher.partner') }}: {{ thisUser.partner }}</p>
      <button @click="doneAlone" v-if="thisUser?.status === 'alone'" btn bg-red>{{ t('module.partnermatcher.done') }}</button>
      <button @click="doneTogether" v-if="thisUser?.status === 'partnered'" btn bg-green>{{ t('module.partnermatcher.done') }}</button>
    </div>
</template>

<style>
html {
  --cloud-font: hsl(221, 39%, 0%);
  --cloud-font2: hsl(221, 39%, 25%);
  --cloud-font3: hsl(221, 39%, 50%);
}

html.dark {
  --cloud-font: hsl(221, 39%, 100%);
  --cloud-font2: hsl(221, 39%, 75%);
  --cloud-font3: hsl(221, 100%, 73%);
}
</style>