<!-- Origin UI Vue https://www.originui-vue.com/slider -->
<template>
  <div class="*:not-first:mt-3">
    <div class="flex items-center gap-4">
      <Input
        class="h-8 w-16 px-2 py-1 text-center"
        type="text"
        inputmode="decimal"
        :placeholder="placeholders[0]"
        :model-value="inputValues[0]"
        @update:model-value="(newValue) => handleInputChange(0, String(newValue))"
        @blur="() => validateAndUpdateValue(inputValues[0] ?? '', 0)"
        @keydown.enter="validateAndUpdateValue(inputValues[0] ?? '', 0)"/>
      <Slider
        class="grow"
        :model-value="sliderValues"
        @update:model-value="handleSliderChange"
        :min="min"
        :max="max"
        :step="step"
        aria-label="Dual range slider with input"/>
      <Input
        class="h-8 w-16 px-2 py-1 text-center"
        type="text"
        inputmode="decimal"
        :placeholder="placeholders[1]"
        :model-value="inputValues[1]"
        @update:model-value="(newValue) => handleInputChange(1, String(newValue))"
        @blur="() => validateAndUpdateValue(inputValues[1] ?? '', 1)"
        @keydown.enter="validateAndUpdateValue(inputValues[1] ?? '', 1)"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { computed, watch, ref } from "vue";

type RangeTuple = [number, number];

const props = defineProps<{
  modelValue: RangeTuple | undefined;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string | [string, string];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: RangeTuple | undefined): void;
}>();

const min = computed(() => props.min ?? 0);
const max = computed(() => props.max ?? 10);
const step = computed(() => props.step ?? 1);

const placeholders = computed(() => {
  if (Array.isArray(props.placeholder)) {
    return props.placeholder;
  } else if (props.placeholder) {
    return [props.placeholder, props.placeholder];
  } else {
    return ['', ''];
  }
});

const sliderValues = ref<RangeTuple>([min.value, max.value]);
const inputValues = ref<[string, string]>(['-', '-']);

function clamp(value: number): number {
  if (Number.isNaN(value)) return min.value;
  if (value < min.value) return min.value;
  if (value > max.value) return max.value;
  return value;
}

function normalizeTuple(values: RangeTuple): RangeTuple {
  const start = clamp(values[0]);
  const end = clamp(values[1]);
  return start <= end ? [start, end] : [end, start];
}

function syncFromModel(newValue: RangeTuple | undefined) {
  if (newValue === undefined) {
    sliderValues.value = [min.value, max.value];
    inputValues.value = ['-', '-'];
  } else {
    const normalized = normalizeTuple(newValue);
    sliderValues.value = normalized;
    inputValues.value = [String(normalized[0]), String(normalized[1])];
  }
}

watch(
  () => props.modelValue,
  (v) => {
    syncFromModel(v);
  },
  { immediate: true },
);

function emitIfChanged(values: RangeTuple) {
  const normalized = normalizeTuple(values);
  if (
    !props.modelValue ||
    props.modelValue[0] !== normalized[0] ||
    props.modelValue[1] !== normalized[1]
  ) {
    emit("update:modelValue", normalized);
  }
}

function handleSliderChange(values: number[] | undefined) {
  if (!values || values.length !== 2) return;
  const tuple: RangeTuple = [values[0]!, values[1]!];
  sliderValues.value = normalizeTuple(tuple);
  inputValues.value = [String(sliderValues.value[0]), String(sliderValues.value[1])];
  emitIfChanged(sliderValues.value);
}

function handleInputChange(index: 0 | 1, newValue: string) {
  const next = [...inputValues.value] as [string, string];
  next[index] = newValue;
  inputValues.value = next;
}

function validateAndUpdateValue(raw: string | number, index: 0 | 1) {
  const str = String(raw);
  if (str === '' || str === '-') {
    // Check if both are empty
    const otherIndex = index === 0 ? 1 : 0;
    const otherStr = inputValues.value[otherIndex];
    if (otherStr === '' || otherStr === '-') {
      // Both empty, emit undefined
      emit("update:modelValue", undefined);
      inputValues.value = ['-', '-'];
      sliderValues.value = [min.value, max.value];
      return;
    } else {
      // Only this one empty, set to default
      const defaultVal = index === 0 ? min.value : max.value;
      const nextTuple: RangeTuple = [...sliderValues.value] as RangeTuple;
      nextTuple[index] = defaultVal;
      const normalized = normalizeTuple(nextTuple);
      sliderValues.value = normalized;
      inputValues.value = [String(normalized[0]), String(normalized[1])];
      emitIfChanged(normalized);
      return;
    }
  }
  const parsed = Number(str);
  const clamped = clamp(parsed);
  const nextTuple: RangeTuple = [...sliderValues.value] as RangeTuple;
  nextTuple[index] = clamped;
  const normalized = normalizeTuple(nextTuple);
  sliderValues.value = normalized;
  inputValues.value = [String(normalized[0]), String(normalized[1])];
  emitIfChanged(normalized);
}
</script>