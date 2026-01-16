<script setup>
import { pb } from '#imports';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({});

const router = useRouter();
const tags = ref([]);
const loading = ref(true);

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
  fetchTags();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="flex items-center justify-between mt-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Tags</h1>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20">
          <Icon name="svg-spinners:ring-resize" class="text-4xl text-blue-500" />
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
