<script setup lang="ts">
defineProps<{
  submitPin: (pin: String, name: String) => void;
}>();

const pin = ref("");
const name = useLocalStorage("name", "");

const { t } = useI18n();
</script>

<template>
  <form flex flex-col flex-items-center flex-align-center m-t-10 @submit="e => {e.preventDefault();submitPin(pin, name)}">
    <h1 text-3xl>{{ t("Welcome") }}</h1>
    <label for="nameInp">{{ t("login.name") }}</label>
    <input v-model="name" type="text" inp id="nameInp" />
    
    <label for="pinInp">{{ t("login.pin") }}</label>
    <input v-model="pin" type="text" inp id="pinInp" />
    <button @click="submitPin(pin, name)" btn bg-green>
      {{ t("Connect") }}
    </button>
  </form>
</template>