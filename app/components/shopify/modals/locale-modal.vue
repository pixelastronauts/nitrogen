<script setup lang="ts">
import type { CountryCode, LanguageCode } from "@@/types/shopify-storefront";
import { useMagicKeys } from "@vueuse/core";

// Stores
const appStore = useAppStore();
const cartStore = useCartStore();
const shopStore = useShopStore();

// Locale system
const { setCustomLocale, currentLocale, DEFAULT_LOCALES } = useLocale();

// i18n
const { t } = useI18n();

// Shop data - directly use Shopify data
const countries = computed(() => {
  const available = shopStore.locale?.availableCountries || [];
  console.log("Modal countries data:", available);
  return available;
});

const languages = computed(() => {
  const available = shopStore.locale?.availableLanguages || [];
  console.log("Modal languages data:", available);
  return available;
});

// Debug: Log current shop store state
watch(
  () => shopStore.locale,
  (locale) => {
    console.log("Shop store locale updated:", locale);
  },
  { immediate: true, deep: true },
);

// State
const countryLocale = ref<CountryCode>(currentLocale.value.country);
const languageLocale = ref<LanguageCode>(currentLocale.value.language);
const isLoading = ref(false);
const isDataLoading = ref(false);

// Check if we have data available
const hasData = computed(() => {
  return countries.value.length > 0 && languages.value.length > 0;
});

// Check if using predefined locale vs custom
const isCustomLocale = computed(() => {
  return !Object.values(DEFAULT_LOCALES).some(
    (locale) =>
      locale.country === countryLocale.value &&
      locale.language === languageLocale.value,
  );
});

// Update localization
const updateLocalization = async () => {
  isLoading.value = true;

  try {
    // Update cart buyer identity
    await (cartStore as any).attachBuyer({ countryCode: countryLocale.value });

    // Check if this matches a predefined locale
    const predefinedLocale = Object.entries(DEFAULT_LOCALES).find(
      ([, config]) =>
        config.country === countryLocale.value &&
        config.language === languageLocale.value,
    );

    if (predefinedLocale) {
      // Use the predefined locale
      const [localeKey] = predefinedLocale;
      const { setLocale } = useLocale();
      await setLocale(localeKey);
    } else {
      // Use custom locale combination
      await setCustomLocale(countryLocale.value, languageLocale.value);
    }

    // Trigger a page refresh to ensure all data is refetched with new locale
    if (process.client) {
      window.location.reload();
    }
  } catch (error) {
    console.error("Failed to update localization:", error);
  } finally {
    isLoading.value = false;
    closeModal();
  }
};

// Actions
const closeModal = () => {
  appStore.toggle("localeModal", false);
};

// Refresh locale data when modal opens
const refreshLocaleData = async () => {
  try {
    isDataLoading.value = true;
    console.log("Refreshing locale data...");
    // Ensure we have the latest locale data from Shopify
    await shopStore.getLocalization();
    console.log(
      "Locale data refreshed, countries:",
      countries.value.length,
      "languages:",
      languages.value.length,
    );
  } catch (error) {
    console.warn("Failed to refresh locale data:", error);
  } finally {
    isDataLoading.value = false;
  }
};

// Watch for modal opening and refresh data
watch(
  () => appStore.localeModal,
  (isOpen) => {
    if (isOpen) {
      refreshLocaleData();
    }
  },
);

// Update refs when current locale changes
watch(
  currentLocale,
  (newLocale) => {
    countryLocale.value = newLocale.country;
    languageLocale.value = newLocale.language;
  },
  { immediate: true },
);

// Watchers
const route = useRoute();
const { escape } = useMagicKeys();

watch(() => route.path, closeModal);

if (escape) {
  watch(escape, closeModal);
}
</script>

<template>
  <Transition name="bg-fade">
    <section
      v-if="appStore.localeModal"
      class="fixed inset-0 z-200 bg-black/50 pointer-events-auto"
      @click="closeModal"
    />
  </Transition>
  <Transition name="fade-up">
    <div
      v-if="appStore.localeModal"
      class="fixed flex items-center justify-center size-full inset-0 z-200 pointer-events-none"
    >
      <dialog
        class="relative flex flex-col p-8 bg-white rounded-lg shadow-xl pointer-events-auto w-full max-w-md mx-4"
      >
        <h2 class="uppercase text-center mb-6">
          {{ t("locale.selectCountry") }}
        </h2>
        <!-- Loading State -->
        <div v-if="isDataLoading" class="flex items-center justify-center py-8">
          <div class="flex items-center gap-3">
            <svg
              class="animate-spin h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span class="text-gray-600">{{ t("common.loading") }}</span>
          </div>
        </div>

        <!-- Form Content -->
        <form
          v-else-if="hasData"
          class="flex flex-col space-y-6"
          @submit.prevent="updateLocalization"
        >
          <!-- Country Selection -->
          <div class="space-y-2">
            <label
              for="country"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t("locale.currentCountry") }}
            </label>
            <div class="relative">
              <select
                id="country"
                v-model="countryLocale"
                name="countryLocale"
                class="flex w-full py-3 px-4 bg-white border border-zinc-300 rounded-md appearance-none placeholder:text-black focus:outline-1 focus:outline-black focus:border-black transition duration-200"
              >
                <option
                  v-for="country in countries"
                  :key="country.isoCode"
                  :value="country.isoCode"
                >
                  {{ country.name }} ({{ country.currency.isoCode }}
                  {{ country.currency.symbol }})
                </option>
              </select>
              <span
                class="absolute inset-y-0 end-0 flex items-center pointer-events-none px-3"
              >
                <Icon
                  name="ph:caret-up-down"
                  class="size-4 shrink-0 text-gray-400"
                />
              </span>
            </div>
          </div>

          <!-- Language Selection -->
          <div class="space-y-2" v-if="languages && languages.length > 0">
            <label
              for="language"
              class="block text-sm font-medium text-gray-700"
            >
              {{ t("locale.currentLanguage") }}
            </label>
            <div class="relative">
              <select
                id="language"
                v-model="languageLocale"
                name="languageLocale"
                class="flex w-full py-3 px-4 bg-white border border-zinc-300 rounded-md appearance-none placeholder:text-black focus:outline-1 focus:outline-black focus:border-black transition duration-200"
              >
                <option
                  v-for="language in languages"
                  :key="language.isoCode"
                  :value="language.isoCode"
                >
                  {{ language.endonymName }}
                </option>
              </select>
              <span
                class="absolute inset-y-0 end-0 flex items-center pointer-events-none px-3"
              >
                <Icon
                  name="ph:caret-up-down"
                  class="size-4 shrink-0 text-gray-400"
                />
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-200"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="flex-1 px-4 py-3 text-sm font-medium text-white bg-black border border-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              <span v-if="isLoading" class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {{ t("common.saving") }}
              </span>
              <span v-else>{{ t("common.save") }}</span>
            </button>
          </div>
        </form>

        <!-- No Data Fallback -->
        <div v-else class="flex items-center justify-center py-8">
          <div class="text-center">
            <p class="text-gray-600 mb-4">
              {{ t("locale.noDataAvailable") || "No locale data available" }}
            </p>
            <button
              @click="refreshLocaleData"
              class="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition duration-200"
            >
              {{ t("common.retry") || "Retry" }}
            </button>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center leading-relaxed">
            {{ t("locale.shopInLocalCurrency") }}
          </p>
        </div>
        <button
          class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-200"
          @click="closeModal"
        >
          <Icon name="ph:x" class="size-5" />
        </button>
      </dialog>
    </div>
  </Transition>
</template>

<style scoped>
@reference "tailwindcss";

.bg-fade-enter-active,
.bg-fade-leave-active {
  @apply transition duration-200 ease-out;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  @apply opacity-0;
}

.bg-fade-enter-to,
.bg-fade-leave-from {
  @apply opacity-100;
}

.fade-up-enter-active,
.fade-up-leave-active {
  @apply transition duration-200 ease-out;
}

.fade-up-enter-from,
.fade-up-leave-to {
  @apply opacity-0 transform translate-y-2 delay-0;
}

.fade-up-enter-to,
.fade-up-leave-from {
  @apply opacity-100 transform translate-y-0 delay-100;
}
</style>
