<script setup lang="ts">
// Injected state from parent
const configuratorState = inject("configuratorState") as any;
const configuratorConfig = inject("configuratorConfig") as any;
const updateDimensions = inject("updateDimensions") as (
  length: number,
  width: number
) => void;

// Local state
const selectedPreset = ref<string | null>(null);
const showCustomInputs = ref(false);
const lengthInput = ref("");
const widthInput = ref("");
const lengthError = ref("");
const widthError = ref("");
const generalError = ref(""); // General error for both dimensions constraint

// Preset options based on your original liquid code
const presetOptions = [
  { id: "custom", label: "Eigen maat", isCustom: true },
  { id: "40x60", label: "40 x 60 cm", height: 40, width: 60 },
  { id: "50x70", label: "50 x 70 cm", height: 50, width: 70 },
  { id: "60x90", label: "60 x 90 cm", height: 60, width: 90 },
  { id: "70x100", label: "70 x 100 cm", height: 70, width: 100 },
];

// Validation timeout
let validationTimeout: NodeJS.Timeout | null = null;

// Configuration constants with fallbacks
const getConfig = () => ({
  minVertical: 25, // Always use 25 as minimum
  maxVertical: 300, // Always use 300 as maximum
  minHorizontal: 25, // Always use 25 as minimum
  maxHorizontal: 300, // Always use 300 as maximum
  constraintThreshold: 180, // The threshold where dimensions become dependent
});

// Methods
const selectPreset = (preset: (typeof presetOptions)[0]) => {
  selectedPreset.value = preset.id;

  if (preset.isCustom) {
    showCustomInputs.value = true;
    // Clear inputs when switching to custom
    lengthInput.value = "";
    widthInput.value = "";
    clearErrors();
  } else {
    showCustomInputs.value = false;
    // Set preset dimensions
    lengthInput.value = String(preset.height);
    widthInput.value = String(preset.width);
    updateDimensions(preset.height!, preset.width!);
    clearErrors();
  }
};

const onInputChange = () => {
  // Clear previous timeout
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  // Immediate update for price calculation
  const length = parseInt(lengthInput.value) || 0;
  const width = parseInt(widthInput.value) || 0;
  updateDimensions(length, width);

  // Check if dimensions match any preset
  updatePresetSelection();

  // Debounced validation
  validationTimeout = setTimeout(() => {
    validateInputs();
  }, 600);
};

const updatePresetSelection = () => {
  const length = parseInt(lengthInput.value) || 0;
  const width = parseInt(widthInput.value) || 0;

  // Check if current dimensions match any preset
  const matchingPreset = presetOptions.find(
    (preset) =>
      !preset.isCustom && preset.height === length && preset.width === width
  );

  if (matchingPreset) {
    selectedPreset.value = matchingPreset.id;
    showCustomInputs.value = false;
  } else if (length > 0 || width > 0) {
    selectedPreset.value = "custom";
    showCustomInputs.value = true;
  }
};

// Helper method to check if both dimensions exceed the constraint threshold
const validateBothDimensionsRule = (length: number, width: number) => {
  const config = getConfig();
  return !(
    length > config.constraintThreshold && width > config.constraintThreshold
  );
};

const validateInputs = () => {
  if (!configuratorState) return;

  const length = parseInt(lengthInput.value) || 0;
  const width = parseInt(widthInput.value) || 0;

  lengthError.value = "";
  widthError.value = "";
  generalError.value = "";

  // Check if both dimensions exceed the constraint threshold
  const config = getConfig();
  const bothExceedThreshold =
    length > config.constraintThreshold && width > config.constraintThreshold;

  if (
    bothExceedThreshold &&
    configuratorState.inputsInteracted.length &&
    configuratorState.inputsInteracted.width
  ) {
    // Show general error instead of individual errors
    generalError.value = `Je kan maar één zijde groter dan ${config.constraintThreshold}cm hebben.`;
    return;
  }

  // Only validate individual fields if both dimensions rule is not violated
  if (configuratorState.inputsInteracted.length && length > 0) {
    const lengthValidation = validateLength(length, width);
    if (
      !lengthValidation.isValid &&
      !lengthValidation.error.includes("maar één zijde")
    ) {
      lengthError.value = lengthValidation.error;
    }
  }

  if (configuratorState.inputsInteracted.width && width > 0) {
    const widthValidation = validateWidth(width, length);
    if (
      !widthValidation.isValid &&
      !widthValidation.error.includes("maar één zijde")
    ) {
      widthError.value = widthValidation.error;
    }
  }
};

const validateLength = (length: number, width: number) => {
  const config = getConfig();
  const min = config.minVertical;
  let max: number;

  // Dynamic max based on width value
  if (width > config.constraintThreshold) {
    // Width exceeds threshold, so length must stay within threshold
    max = config.constraintThreshold;
  } else {
    // Width is within threshold, so length can use its full max
    max = config.maxVertical;
  }

  const bothDimensionsValid = validateBothDimensionsRule(length, width);

  if (length < min || length > max || !bothDimensionsValid) {
    const errorMsg = !bothDimensionsValid
      ? `Je kan maar één zijde groter dan ${config.constraintThreshold}cm hebben.`
      : `Lengte moet tussen ${min}-${max}cm zijn`;

    return { isValid: false, error: errorMsg };
  }

  return { isValid: true, error: "" };
};

const validateWidth = (width: number, length: number) => {
  const config = getConfig();
  const min = config.minHorizontal;
  let max: number;

  // Dynamic max based on length value
  if (length > config.constraintThreshold) {
    // Length exceeds threshold, so width must stay within threshold
    max = config.constraintThreshold;
  } else {
    // Length is within threshold, so width can use its full max
    max = config.maxHorizontal;
  }

  const bothDimensionsValid = validateBothDimensionsRule(length, width);

  if (width < min || width > max || !bothDimensionsValid) {
    const errorMsg = !bothDimensionsValid
      ? `Je kan maar één zijde groter dan ${config.constraintThreshold}cm hebben.`
      : `Breedte moet tussen ${min}-${max}cm zijn`;

    return { isValid: false, error: errorMsg };
  }

  return { isValid: true, error: "" };
};

const clearErrors = () => {
  lengthError.value = "";
  widthError.value = "";
  generalError.value = "";
};

const preventDecimal = (event: KeyboardEvent) => {
  // Allow: backspace, delete, tab, escape, enter
  if (
    [8, 9, 27, 13, 46].includes(event.keyCode) ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (event.keyCode === 65 && (event.ctrlKey || event.metaKey)) ||
    (event.keyCode === 67 && (event.ctrlKey || event.metaKey)) ||
    (event.keyCode === 86 && (event.ctrlKey || event.metaKey)) ||
    (event.keyCode === 88 && (event.ctrlKey || event.metaKey)) ||
    // Allow: home, end, left, right, up, down arrows
    (event.keyCode >= 35 && event.keyCode <= 40)
  ) {
    return;
  }

  // Prevent decimal point, comma, and non-numeric characters
  if (
    (event.shiftKey || event.keyCode < 48 || event.keyCode > 57) &&
    (event.keyCode < 96 || event.keyCode > 105)
  ) {
    event.preventDefault();
  }

  // Specifically prevent decimal point and comma
  if ([190, 110, 188].includes(event.keyCode)) {
    event.preventDefault();
  }
};

// Computed properties for dynamic placeholders
const lengthPlaceholder = computed(() => {
  const config = getConfig();
  const width = parseInt(widthInput.value) || 0;
  let max: number;

  if (width > config.constraintThreshold) {
    max = config.constraintThreshold;
  } else {
    max = config.maxVertical;
  }

  return `${config.minVertical} tot ${max}`;
});

const widthPlaceholder = computed(() => {
  const config = getConfig();
  const length = parseInt(lengthInput.value) || 0;
  let max: number;

  if (length > config.constraintThreshold) {
    max = config.constraintThreshold;
  } else {
    max = config.maxHorizontal;
  }

  return `${config.minHorizontal} tot ${max}`;
});

// Initialize without default values
onMounted(() => {
  // Component starts with empty inputs - no default values
});

// Cleanup
onUnmounted(() => {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
});
</script>

<template>
  <div class="mat-dimensions space-y-4">
    <h3 class="text-lg font-medium text-gray-900">Afmetingen</h3>

    <!-- Preset Options -->
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="preset in presetOptions"
        :key="preset.id"
        type="button"
        class="relative flex flex-col items-center justify-center p-4 text-sm font-medium border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sand-500"
        :class="[
          selectedPreset === preset.id
            ? 'bg-sand-100 border-sand-900 ring-1 ring-sand-900'
            : 'bg-white border-gray-300 hover:bg-gray-50',
          preset.isCustom ? 'col-span-2' : '',
        ]"
        @click="selectPreset(preset)"
      >
        <!-- Checkmark -->
        <div
          class="absolute top-2 right-2 w-4 h-4 bg-sand-900 rounded-full flex items-center justify-center transition-opacity"
          :class="selectedPreset === preset.id ? 'opacity-100' : 'opacity-0'"
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

        <!-- Icon for custom size -->
        <div v-if="preset.isCustom" class="mb-2">
          <svg
            class="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            />
          </svg>
        </div>

        <!-- Rectangle visualization for presets -->
        <div v-else class="mb-2 flex items-center justify-center">
          <div
            class="border border-gray-300 bg-gray-50"
            :style="{
              width: `${Math.min(preset.width! / 4, 24)}px`,
              height: `${Math.min(preset.height! / 4, 24)}px`
            }"
          />
        </div>

        <span class="text-center">{{ preset.label }}</span>
      </button>
    </div>

    <!-- Custom Inputs -->
    <div v-if="showCustomInputs" class="space-y-4 p-4 bg-gray-50 rounded-lg">
      <!-- Input Fields Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            for="length-input"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Lengte (cm)
          </label>
          <input
            id="length-input"
            v-model="lengthInput"
            type="number"
            min="25"
            max="300"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sand-500 focus:border-sand-500"
            :class="{ 'border-red-500 ring-red-500': lengthError }"
            :placeholder="lengthPlaceholder"
            @input="onInputChange"
            @keydown="preventDecimal"
          />
          <p v-if="lengthError" class="mt-1 text-sm text-red-600">
            {{ lengthError }}
          </p>
        </div>

        <div>
          <label
            for="width-input"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Breedte (cm)
          </label>
          <input
            id="width-input"
            v-model="widthInput"
            type="number"
            min="25"
            max="300"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sand-500 focus:border-sand-500"
            :class="{ 'border-red-500 ring-red-500': widthError }"
            :placeholder="widthPlaceholder"
            @input="onInputChange"
            @keydown="preventDecimal"
          />
          <p v-if="widthError" class="mt-1 text-sm text-red-600">
            {{ widthError }}
          </p>
        </div>
      </div>

      <!-- General Error Message -->
      <div
        v-if="generalError"
        class="p-3 bg-red-50 border border-red-200 rounded-lg"
      >
        <p class="text-sm text-red-600">
          {{ generalError }}
        </p>
      </div>
    </div>
  </div>
</template>
