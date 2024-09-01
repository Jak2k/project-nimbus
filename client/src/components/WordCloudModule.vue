<script setup lang="ts">
// @ts-ignore
import Vue3WordCloud from "vue3-word-cloud";
import { type Socket } from "socket.io-client";

const { socket, isAdmin } = defineProps<{
  isAdmin: boolean;
  socket: Socket;
}>();

function addWord(word: string, onSuccess: () => void) {
  socket.emit("wordcloud.addWord", word);

  socket.on("actionSuccess", () => {
    onSuccess();
    socket.off("actionSuccess");
  });
}

function removeWord(word: string) {
  if (!isAdmin) return;

  socket.emit("wordcloud.removeWord", word);
}

function continueInCategorizer() {
  socket.emit("activateModule", "categorizer");

  setTimeout(() => {
    words.value.forEach((word) => {
      socket.emit("categorizer.addWord", word.word);
    });
  }, 100);
}

const word = ref("");

const words = ref<{ word: string; count: number }[]>([]);

socket.on("wordcloud.updateWords", (newWords: {word: string, count: number}[]) => {
  words.value = newWords;
});

const { width, height } = useWindowSize();

const { t } = useI18n();
</script>

<template>
  <div>
    <h2 text-2xl>{{ t("module.wordcloud.words") }}</h2>
    <p>{{ isAdmin ? t('module.wordcloud.clickToRemove') : t('module.wordcloud.clickToSubmit') }}</p>
    <div v-if="isAdmin">
      <span v-for="item in words" :key="item.word" @click="removeWord(item.word || '')">
        {{ item.word || "" }} ({{ item.count || 0 }})
      </span>

      <button @click="continueInCategorizer" bg-red btn>
        {{ t("module.wordcloud.continueInCategorizer") }}
      </button>
    </div>
    <form flex flex-row @submit="e => {e.preventDefault(); addWord(word, () => word = '')}">
      <input v-model="word" type="text" :aria-label="t('module.wordcloud.addWord')" inp />
      <button @click="addWord(word, () => word = '')" bg-green btn>
        {{ t("module.wordcloud.addWord") }}
      </button>
    </form>
    <Vue3WordCloud :style="`height: ${height * 2 / 3}px; width: ${width * 9 / 10}px; overflow: hidden;`"
      :words="words.map(w => [w.word, w.count])"
      :color="([, weight]: [string, number]) => weight > 2 ? 'var(--cloud-font)' : weight > 1 ? 'var(--cloud-font2)' : 'var(--cloud-font3)'"
      fontFamily="Roboto">
      <template v-slot="wrd">
        <div :title="wrd.weight" :style="`z-index: -2;font: ${wrd.font}; font-family: 'DM Sans' ,
          ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI' , Roboto, 'Helvetica Neue' ,
          Arial, 'Noto Sans' , sans-serif, 'Apple Color Emoji' , 'Segoe UI Emoji' , 'Segoe UI Symbol'
          , 'Noto Color Emoji'`" @click="addWord(wrd.text, () => { })">
          {{ wrd.text }}
        </div>
      </template>
    </Vue3WordCloud>
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