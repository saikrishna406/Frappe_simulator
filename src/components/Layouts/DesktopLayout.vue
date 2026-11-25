<template>
  <div class="flex h-screen w-screen flex-col">
    <SimulatorBanner v-if="simulator" />
    <div class="flex min-h-0 flex-1">
      <AppSidebar />
      <div class="flex-1 flex flex-col h-full overflow-auto bg-surface-base">
        <AppHeader />
        <slot />
      </div>
      <GlobalModals />
    </div>
  </div>
</template>
<script setup>
import AppSidebar from '@/components/Layouts/AppSidebar.vue'
import AppHeader from '@/components/Layouts/AppHeader.vue'
import GlobalModals from '@/components/Modals/GlobalModals.vue'
import SimulatorBanner from '@/components/Simulator/SimulatorBanner.vue'
import { availabilityStore } from '@/stores/availability'
import { isSimulatorMode } from '@/simulator/mode'

const simulator = isSimulatorMode()

// listen for status changes from the start, not only once a picker opens
availabilityStore()
</script>
