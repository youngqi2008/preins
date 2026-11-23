<template>
  <ResourcePage v-if="config" :config="config" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ResourcePage from '@/components/ResourcePage.vue';
import { findResource } from '@/modules/resources';

const route = useRoute();
const config = computed(() => findResource(String(route.meta.resource || '')));
</script>
