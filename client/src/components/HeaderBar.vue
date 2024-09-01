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
  <nav m-3 p-3 rounded-full bg-gray-100 dark:bg-gray-900 flex flex-row flex-justify-between flex-items-baseline>
    <div>
      <span v-if="connected" text-green i-carbon-plug inline-block :aria-label="t('connected')"></span>
      <span v-else text-red i-carbon-close inline-block :aria-label="t('disconnected')"></span>

      <select btn dark:text-white v-model="locale" @change="loadLanguageAsync(locale)" id="locale" w-5em :aria-label="t('language')">
        <option v-for="locale in availableLocales" :key="locale" :value="locale" w-5em>
          {{ locale }}
        </option>
      </select>
    </div>

    <span flex flex-row flex-items-baseline        >
      <button v-if="isAdmin" btn bg-red @click="activateModule('waiting')">
        {{ t("deactivateModule") }}
      </button>
      <h1 text-xl>Nimbus <span bg-orange p-1 rounded-1 text-black>Beta</span> </h1>
    </span>
    <span>
      <span m-1>{{ users.length }} <div i-carbon-user inline-block :aria-label="t('Users')"></div></span>
      <span m-1 p-1 font-900 text-xl font-mono :aria-label="t('PIN') + ' ' + serverPin">{{ serverPin }}</span>
      <button btn bg-green aspect-ratio-square p-2
        @click="download" :aria-label="t('download')"><span i-carbon-download inline-block></span></button>
    </span>
  </nav>
</template>
