<script setup lang="ts">
// i18n
const { t } = useI18n();

// Links
const navLinksLeft = [
  {
    label: t("navigation.shop"),
    path: "/collections/design-entreematten-op-maat",
  },
  {
    label: t("navigation.samples"),
    path: "/collections/samples",
  },
  { label: t("navigation.collections"), path: "/collections/latest" },
  { label: t("navigation.about"), path: "/collections/latest" },
];

const navLinksRight = [{ label: t("navigation.account"), path: "/account" }];

// Stores
const cartStore = useCartStore();
const shopStore = useShopStore();

// Computed
const cartTotalItems = computed(() => cartStore.cart?.totalQuantity || 0);

// Emits
const emit = defineEmits<{
  toggleLocaleModal: [];
  toggleSearchMenu: [];
  toggleCartDrawer: [];
}>();

// Emit events
const toggleLocaleModal = () => {
  emit("toggleLocaleModal");
};

const toggleSearchMenu = () => {
  emit("toggleSearchMenu");
};

const toggleCartDrawer = () => {
  emit("toggleCartDrawer");
};
</script>

<template>
  <nav
    class="hidden grid-cols-[1fr_max-content_1fr] min-h-(--header-height) px-4 lg:grid"
  >
    <div class="grid grid-flow-col justify-start items-center">
      <NuxtLink
        v-for="link in navLinksLeft"
        :key="link.label"
        :to="link.path"
        class="px-2 py-0.5 text-normalize bg-transparent rounded-md transition duration-200 hover:bg-zinc-100"
      >
        <span>{{ link.label }}</span>
      </NuxtLink>
    </div>
    <div class="flex items-center">
      <NuxtLink
        id="logo"
        to="/"
        class="px-2 py-0.5 text-normalize bg-transparent rounded-md transition duration-200 hover:bg-zinc-100"
      >
        <span>Nitrogen</span>
      </NuxtLink>
    </div>
    <div class="grid grid-flow-col justify-end items-center">
      <button
        class="px-2 py-0.5 text-normalize bg-transparent rounded-md transition duration-200 hover:bg-zinc-100"
        @click="toggleLocaleModal"
      >
        <span
          >{{ shopStore.locale?.country?.isoCode || "NL" }} /
          {{ shopStore.locale?.country?.currency?.symbol || "€" }}</span
        >
      </button>
      <NuxtLink
        v-for="link in navLinksRight"
        :key="link.label"
        :to="link.path"
        class="px-2 py-0.5 text-normalize bg-transparent rounded-md transition duration-200 hover:bg-zinc-100"
      >
        <span>{{ link.label }}</span>
      </NuxtLink>
      <button
        class="px-2 py-0.5 text-normalize bg-transparent rounded-md transition duration-200 hover:bg-zinc-100"
        @click="toggleSearchMenu"
      >
        <span>{{ t("navigation.search") }}</span>
      </button>
      <button
        class="px-2.5 py-0.5 text-normalize bg-transparent rounded-md transition duration-200 hover:bg-zinc-100"
        @click="toggleCartDrawer"
      >
        <span>{{ t("navigation.cart") }} ({{ cartTotalItems }})</span>
      </button>
    </div>
  </nav>
</template>
