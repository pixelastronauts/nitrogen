<script setup lang="ts">
// i18n
const { t } = useI18n();

// Stores
const appStore = useAppStore();

// Links
const footerLinks1 = [
  { label: t("navigation.about"), path: "/collections/latest" },
  { label: t("footer.campaigns"), path: "/collections/latest" },
  { label: t("footer.contact"), path: "/collections/latest" },
];

const footerLinks2 = [
  { label: t("footer.faq"), path: "/collections/latest" },
  { label: t("footer.shippingReturns"), path: "/collections/latest" },
  { label: t("footer.privacyPolicy"), path: "/collections/latest" },
  { label: t("footer.payments"), path: "/collections/latest" },
];

const footerLinks3 = [
  { label: t("footer.instagram"), path: "/collections/latest" },
  { label: t("footer.tiktok"), path: "/collections/latest" },
  { label: t("footer.github"), path: "/collections/latest" },
];

// Actions
const closeMobileMenu = () => {
  appStore.toggle("mobileMenu", false);
};

// Watchers
const route = useRoute();
const { escape } = useMagicKeys();

watch(() => route.path, closeMobileMenu);

if (escape) {
  watch(escape, closeMobileMenu);
}
</script>

<template>
  <Transition name="bg-fade">
    <section
      v-if="appStore.mobileMenu"
      class="fixed inset-0 z-200 bg-black/50 pointer-events-auto lg:hidden"
      @click="closeMobileMenu"
    />
  </Transition>
  <Transition name="slide-left">
    <div
      v-if="appStore.mobileMenu"
      class="fixed flex flex-col inset-y-0 start-0 z-200 w-full max-w-sm bg-white border-e border-zinc-200 pointer-events-auto lg:hidden"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-zinc-200"
      >
        <h2 class="text-lg font-medium">{{ t("navigation.menu") }}</h2>
        <button @click="closeMobileMenu">
          <Icon name="ph:x" class="size-6" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-6">
          <div>
            <h3 class="font-medium mb-3">{{ t("footer.company") }}</h3>
            <nav class="space-y-2">
              <NuxtLink
                v-for="link in footerLinks1"
                :key="link.label"
                :to="link.path"
                class="block py-2 text-gray-600 hover:text-gray-900"
                @click="closeMobileMenu"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>
          </div>
          <div>
            <h3 class="font-medium mb-3">{{ t("footer.support") }}</h3>
            <nav class="space-y-2">
              <NuxtLink
                v-for="link in footerLinks2"
                :key="link.label"
                :to="link.path"
                class="block py-2 text-gray-600 hover:text-gray-900"
                @click="closeMobileMenu"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>
          </div>
          <div>
            <h3 class="font-medium mb-3">{{ t("footer.connect") }}</h3>
            <nav class="space-y-2">
              <NuxtLink
                v-for="link in footerLinks3"
                :key="link.label"
                :to="link.path"
                class="block py-2 text-gray-600 hover:text-gray-900"
                @click="closeMobileMenu"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>
          </div>
        </div>
      </div>
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

.slide-left-enter-active,
.slide-left-leave-active {
  @apply transition duration-200 ease-out;
}

.slide-left-enter-from,
.slide-left-leave-to {
  @apply opacity-0 transform -translate-x-full;
}

.slide-left-enter-to,
.slide-left-leave-from {
  @apply opacity-100 transform translate-x-0;
}
</style>
