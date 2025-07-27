<script setup lang="ts">
// i18n
const { t } = useI18n();

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
</script>

<template>
  <footer class="relative bg-white border-t border-zinc-300">
    <nav class="hidden flex-col p-6 gap-32 lg:flex">
      <div class="grid grid-cols-4 gap-10">
        <div class="flex flex-col max-w-fit">
          <h3 class="uppercase mb-4">
            {{ t("footer.company") }}
          </h3>
          <NuxtLink
            v-for="link in footerLinks1"
            :key="link.label"
            :to="link.path"
            class="hover:text-gray-500"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <div class="flex flex-col max-w-fit">
          <h3 class="uppercase mb-4">
            {{ t("footer.support") }}
          </h3>
          <NuxtLink
            v-for="link in footerLinks2"
            :key="link.label"
            :to="link.path"
            class="hover:text-gray-500"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <div class="flex flex-col max-w-fit">
          <h3 class="uppercase mb-4">
            {{ t("footer.connect") }}
          </h3>
          <NuxtLink
            v-for="link in footerLinks3"
            :key="link.label"
            :to="link.path"
            class="hover:text-gray-500"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <KlaviyoNewsletter />
      </div>
      <div class="grid grid-cols-1 justify-start">
        <div class="flex flex-col max-w-fit">
          <h3 class="uppercase mb-4">
            {{ t("footer.newsletter") }}
          </h3>
          <div class="grid gap-2">
            <p class="text-sm text-gray-600">
              {{ t("footer.newsletterText") }}
            </p>
            <div class="flex gap-2">
              <input
                type="email"
                :placeholder="t('forms.email')"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                {{ t("footer.subscribe") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <nav class="flex flex-col p-6 gap-8 lg:hidden">
      <div class="grid gap-8">
        <div class="flex flex-col">
          <h3 class="uppercase mb-4">
            {{ t("footer.company") }}
          </h3>
          <NuxtLink
            v-for="link in footerLinks1"
            :key="link.label"
            :to="link.path"
            class="py-1 hover:text-gray-500"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <div class="flex flex-col">
          <h3 class="uppercase mb-4">
            {{ t("footer.support") }}
          </h3>
          <NuxtLink
            v-for="link in footerLinks2"
            :key="link.label"
            :to="link.path"
            class="py-1 hover:text-gray-500"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <div class="flex flex-col">
          <h3 class="uppercase mb-4">
            {{ t("footer.connect") }}
          </h3>
          <NuxtLink
            v-for="link in footerLinks3"
            :key="link.label"
            :to="link.path"
            class="py-1 hover:text-gray-500"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <KlaviyoNewsletter />
      </div>
    </nav>
    <div class="border-t border-zinc-300 p-6">
      <p class="text-center text-sm text-gray-600">
        © Nitrogen {{ new Date().getFullYear() }}
      </p>
    </div>
  </footer>
</template>
