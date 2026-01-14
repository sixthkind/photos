<template>
  <Teleport to="body">
    <div
      v-if="photo"
      class="lightbox-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      @click.self="close"
    >
      <!-- Close Button -->
      <button
        @click="close"
        class="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors duration-200"
        aria-label="Close"
      >
        <Icon name="heroicons:x-mark" class="text-4xl" />
      </button>

      <!-- Previous Button -->
      <button
        v-if="photos.length > 1"
        @click.stop="navigate('prev')"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors duration-200 bg-black/50 rounded-full p-3"
        aria-label="Previous photo"
      >
        <Icon name="heroicons:chevron-left" class="text-3xl" />
      </button>

      <!-- Next Button -->
      <button
        v-if="photos.length > 1"
        @click.stop="navigate('next')"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors duration-200 bg-black/50 rounded-full p-3"
        aria-label="Next photo"
      >
        <Icon name="heroicons:chevron-right" class="text-3xl" />
      </button>

      <!-- Image Container -->
      <div class="relative max-w-7xl max-h-screen w-full h-full flex flex-col items-center justify-center p-4">
        <!-- Image -->
        <div class="flex-grow flex items-center justify-center w-full mb-4">
          <img
            :src="getPhotoUrl(photo, '1200x0')"
            :alt="photo.title || 'Photo'"
            class="max-w-full max-h-[calc(100vh-200px)] object-contain"
            @click.stop
          />
        </div>

        <!-- Photo Info -->
        <div
          v-if="photo.title || photo.description"
          class="bg-black/70 backdrop-blur-sm rounded-lg p-4 max-w-2xl w-full"
          @click.stop
        >
          <h2 v-if="photo.title" class="text-white text-2xl font-bold mb-2">
            {{ photo.title }}
          </h2>
          <p v-if="photo.description" class="text-white/90 text-base">
            {{ photo.description }}
          </p>
          <div class="flex items-center gap-4 mt-3 text-sm text-white/70">
            <span>{{ formatDate(photo.created) }}</span>
            <span v-if="photos.length > 1">
              {{ currentIndex + 1 }} / {{ photos.length }}
            </span>
          </div>
        </div>
        
        <!-- Photo counter when no title/description -->
        <div
          v-else-if="photos.length > 1"
          class="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2"
          @click.stop
        >
          <span class="text-white text-sm">
            {{ currentIndex + 1 }} / {{ photos.length }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { pb } from '#imports';
import { computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  photo: {
    type: Object,
    required: true
  },
  photos: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'navigate']);

// Get current photo index
const currentIndex = computed(() => {
  return props.photos.findIndex(p => p.id === props.photo.id);
});

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '1200x0') => {
  return pb.files.getUrl(photo, photo.photo, { thumb });
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Close lightbox
const close = () => {
  emit('close');
};

// Navigate to next/previous photo
const navigate = (direction) => {
  emit('navigate', direction);
};

// Keyboard navigation
const handleKeydown = (e) => {
  switch (e.key) {
    case 'Escape':
      close();
      break;
    case 'ArrowLeft':
      if (props.photos.length > 1) {
        navigate('prev');
      }
      break;
    case 'ArrowRight':
      if (props.photos.length > 1) {
        navigate('next');
      }
      break;
  }
};

// Prevent body scroll when lightbox is open
const preventScroll = (e) => {
  e.preventDefault();
};

onMounted(() => {
  // Add keyboard listener
  window.addEventListener('keydown', handleKeydown);
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  document.addEventListener('touchmove', preventScroll, { passive: false });
});

onUnmounted(() => {
  // Remove keyboard listener
  window.removeEventListener('keydown', handleKeydown);
  
  // Restore body scroll
  document.body.style.overflow = '';
  document.removeEventListener('touchmove', preventScroll);
});
</script>

<style scoped>
.lightbox-overlay {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

img {
  animation: scaleIn 0.2s ease-in-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
