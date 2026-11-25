<template>
  <Dialog v-model:open="show" :size="'sm'" bare>
    <template #default>
      <div class="p-4 pt-5">
        <div class="flex justify-center">
          <div class="flex flex-col items-center">
            <BrandLogo v-model="brand" class="mb-3 size-12" />
            <Dialog.Title as-child>
              <h3 class="text-2xl-semibold text-ink-gray-9">
                {{ __(brand.name || 'creat8rlabs') }}
              </h3>
            </Dialog.Title>
          </div>
        </div>
        <hr class="border-t my-3 mx-2" />
        <p class="text-sm text-ink-gray-6 px-2 mt-2 text-center">
          creat8rlabs Business Platform · Built on Frappe Framework &amp; ERPNext (AGPLv3 / GPLv3 / MIT)
        </p>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
import { getSettings } from '@/stores/settings'
import { Dialog } from 'frappe-ui'

let show = defineModel({ type: Boolean })
const { brand } = getSettings()
</script>
