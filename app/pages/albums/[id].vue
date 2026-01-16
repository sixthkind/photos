<script setup>
import { pb } from '#imports';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({});

const route = useRoute();
const albumId = computed(() => route.params.id);
const album = ref(null);
const loading = ref(true);
const isEditingTitle = ref(false);
const pendingTitle = ref('');
const saveTimer = ref(null);

const galleryRef = ref(null);
const { showUpload, selectionMode, currentLayout } = useGalleryState();
const isAuthenticated = computed(() => pb.authStore.isValid);

const fetchAlbum = async () => {
  loading.value = true;
  try {
    album.value = await pb.collection('albums').getOne(albumId.value);
    pendingTitle.value = album.value?.title || '';
  } catch (error) {
    console.error('Error fetching album:', error);
  } finally {
    loading.value = false;
  }
};

const startTitleEdit = async () => {
  if (!isAuthenticated.value) return;
  isEditingTitle.value = true;
  pendingTitle.value = album.value?.title || '';
  await nextTick();
};

const queueTitleSave = () => {
  if (!isAuthenticated.value) return;
  if (!album.value) return;
  clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(async () => {
    const newTitle = pendingTitle.value.trim();
    if (!newTitle || newTitle === album.value.title) return;
    try {
      album.value = await pb.collection('albums').update(album.value.id, {
        title: newTitle
      });
    } catch (error) {
      console.error('Error updating album title:', error);
    }
  }, 400);
};

const stopTitleEdit = () => {
  isEditingTitle.value = false;
  queueTitleSave();
};

const refreshGallery = () => {
  if (galleryRef.value) {
    galleryRef.value.refresh();
  }
};

const hasExpandedGroups = computed(() => {
  return galleryRef.value?.expandedGroups?.size > 0;
});

const collapseGroups = () => {
  if (galleryRef.value) {
    galleryRef.value.collapseAllGroups();
  }
};

onMounted(() => {
  fetchAlbum();
});

watch(albumId, () => {
  fetchAlbum();
});

watch(pendingTitle, () => {
  if (isEditingTitle.value) {
    queueTitleSave();
  }
});
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="relative">
        <!-- Left Margin Clickable Area -->
        <div 
          v-if="hasExpandedGroups"
          class="fixed left-0 top-0 bottom-0 cursor-pointer hover:bg-gray-100/30 transition-colors z-10"
          style="width: calc((100vw - min(1280px, 100vw - 2.5rem)) / 2);"
          @click.stop="collapseGroups"
          title="Click to collapse groups"
        ></div>
        
        <!-- Right Margin Clickable Area -->
        <div 
          v-if="hasExpandedGroups"
          class="fixed right-0 top-0 bottom-0 cursor-pointer hover:bg-gray-100/30 transition-colors z-10"
          style="width: calc((100vw - min(1280px, 100vw - 2.5rem)) / 2);"
          @click.stop="collapseGroups"
          title="Click to collapse groups"
        ></div>

        <CommonContainer>
          <div class="flex items-center justify-between mt-4">
            <div>
              <h1
                v-if="!isEditingTitle"
                class="text-2xl font-bold text-gray-800"
                :class="isAuthenticated ? 'cursor-pointer hover:text-gray-900' : ''"
                @click="startTitleEdit"
              >
                {{ album?.title || 'Album' }}
              </h1>
              <input
                v-else
                v-model="pendingTitle"
                type="text"
                maxlength="200"
                class="text-2xl font-bold text-gray-800 w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                @blur="stopTitleEdit"
                @keydown.enter.prevent="stopTitleEdit"
                @keydown.esc.prevent="stopTitleEdit"
                aria-label="Album title"
              />
              <p v-if="album?.description" class="text-sm text-gray-500 mt-1">{{ album.description }}</p>
            </div>
          </div>

          <GalleryPhotoUpload v-if="showUpload" :album-id="albumId" @uploaded="refreshGallery" />
          <GalleryPhotoGallery 
            ref="galleryRef" 
            :selection-mode="selectionMode"
            :current-layout="currentLayout"
            :album-id="albumId"
            @update:selection-mode="selectionMode = $event"
          />
        </CommonContainer>
      </div>
    </ion-content>
  </ion-page>
</template>
