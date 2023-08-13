<script setup lang="ts">
defineProps<{
  users: string[];
}>()
</script>

<template>
  <div>
    <ul flex flex-row flex-wrap gap-1 m-5>
      <li v-for="item in users" :key="item" :class="users.length <= 10 ? `w-30 h-30` : `w-15 h-15 text-3`" bg-green
        rounded-full flex flex-align-center flex-items-center>
        <span w-full text-center text-black>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>