<script setup lang="ts">
const cartStore = useCartStore();
const { initializeLocale, i18nLocale } = useLocale();

// Initialize locale system and cart on app startup
try {
  await Promise.all([initializeLocale(), (cartStore as any).getCart()]);
} catch (error) {
  console.warn("Failed to initialize app:", error);
}

useHead({
  titleTemplate: (title) =>
    title ? `${title} · Nitrogen` : "Nitrogen: A Nuxt Shopify Template",
  meta: [
    {
      name: "viewport",
      content:
        "width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1",
    },
    { key: "theme-color", name: "theme-color", content: "#181717" },
  ],
  link: [
    { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
    { rel: "preconnect", href: "https://cdn.shopify.com" },
  ],
  htmlAttrs: {
    lang: i18nLocale,
  },
});
</script>

<template>
  <AppHeader />
  <CartDrawer />
  <MobileMenu />
  <SearchMenu />
  <LocaleModal />
  <ClientOnly>
    <CookieBanner />
  </ClientOnly>

  <!-- Main -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <AppFooter />
</template>
