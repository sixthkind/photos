<template>
  <div class="photo-gallery-wrapper">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <ion-spinner name="crescent"></ion-spinner>
    </div>

    <!-- Empty State -->
    <div v-else-if="photos.length === 0" class="text-center py-20">
      <p class="text-gray-500 text-lg">No photos yet. Upload your first photo above!</p>
    </div>

    <!-- Photo Gallery -->
    <div v-else class="masonry-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="masonry-item group cursor-pointer"
        @click="openLightbox(photo)"
      >
        <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
          <img
            :src="getPhotoUrl(photo, '500x500')"
            :alt="photo.title || 'Photo'"
            class="w-full h-auto object-cover"
            loading="lazy"
          />
          
          <!-- Overlay with title/description on hover -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 v-if="photo.title" class="text-white font-semibold text-lg mb-1">{{ photo.title }}</h3>
            <p v-if="photo.description" class="text-white/90 text-sm line-clamp-2">{{ photo.description }}</p>
            
            <!-- Delete button -->
            <button
              @click.stop="confirmDelete(photo)"
              class="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
              title="Delete photo"
            >
              <ion-icon name="trash-outline" class="text-xl"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Component -->
    <GalleryPhotoLightbox
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :photos="photos"
      @close="closeLightbox"
      @navigate="navigatePhoto"
    />
  </div>
</template>

<script setup>
import { pb } from '#imports';
import { ref, onMounted } from 'vue';

const photos = ref([]);
const loading = ref(true);
const selectedPhoto = ref(null);

// Fetch photos from PocketBase
const fetchPhotos = async () => {
  try {
    const records = await pb.collection('photos').getFullList({
      sort: '-created',
      expand: 'tags'
    });
    photos.value = records;
  } catch (error) {
    console.error('Error fetching photos:', error);
  } finally {
    loading.value = false;
  }
};

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '500x500') => {
  return pb.files.getUrl(photo, photo.photo, { thumb });
};

// Open lightbox
const openLightbox = (photo) => {
  selectedPhoto.value = photo;
};

// Close lightbox
const closeLightbox = () => {
  selectedPhoto.value = null;
};

// Navigate between photos in lightbox
const navigatePhoto = (direction) => {
  const currentIndex = photos.value.findIndex(p => p.id === selectedPhoto.value.id);
  let newIndex;
  
  if (direction === 'next') {
    newIndex = (currentIndex + 1) % photos.value.length;
  } else {
    newIndex = (currentIndex - 1 + photos.value.length) % photos.value.length;
  }
  
  selectedPhoto.value = photos.value[newIndex];
};

// Confirm delete with Ionic alert
const confirmDelete = async (photo) => {
  const alert = document.createElement('ion-alert');
  alert.header = 'Delete Photo';
  alert.message = `Are you sure you want to delete ${photo.title || 'this photo'}?`;
  alert.buttons = [
    {
      text: 'Cancel',
      role: 'cancel'
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => deletePhoto(photo)
    }
  ];
  
  document.body.appendChild(alert);
  await alert.present();
};

// Delete photo
const deletePhoto = async (photo) => {
  try {
    await pb.collection('photos').delete(photo.id);
    photos.value = photos.value.filter(p => p.id !== photo.id);
    
    // Close lightbox if deleted photo was open
    if (selectedPhoto.value?.id === photo.id) {
      selectedPhoto.value = null;
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
};

// Refresh gallery (called from parent)
const refresh = () => {
  loading.value = true;
  fetchPhotos();
};

// Expose refresh method to parent
defineExpose({ refresh });

onMounted(() => {
  fetchPhotos();
});
</script>

<style scoped>
.masonry-grid {
  column-count: 1;
  column-gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (min-width: 1024px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (min-width: 1280px) {
  .masonry-grid {
    column-count: 4;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
