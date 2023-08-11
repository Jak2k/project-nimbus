<script setup lang="ts">

const {downloadLink}=defineProps<{
  connected: boolean
  downloadLink: string
}>()

const { t } = useI18n()

function download() {
  // download downloadLink+`/download`
  fetch(downloadLink+`/download`)
    .then(res => res.blob())
    .then(res => {
      const aElement = document.createElement('a');
      aElement.setAttribute('download', "Nimbus-Export.txt");
      const href = URL.createObjectURL(res);
      aElement.href = href;
      // aElement.setAttribute('href', href);
      aElement.setAttribute('target', '_blank');
      aElement.click();
      URL.revokeObjectURL(href);
    });
}
</script>

<template>
  <div m-3 p-3 rounded-full bg-gray-100 dark:bg-gray-900 flex flex-row flex-justify-between flex-items-baseline>
    <span v-if="connected">{{ t('connected') }}</span>
    <span v-else>{{ t('disconnected') }}</span>
    <h1 text-xl>Project Nimbus</h1>
    <button btn bg-green @click="download">Download</button>
  </div>
</template>
