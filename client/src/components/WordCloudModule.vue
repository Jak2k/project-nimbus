<script setup lang="ts">
defineProps<{
  words: string[];
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
      <li v-for="item in words" :key="item">
        {{ item }}
        <button bg-red btn v-if="isAdmin" @click="removeWord(item)">
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
