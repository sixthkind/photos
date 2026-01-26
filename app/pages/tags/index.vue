<script setup>
import { pb } from '#imports';
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({});

const router = useRouter();
const route = useRoute();
const tags = ref([]);
const loading = ref(true);
const skeletonPills = ref([]);

const buildSkeletonPills = () => {
  skeletonPills.value = Array.from({ length: 30 }, () => {
    return Math.floor(70 + Math.random() * 110);
  });
};

const fetchTags = async () => {
  loading.value = true;
  try {
    tags.value = await pb.collection('tags').getFullList({
      sort: 'name'
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
  } finally {
    loading.value = false;
  }
};

const openTag = (tag) => {
  if (!tag?.name) return;
  router.push(`/tags/${encodeURIComponent(tag.name)}`);
};

onMounted(() => {
  buildSkeletonPills();
  fetchTags();
});

watch(
  () => route.query.refreshed,
  (value) => {
    if (value) {
      fetchTags();
    }
  }
);

watch(loading, (isLoading) => {
  if (isLoading) {
    buildSkeletonPills();
  }
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="flex items-center justify-between mt-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Tags</h1>
        </div>

        <div v-if="loading" class="flex flex-wrap gap-3">
          <div
            v-for="(width, index) in skeletonPills"
            :key="`skeleton-${index}`"
            class="tag-skeleton-pill"
            :style="{ width: `${width}px` }"
          ></div>
        </div>
        <div v-else-if="tags.length === 0" class="text-center py-20 text-gray-500">
          No tags yet.
        </div>
        <div v-else class="flex flex-wrap gap-3">
          <button
            v-for="tag in tags"
            :key="tag.id"
            @click="openTag(tag)"
            class="px-4 py-2 rounded-full bg-white bg-opacity-80 backdrop-blur border border-gray-200 text-sm text-gray-700 hover:text-gray-900 hover:bg-opacity-100 transition-colors"
          >
            #{{ tag.name }}
          </button>
        </div>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.tag-skeleton-pill {
  height: 2.25rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, #f2f2f2 0%, #e6e6e6 50%, #f2f2f2 100%);
  background-size: 200% 100%;
  animation: tag-skeleton-shimmer 1.3s ease-in-out infinite;
}

@keyframes tag-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
