<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { Highlighter } from 'view-transition-highlight'

const props = defineProps<{
  fieldKey: string | null
  containerRef: HTMLElement | null
}>()

const highlighter = new Highlighter()

const updateTarget = () => {
  if (!props.fieldKey || !props.containerRef) {
    return
  }

  const selector = `[data-field-key$="${props.fieldKey}"]`
  const target = props.containerRef.querySelector(selector) as HTMLElement
  
  if (target) {
    highlighter.setTarget(target)
  }
}

watch(() => [props.fieldKey, props.containerRef], updateTarget, { flush: 'post' })

// Also watch for DOM mutations in case the element appears later or moves
let observer: MutationObserver | null = null

onMounted(() => {
  if (props.containerRef) {
    observer = new MutationObserver(updateTarget)
    observer.observe(props.containerRef, { childList: true, subtree: true })
  }
  updateTarget()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style>
/* Global styles for the highlighter */
.highlight {
  position: absolute;
  inset: -8px;
  width: auto;
  height: auto;
  box-sizing: border-box;
  background-color: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.6);
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
  view-transition-name: highlighter;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

::view-transition-group(highlighter) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Ensure the target element is positioned so the highlight fills it correctly */
[data-field-key] {
  position: relative;
}
</style>
