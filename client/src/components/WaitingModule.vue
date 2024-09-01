<script setup lang="ts">
defineProps<{
  users: string[];
  isAdmin: boolean;
  activateModule: (module: string) => void;
  URL: string;
  quit: () => void;
}>();

const { t } = useI18n();
</script>

<template>
    <div  flex
      flex-col
      landscape:flex-row
      w-full
      flex-items-start
      flex-justify-center>
      <div flex flex-col w-full flex-items-center h-full>
            <h2 text-2xl>{{ t("Users") }}</h2>
             <UserGrid :users="users" />
            <button @click="quit" btn bg-red>
              {{ t("module.waiting.quit") }}
            </button>
        </div>

        <div flex-col w-full flex flex-items-center h-full>
            <h2 text-2xl>
              {{
                isAdmin
                  ? t("module.waiting.adminMessage")
                  : t("module.waiting.message")
              }}
            </h2>
            <button v-if="isAdmin" @click="activateModule('wordcloud')" btn dark:text-white>
              <img
                src="../assets/Wordcloud_Image.optimized.svg"
                h-100px
                w-100px
                alt=""
              />
              {{ t("module.wordcloud.name") }}
            </button>
            <QrCode :url="URL" />
        </div>
    </div>
</template>