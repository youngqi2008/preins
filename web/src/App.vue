<template>
  <router-view />
  <div class="toast-stack">
    <div v-for="item in toast.items" :key="item.id" class="toast" :class="item.type">
      {{ item.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/user';

const toast = useToastStore();
</script>
