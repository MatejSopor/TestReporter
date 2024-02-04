<script setup lang="ts">
const { props } = defineProps<{
  props: {
    icon: string;
    currentFilter: string;
    event: string;
    filtersOptions?: string[];
    color: string;
  }
}>()

</script>
<template>
  <div class="btn-group  me-3">
    <button type="button" :class="`btn btn-${props.color} dropdown-toggle waves-effect waves-light`"
      data-bs-toggle="dropdown" aria-expanded="false">
      <i :class="`ti ${props.icon} me-sm-1`"></i>
      {{ props.currentFilter }}
    </button>
    <ul class="dropdown-menu">
      <li v-for="(filter, index) in props.filtersOptions" :key="index">
        <span class="dropdown-item" @click="$emit(props.event, filter)">{{ filter }}</span>
      </li>
    </ul>
  </div>
</template>
<style>
.dropdown-button-collection {
  position: absolute;
}
</style>
