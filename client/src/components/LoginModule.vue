<script setup lang="ts">
const { submitPin } = defineProps<{
  submitPin: (pin: String, name: String) => void;
}>();

const pin = ref("");
const lastPin = localStorage.getItem("lastPin") || "";
const name = useLocalStorage("name", "");

const { t } = useI18n();

// when the url has a query param pwd, set the pin to that value, remove the query param without reloading the page and submit the form
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const pwd = urlParams.get("pwd");
  if (pwd) {
    pin.value = pwd;
    urlParams.delete("pwd");
    window.history.replaceState({}, document.title, window.location.pathname);
    submit();
  }
});

function submit() {
  localStorage.setItem("lastPin", pin.value);
  submitPin(pin.value, name.value);
}

function reconnect() {
  pin.value = lastPin;
  submit();
}
</script>

<template>
  <form flex flex-col flex-items-center flex-align-center p-t-10 @submit="e => {e.preventDefault();submit()}">
    <h1 text-3xl m-b-10>{{ t("Welcome") }}</h1>
    <label for="nameInp">{{ t("login.name") }}</label>
    <input v-model="name" type="text" inp id="nameInp" m-b-xl />
    
    <label for="pinInp">{{ t("login.pin") }}</label>
    <input v-model="pin" type="password" inp id="pinInp" m-b-xl />
    <button @click="submit" btn bg-green m-b-xl>
      {{ t("Connect") }}
    </button>
    <button v-if="lastPin !== ''" @click="reconnect" btn bg-blue m-b-xl>
      {{ t("login.reconnect") }}
    </button>

    <p p-x-5 max-w-xl>{{ t('login.nameReuse') }}</p>
  </form>
</template>