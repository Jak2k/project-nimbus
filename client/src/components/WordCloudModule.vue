<script setup lang="ts">
defineProps<{
  words: { word: string, count: number }[];
  isAdmin: boolean;
  addWord: (word: string) => void;
  removeWord: (word: string) => void;
}>();

const word = ref("");

const { t } = useI18n();
</script>

<template>
  <div>
    <h2 text-2xl>Words</h2>
    <ul>
      <li v-for="item in words" :key="item.word">
        {{ item.word || "" }} ({{ item.count || 0 }})
        <button bg-red btn v-if="isAdmin" @click="removeWord(item.word || '')">
          {{ t("Remove") }}
        </button>
      </li>
    </ul>
    <input v-model="word" type="text" inp />
    <button @click="addWord(word)" bg-green btn>
      {{ t("Add word") }}
    </button>
  </div>
</template>
