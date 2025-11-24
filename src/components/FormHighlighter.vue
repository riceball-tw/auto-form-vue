<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useElementBounding, useMutationObserver } from '@vueuse/core'

const props = defineProps<{
  fieldKey: string | null
  containerRef: HTMLElement | null
}>()

const targetElement = ref<HTMLElement | null>(null)

// Find the target element based on the field key
const findTarget = () => {
  if (!props.fieldKey || !props.containerRef) {
    targetElement.value = null
    return
  }
  // Use ends-with selector to match nested keys if necessary, or exact match
  // The original logic used ends-with `[data-field-key$="${selectedField.value.key}"]`
  // We'll stick to that for compatibility with nested fields
  const selector = `[data-field-key$="${props.fieldKey}"]`
  targetElement.value = props.containerRef.querySelector(selector) as HTMLElement
}

// Watch for prop changes
watch(() => [props.fieldKey, props.containerRef], findTarget, { immediate: true })

// Watch for DOM changes in the container to re-find target (e.g. if field moved steps)
useMutationObserver(
  () => props.containerRef,
  () => {
    findTarget()
  },
  { childList: true, subtree: true }
)

// Get bounding boxes
const targetRect = useElementBounding(targetElement)
const containerRect = useElementBounding(() => props.containerRef)

// Compute highlight style
const highlightStyle = computed(() => {
  if (!targetElement.value || !props.containerRef) return null

  // If target is hidden or not in DOM (width/height 0), don't show
  if (targetRect.width.value === 0 || targetRect.height.value === 0) return null

  const top = targetRect.top.value - containerRect.top.value
  const left = targetRect.left.value - containerRect.left.value

  return {
    top: `${top - 8}px`,
    left: `${left - 8}px`,
    width: `${targetRect.width.value + 16}px`,
    height: `${targetRect.height.value + 16}px`,
  }
})
</script>

<template>
  <div
    v-if="highlightStyle"
    class="absolute bg-muted border-muted-foreground border-dotted border-2 rounded-md transition-all duration-300 ease-out pointer-events-none"
    :style="highlightStyle"
  ></div>
</template>
