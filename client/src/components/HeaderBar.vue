<script setup lang="ts">
import { activateModule } from "~/socket";
import { availableLocales, loadLanguageAsync } from "~/modules/i18n";

const { downloadLink } = defineProps<{
  connected: boolean;
  downloadLink: string;
  serverPin: string;
  isAdmin: boolean;
  users: string[];
}>();

const { t } = useI18n();

const locale = useLocalStorage("locale", "en");

function download() {
  // download downloadLink+`/download`
  fetch(downloadLink + `/download`)
    .then((res) => res.blob())
    .then((res) => {
      const aElement = document.createElement("a");
      aElement.setAttribute("download", "Nimbus-Export.txt");
      const href = URL.createObjectURL(res);
      aElement.href = href;
      // aElement.setAttribute('href', href);
      aElement.setAttribute("target", "_blank");
      aElement.click();
      URL.revokeObjectURL(href);
    });
}
</script>

<template>
  <div m-3 p-3 rounded-full bg-gray-100 dark:bg-gray-900 flex flex-row flex-justify-between flex-items-baseline>
    <span><span v-if="connected" text-green>
        <div i-carbon-plug inline-block></div>
        {{ t("connected") }}
      </span>
      <span v-else text-red>
        <div i-carbon-close inline-block />
        {{ t("disconnected") }}
      </span>
      <label for="locale" sr-only>{{ t("language") }}</label>
      <select btn dark:text-white v-model="locale" @change="loadLanguageAsync(locale)" id="locale" w-5em>
        <option v-for="locale in availableLocales" :key="locale" :value="locale" w-5em>
          {{ locale }}
        </option>
      </select>
    </span>

    <span flex flex-row flex-items-baseline        >
      <button v-if="isAdmin" btn bg-red @click="activateModule('waiting')">
        {{ t("deactivateModule") }}
      </button>
      <h1 text-xl>Project Nimbus</h1>
    </span>
    <span>
      <span m-1>{{ users.length }} {{ t('users') }}</span>
      <span m-1 p-1 font-900 text-xl font-mono>{{ t("PIN") }}: {{ serverPin }}</span>
      <button btn bg-green
        @click="download">{{ t('download') }}</button>
    </span>
  </div>
</template>
