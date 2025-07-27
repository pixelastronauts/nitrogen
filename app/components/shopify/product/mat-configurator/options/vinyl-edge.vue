<script setup lang="ts">
// Injected state from parent
const configuratorState = inject("configuratorState") as any;
const updateVinylEdge = inject("updateVinylEdge") as (
  hasVinylEdge: boolean
) => void;

// Local state
const selectedOption = ref<boolean | null>(null);

// Options
const options = [
  {
    id: "without-edge",
    value: false,
    label: "Zonder vinylrand",
    description: "Standaard afmeting zonder extra vinylrand",
    icon: "📐",
  },
  {
    id: "with-edge",
    value: true,
    label: "Met vinylrand",
    description: "Extra vinylrand voor een nette afwerking",
    icon: "🎨",
  },
];

// Methods
const selectOption = (option: (typeof options)[0]) => {
  selectedOption.value = option.value;
  updateVinylEdge(option.value);
};

// Initialize with default if enabled
onMounted(() => {
  if (configuratorState?.hasVinylEdge !== null) {
    selectedOption.value = configuratorState.hasVinylEdge;
  }
});

// Watch for external changes
watch(
  () => configuratorState?.hasVinylEdge,
  (newValue) => {
    if (newValue !== null) {
      selectedOption.value = newValue;
    }
  }
);
</script>

<template>
  <div class="vinyl-edge space-y-4">
    <div>
      <h3 class="text-lg font-medium text-gray-900">Vinylrand</h3>
      <p class="text-sm text-gray-600 mt-1">
        Kies voor een vinylrand voor extra bescherming en een mooie afwerking
      </p>
    </div>

    <!-- Options -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="option in options" :key="option.id" class="relative">
        <button
          type="button"
          class="w-full p-4 text-left border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sand-500"
          :class="[
            selectedOption === option.value
              ? 'bg-sand-100 border-sand-900 ring-1 ring-sand-900'
              : 'bg-white border-gray-300 hover:bg-gray-50',
          ]"
          @click="selectOption(option)"
        >
          <!-- Checkmark -->
          <div
            class="absolute top-3 right-3 w-4 h-4 bg-sand-900 rounded-full flex items-center justify-center transition-opacity"
            :class="
              selectedOption === option.value ? 'opacity-100' : 'opacity-0'
            "
          >
            <svg
              class="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <!-- Content -->
          <div class="pr-8">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">{{ option.icon }}</span>
              <span class="font-medium text-gray-900">{{ option.label }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ option.description }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
