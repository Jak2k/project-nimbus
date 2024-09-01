<script setup lang="ts">
// @ts-ignore
import Vue3WordCloud from "vue3-word-cloud";
import { type Socket } from "socket.io-client";

const { socket, isAdmin } = defineProps<{
  isAdmin: boolean;
  socket: Socket;
}>();

function addWord(word: string, onSuccess: () => void) {
  socket.emit("categorizer.addWord", word);

  socket.on("actionSuccess", () => {
    onSuccess();
    socket.off("actionSuccess");
  });
}

function activateWord(word: string) {
  socket.emit("categorizer.activateWord", word);
}

type Word = {
  word: string;
  categories: {
    category: string;
    users: string[];
    removed: boolean;
  }[];
};

const word = ref("");
const words = ref<Word[]>([]);
const activeWord = ref<Word | null>(null);

socket.on("categorizer.updateWords", (newWords: Word[]) => {
  words.value = newWords;
});

socket.on("categorizer.updateActiveWord", (word: Word) => {
  activeWord.value = word;
});

const { t } = useI18n();
</script>

<template>
  <div>
    <div v-if="isAdmin">
      <h2 text-2xl>{{ t("module.categorizer.addWord") }}</h2>
      <form flex flex-row @submit="e => {e.preventDefault(); addWord(word, () => word = '')}">
        <input v-model="word" type="text" :aria-label="t('module.categorizer.addWord')" inp />
        <button @click="addWord(word, () => word = '')" bg-green btn>
          {{ t("module.categorizer.addWord") }}
        </button>
      </form>

      <h2 text-2xl>{{ t("module.categorizer.words") }}</h2>
      <ul>
        <li v-for="item in words" :key="item.word">
          <span>{{ item.word || "" }}</span> <button @click="activateWord(item.word || '')" bg-green btn>{{ t("module.categorizer.activate") }}</button>
          <ul>
            <li v-for="category in item.categories" :key="category.category">
              <span>{{ category.category }}</span>
              <ul>
                <li v-for="user in category.users" :key="user">{{ user }}</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>


    <div v-if="activeWord">
      <h2 text-2xl>{{ t("module.categorizer.activeWord") }}</h2>
      <span>{{ activeWord.word }}</span>
      <ul>
        <li v-for="category in activeWord.categories" :key="category.category">
          <span>{{ category.category }}</span>
          <ul>
            <li v-for="user in category.users" :key="user">{{ user }}</li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>
