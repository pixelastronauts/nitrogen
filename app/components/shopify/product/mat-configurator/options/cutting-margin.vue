<script setup lang="ts">
// Injected state from parent
const configuratorState = inject("configuratorState") as any;
const updateCuttingMargin = inject("updateCuttingMargin") as (
  hasCuttingMargin: boolean
) => void;

// Local state
const selectedOption = ref<boolean | null>(null);

// Options
const options = [
  {
    id: "with-margin",
    value: true,
    label: "Ja, in een uitsparing of tussen iets geplaatst",
    description: "Wij voegen 3cm extra toe voor de snijmarge",
    recommended: true,
  },
  {
    id: "without-margin",
    value: false,
    label: "Nee, gewoon op de vloer",
    description: "Standaard afmeting zonder extra marge",
  },
];

// Methods
const selectOption = (option: (typeof options)[0]) => {
  selectedOption.value = option.value;
  updateCuttingMargin(option.value);
};

// Initialize with default if enabled
onMounted(() => {
  if (configuratorState?.hasCuttingMargin !== null) {
    selectedOption.value = configuratorState.hasCuttingMargin;
  }
});

// Watch for external changes
watch(
  () => configuratorState?.hasCuttingMargin,
  (newValue) => {
    if (newValue !== null) {
      selectedOption.value = newValue;
    }
  }
);
</script>

<template>
  <div class="cutting-margin space-y-4">
    <div>
      <h3 class="text-lg font-medium text-gray-900">
        Uitsparing of ergens tussen?
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Kies de juiste optie voor je situatie
      </p>
    </div>

    <!-- Options -->
    <div class="space-y-3">
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
            class="absolute top-4 right-4 w-4 h-4 bg-sand-900 rounded-full flex items-center justify-center transition-opacity"
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
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900">{{ option.label }}</span>
              <span
                v-if="option.recommended"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
              >
                Aanbevolen
              </span>
            </div>
            <p class="text-sm text-gray-600">{{ option.description }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Additional information based on selection -->
    <div v-if="selectedOption !== null" class="p-4 bg-blue-50 rounded-lg">
      <div v-if="selectedOption" class="flex items-start gap-3">
        <div class="flex-shrink-0 w-5 h-5 mt-0.5">
          <svg
            class="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h4 class="font-medium text-blue-900 mb-1">Met snijmarge</h4>
          <p class="text-sm text-blue-800">
            Wij voegen bewust +/- 3cm extra materiaal toe, zodat je de mat
            precies kunt aanpassen aan jouw specifieke ruimte. Met een stanley
            mes snij je hem eenvoudig op de gewenste maat - voor een perfecte
            pasvorm!
          </p>
        </div>
      </div>

      <div v-else class="flex items-start gap-3">
        <div class="flex-shrink-0 w-5 h-5 mt-0.5">
          <svg
            class="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div>
          <h4 class="font-medium text-blue-900 mb-1">Zonder extra snijmarge</h4>
          <p class="text-sm text-blue-800">
            Je ontvangt de mat in de exacte afmetingen die je hebt opgegeven.
            Perfect voor plaatsing op een open vloer waar precieze pasvorm niet
            kritiek is.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
