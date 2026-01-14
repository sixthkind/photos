<template>
  <div class="photo-grid-wrapper">
    <!-- Masonry Layout -->
    <div v-if="layout === 'masonry'" class="masonry-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="masonry-item group cursor-pointer"
        @click="handlePhotoClick(photo)"
      >
        <slot name="photo-item" :photo="photo" :getPhotoUrl="getPhotoUrl">
          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <img
              :src="getPhotoUrl(photo, '500x500')"
              :alt="photo.title || 'Photo'"
              class="w-full h-auto object-cover"
              loading="lazy"
            />
            <slot name="photo-overlay" :photo="photo"></slot>
          </div>
        </slot>
      </div>
    </div>

    <!-- Grid Layout -->
    <div v-else-if="layout === 'grid'" class="grid-layout">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="grid-item group cursor-pointer"
        @click="handlePhotoClick(photo)"
      >
        <slot name="photo-item" :photo="photo" :getPhotoUrl="getPhotoUrl">
          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 aspect-square">
            <img
              :src="getPhotoUrl(photo, '500x500')"
              :alt="photo.title || 'Photo'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <slot name="photo-overlay" :photo="photo"></slot>
          </div>
        </slot>
      </div>
    </div>

    <!-- Tile Layout -->
    <div v-else-if="layout === 'tile'" class="tile-layout">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="tile-item group cursor-pointer"
        @click="handlePhotoClick(photo)"
      >
        <slot name="photo-item" :photo="photo" :getPhotoUrl="getPhotoUrl">
          <div class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-64">
            <img
              :src="getPhotoUrl(photo, '500x500')"
              :alt="photo.title || 'Photo'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <slot name="photo-overlay" :photo="photo"></slot>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pb } from '#imports';

const props = defineProps({
  photos: {
    type: Array,
    required: true,
    default: () => []
  },
  layout: {
    type: String,
    default: 'masonry',
    validator: (value) => ['masonry', 'grid', 'tile'].includes(value)
  }
});

const emit = defineEmits(['photo-click']);

// Get photo URL with thumbnail
const getPhotoUrl = (photo, thumb = '500x500') => {
  return pb.files.getUrl(photo, photo.photo, { thumb });
};

// Handle photo click
const handlePhotoClick = (photo) => {
  emit('photo-click', photo);
};
</script>

<style scoped>
/* Masonry Layout */
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

/* Grid Layout - Equal height items */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .grid-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .grid-layout {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.grid-item {
  position: relative;
}

/* Tile Layout - Larger fixed height tiles */
.tile-layout {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .tile-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .tile-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .tile-layout {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.tile-item {
  position: relative;
}

/* Common styles */
.aspect-square {
  aspect-ratio: 1 / 1;
}
</style>
