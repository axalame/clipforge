<template>
  <slot />
</template>

<script setup lang="ts">
import { useNotification, useMessage } from "naive-ui";

(window as any).$notification = useNotification();
(window as any).$message = useMessage();
</script>
