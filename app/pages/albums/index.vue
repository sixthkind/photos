<script setup>
import { pb } from '#imports';
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

definePageMeta({});

const router = useRouter();
const route = useRoute();
const albums = ref([]);
const albumPhotos = ref(new Map());
const loading = ref(true);
const showCreate = ref(false);
const form = ref({
  title: '',
  description: ''
});
const error = ref(null);

const isAuthenticated = computed(() => pb.authStore.isValid);

const fetchAlbums = async () => {
  loading.value = true;
  try {
    albums.value = await pb.collection('albums').getFullList({
      sort: '-created',
      expand: 'coverPhoto'
    });
    const albumIds = albums.value.map(album => album.id);
    if (albumIds.length > 0) {
      const photos = await pb.collection('photos').getFullList({
        sort: '-created',
        filter: `album != ""`
      });
      const byAlbum = new Map();
      photos.forEach(photo => {
        if (!photo.album || !albumIds.includes(photo.album)) return;
        if (!byAlbum.has(photo.album)) byAlbum.set(photo.album, []);
        byAlbum.get(photo.album).push(photo);
      });
      albumIds.forEach(albumId => {
        const list = byAlbum.get(albumId) || [];
        list.sort((a, b) => {
          const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
          const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
          if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
          if (aOrder !== null) return -1;
          if (bOrder !== null) return 1;
          return new Date(b.created) - new Date(a.created);
        });
        const seenGroups = new Set();
        const unique = [];
        for (const photo of list) {
          if (photo.group) {
            if (seenGroups.has(photo.group)) continue;
            seenGroups.add(photo.group);
          }
          unique.push(photo);
          if (unique.length >= 4) break;
        }
        albumPhotos.value.set(albumId, unique);
      });
    } else {
      albumPhotos.value = new Map();
    }
  } catch (err) {
    console.error('Error fetching albums:', err);
  } finally {
    loading.value = false;
  }
};

const getAlbumCoverUrl = (album) => {
  if (!album?.expand?.coverPhoto) return '';
  return pb.files.getURL(album.expand.coverPhoto, album.expand.coverPhoto.photo, { thumb: '500x500' });
};

const getAlbumTilePhotos = (albumId) => {
  return albumPhotos.value.get(albumId) || [];
};

const getPhotoUrl = (photo) => {
  return pb.files.getURL(photo, photo.photo, { thumb: '300x300' });
};

const openAlbum = (album) => {
  router.push(`/albums/${album.id}`);
};

const toggleCreate = () => {
  showCreate.value = !showCreate.value;
  error.value = null;
};

const createAlbum = async () => {
  if (!form.value.title.trim()) {
    error.value = 'Title is required.';
    return;
  }
  try {
    const albumData = {
      title: form.value.title.trim(),
      description: form.value.description.trim()
    };
    if (pb.authStore.record?.id) {
      albumData.user = pb.authStore.record.id;
    }
    await pb.collection('albums').create(albumData);
    form.value.title = '';
    form.value.description = '';
    showCreate.value = false;
    await fetchAlbums();
  } catch (err) {
    console.error('Error creating album:', err);
    error.value = 'Failed to create album. Please try again.';
  }
};

onMounted(() => {
  fetchAlbums();
});

onActivated(() => {
  fetchAlbums();
});

watch(() => route.fullPath, () => {
  fetchAlbums();
});
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <div class="flex items-center justify-between mt-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Albums</h1>
          <button
            v-if="isAuthenticated"
            @click="toggleCreate"
            class="bg-white bg-opacity-70 backdrop-blur rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-opacity-90 transition-colors"
          >
            Add Album
          </button>
        </div>

        <div v-if="showCreate" class="bg-white rounded-lg border p-4 mb-6">
          <div class="grid gap-3">
            <input
              v-model="form.title"
              type="text"
              maxlength="200"
              placeholder="Album title"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              v-model="form.description"
              rows="3"
              maxlength="1000"
              placeholder="Album description (optional)"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea>
            <div class="flex items-center gap-3">
              <button
                @click="createAlbum"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create
              </button>
              <button
                @click="toggleCreate"
                class="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
            </div>
          </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20">
          <Icon name="svg-spinners:ring-resize" class="text-4xl text-blue-500" />
        </div>
        <div v-else-if="albums.length === 0" class="text-center py-20 text-gray-500">
          No albums yet.
        </div>
        <GalleryPhotoGridLayout
          v-else
          :items="albums"
          layout="grid"
          :selection-mode="false"
          :selected-photos="[]"
          @photo-click="openAlbum"
        >
          <template #photo-item="{ item }">
            <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-50" style="aspect-ratio: 1 / 1;">
              <div class="grid grid-cols-2 grid-rows-2 w-full h-full">
                <div
                  v-for="(photo, index) in getAlbumTilePhotos(item.id)"
                  :key="photo.id"
                  class="w-full h-full overflow-hidden"
                >
                  <img
                    :src="getPhotoUrl(photo)"
                    :alt="photo.title || 'Album photo'"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div
                  v-if="getAlbumTilePhotos(item.id).length === 0"
                  class="col-span-2 row-span-2 flex items-center justify-center text-gray-400"
                >
                  <Icon name="heroicons:rectangle-stack" class="text-5xl" />
                </div>
              </div>
              <div class="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur text-white p-3">
                <div class="text-sm font-semibold">{{ item.title }}</div>
                <div v-if="item.description" class="text-xs text-white/80 line-clamp-2">{{ item.description }}</div>
              </div>
            </div>
          </template>
        </GalleryPhotoGridLayout>
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
