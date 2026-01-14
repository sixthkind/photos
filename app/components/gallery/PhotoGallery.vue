<template>
  <div class="photo-gallery-wrapper">
    <!-- Header with Selection Mode Toggle and Actions -->
    <div v-if="!loading && unifiedItems.length > 0" class="layout-switcher flex justify-between items-center gap-2 mb-4">
      <div class="flex items-center gap-3">
        <!-- Selection Mode Toggle -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="selectionMode"
            class="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 font-medium">Select Mode</span>
        </label>
        
        <!-- Selected Count -->
        <div v-if="selectionMode && selectedPhotos.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-gray-600">{{ selectedPhotos.length }} selected</span>
          <button
            @click="clearSelection"
            class="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        
        <!-- Group Selected Button -->
        <button
          v-if="selectionMode && selectedPhotos.length >= 2"
          @click="openGroupModal"
          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <Icon name="heroicons:folder-plus" class="text-lg" />
          <span>Group Selected</span>
        </button>
      </div>
      
      <!-- Layout Switcher -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 mr-2">Layout:</span>
        <button
          v-for="layoutOption in layouts"
          :key="layoutOption.value"
          @click="currentLayout = layoutOption.value"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            currentLayout === layoutOption.value
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
          :title="layoutOption.description"
        >
          <Icon :name="layoutOption.icon" class="text-lg" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <Icon name="svg-spinners:ring-resize" class="text-4xl text-blue-500" />
    </div>

    <!-- Empty State -->
    <div v-else-if="unifiedItems.length === 0" class="text-center py-20">
      <p class="text-gray-500 text-lg">No photos yet. Upload your first photo above!</p>
    </div>

    <!-- Gallery Content -->
    <GalleryPhotoGridLayout
      v-else
      ref="gridLayout"
      :items="unifiedItems"
      :layout="currentLayout"
      :selection-mode="selectionMode"
      :selected-photos="selectedPhotos"
      :expanding-group-id="expandingGroupId"
      :expanded-group-ids="expandedGroups"
      @photo-click="handleItemClick"
      @toggle-selection="togglePhotoSelection"
    >
      <template #photo-overlay="{ item }">
        <!-- Overlay for photos -->
        <div
          v-if="!item.isGroup && !selectionMode"
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
        >
          <h3 v-if="item.title" class="text-white font-semibold text-lg mb-1">{{ item.title }}</h3>
          <p v-if="item.description" class="text-white/90 text-sm line-clamp-2">{{ item.description }}</p>
          
          <!-- Delete button -->
          <button
            @click.stop="confirmDelete(item)"
            class="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
            title="Delete photo"
          >
            <Icon name="heroicons:trash" class="text-xl" />
          </button>
        </div>
        
        <!-- Overlay for groups -->
        <div
          v-if="item.isGroup && !selectionMode"
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
        >
          <h3 v-if="item.title" class="text-white font-semibold text-lg mb-1">{{ item.title }}</h3>
          <p v-if="item.description" class="text-white/90 text-sm line-clamp-2">{{ item.description }}</p>
          <p class="text-white/80 text-xs mt-1">{{ item.photoCount }} photo{{ item.photoCount !== 1 ? 's' : '' }}</p>
        </div>
      </template>
      
      <template #photo-item="{ item, getPhotoUrl }">
        <!-- Group with stack effect (collapsed) -->
        <div v-if="item.isGroup && !item.isExpanded" class="relative">
          <div class="group-stack-container">
            <!-- Stack layers (reverse order so first layer is on top) -->
            <div
              v-for="(layer, index) in getStackLayers(item).reverse()"
              :key="layer.id"
              class="group-stack-layer"
              :style="{ 
                transform: `translate(${index * 4}px, ${index * 4}px) scale(${1 - index * 0.05})`,
                zIndex: 10 - index
              }"
            >
              <img
                :src="getPhotoUrl(layer, '500x500')"
                :alt="layer.title || 'Photo'"
                class="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>
          
          <!-- Photo count badge -->
          <div class="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold z-20">
            {{ item.photoCount }}
          </div>
          
          <!-- Expand indicator -->
          <div class="absolute bottom-3 left-3 bg-blue-500/80 text-white px-2 py-1 rounded text-xs font-semibold z-20 flex items-center gap-1">
            <Icon name="heroicons:chevron-down" class="text-sm" />
            <span>Click to expand</span>
          </div>
        </div>
        
        <!-- Regular photo (including photos from expanded groups) -->
        <div v-else class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group">
          <img
            :src="getPhotoUrl(item, '500x500')"
            :alt="item.title || 'Photo'"
            class="w-full h-auto object-cover"
            loading="lazy"
          />
          <!-- Collapse button for first photo in expanded group -->
          <button
            v-if="item.isGroupPhoto && isFirstPhotoInGroup(item)"
            @click.stop="toggleGroupExpansion(item.parentGroupId)"
            class="absolute top-3 left-3 bg-blue-500/90 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1"
            title="Collapse group"
          >
            <Icon name="heroicons:chevron-up" class="text-sm" />
            <span>Collapse</span>
          </button>
        </div>
      </template>
    </GalleryPhotoGridLayout>

    <!-- Lightbox Component -->
    <GalleryPhotoLightbox
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      :photos="allPhotosForLightbox"
      @close="closeLightbox"
      @navigate="navigatePhoto"
    />

    <!-- Group Modal -->
    <GalleryGroupModal
      :is-open="showGroupModal"
      :selected-photos="selectedPhotosData"
      @close="closeGroupModal"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script setup>
import { pb } from '#imports';
import { ref, computed, onMounted, watch, nextTick } from 'vue';

const photos = ref([]);
const groups = ref([]);
const loading = ref(true);
const selectedPhoto = ref(null);
const currentLayout = ref('grid');
const selectionMode = ref(false);
const selectedPhotos = ref([]);
const showGroupModal = ref(false);
const expandedGroups = ref(new Set()); // Track which groups are expanded
const expandingGroupId = ref(null); // Track which group is currently expanding
const gridLayout = ref(null); // Ref to the grid layout component

// Layout options
const layouts = [
  { 
    value: 'masonry', 
    icon: 'heroicons:squares-2x2', 
    description: 'Masonry layout - dynamic column heights' 
  },
  { 
    value: 'grid', 
    icon: 'heroicons:squares-plus', 
    description: 'Grid layout - equal height squares' 
  },
  { 
    value: 'tile', 
    icon: 'heroicons:rectangle-stack', 
    description: 'Tile layout - fixed height rectangles' 
  }
];

// Fetch photos and groups from PocketBase
const fetchPhotos = async () => {
  try {
    // Fetch all photos
    const allPhotos = await pb.collection('photos').getFullList({
      sort: '-created',
      expand: 'tags,group'
    });
    
    // Fetch groups with expanded relations
    const allGroups = await pb.collection('groups').getFullList({
      sort: '-created',
      expand: 'coverPhoto,photos,user'
    });
    
    groups.value = allGroups;
    
    // Filter out photos that are in groups
    photos.value = allPhotos.filter(photo => !photo.group);
  } catch (error) {
    console.error('Error fetching photos:', error);
  } finally {
    loading.value = false;
  }
};

// Create unified items array (photos + groups) sorted by creation date
const unifiedItems = computed(() => {
  const items = [];
  
  // Add photos that are not in groups
  if (photos.value && Array.isArray(photos.value)) {
    photos.value.forEach(photo => {
      items.push({
        ...photo,
        isGroup: false,
        created: photo.created
      });
    });
  }
  
  // Add groups as items
  if (groups.value && Array.isArray(groups.value)) {
    groups.value.forEach(group => {
      const coverPhoto = group.expand?.coverPhoto || 
                        (group.expand?.photos?.find(p => p.id === group.coverPhoto)) ||
                        (group.expand?.photos?.[0]);
      
      const groupItem = {
        id: group.id,
        title: group.title,
        description: group.description,
        photo: coverPhoto?.photo,
        isGroup: true,
        group: group,
        photoCount: group.expand?.photos?.length || group.photos?.length || 0,
        created: group.created,
        isExpanded: expandedGroups.value.has(group.id)
      };
      
      items.push(groupItem);
    });
  }
  
  // Sort by creation date (newest first)
  items.sort((a, b) => {
    const dateA = new Date(a.created);
    const dateB = new Date(b.created);
    return dateB - dateA;
  });
  
  // Build result: skip expanded groups, but include their photos
  const result = [];
  items.forEach(item => {
    // If this is an expanded group, skip it but add its photos
    if (item.isGroup && item.isExpanded && item.group?.expand?.photos) {
      item.group.expand.photos.forEach(photo => {
        result.push({
          ...photo,
          isGroup: false,
          isGroupPhoto: true,
          parentGroupId: item.id,
          created: photo.created || item.created
        });
      });
    } else {
      // Add regular items (photos and collapsed groups)
      result.push(item);
    }
  });
  
  return result;
});

// Get stack layers for group display (show up to 3 photos stacked)
const getStackLayers = (item) => {
  if (!item.isGroup || !item.group?.expand?.photos) return [];
  const photos = item.group.expand.photos;
  const coverPhotoId = item.group.coverPhoto;
  
  // Find cover photo and put it first
  const coverPhoto = photos.find(p => p.id === coverPhotoId);
  const otherPhotos = photos.filter(p => p.id !== coverPhotoId);
  
  // Return cover photo first, then up to 2 more photos
  const layers = coverPhoto ? [coverPhoto] : [];
  layers.push(...otherPhotos.slice(0, 2));
  
  return layers;
};

// All photos for lightbox navigation (includes photos from groups)
const allPhotosForLightbox = computed(() => {
  const allPhotosList = [...photos.value];
  
  // Add photos from groups
  groups.value.forEach(group => {
    if (group.expand?.photos) {
      allPhotosList.push(...group.expand.photos);
    }
  });
  
  return allPhotosList;
});

// Get selected photos data (full objects)
const selectedPhotosData = computed(() => {
  return photos.value.filter(p => selectedPhotos.value.includes(p.id));
});

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
  const allPhotos = allPhotosForLightbox.value;
  const currentIndex = allPhotos.findIndex(p => p.id === selectedPhoto.value.id);
  let newIndex;
  
  if (direction === 'next') {
    newIndex = (currentIndex + 1) % allPhotos.length;
  } else {
    newIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
  }
  
  selectedPhoto.value = allPhotos[newIndex];
};

// Toggle photo selection
const togglePhotoSelection = (item) => {
  // Only allow selecting photos, not groups
  if (item.isGroup) return;
  
  const index = selectedPhotos.value.indexOf(item.id);
  if (index > -1) {
    selectedPhotos.value.splice(index, 1);
  } else {
    selectedPhotos.value.push(item.id);
  }
};

// Clear expanded groups when selection mode changes
watch(selectionMode, (newValue) => {
  if (newValue) {
    // Clear expanded groups when entering selection mode
    expandedGroups.value.clear();
  }
});

// Clear selection
const clearSelection = () => {
  selectedPhotos.value = [];
};

// Open group modal
const openGroupModal = () => {
  if (selectedPhotos.value.length >= 2) {
    showGroupModal.value = true;
  }
};

// Close group modal
const closeGroupModal = () => {
  showGroupModal.value = false;
};

// Handle group created
const handleGroupCreated = () => {
  showGroupModal.value = false;
  selectionMode.value = false;
  selectedPhotos.value = [];
  refresh();
};

// Handle item click (photo or group)
const handleItemClick = (item) => {
  if (item.isGroup) {
    // Toggle group expansion
    toggleGroupExpansion(item.id);
  } else {
    // If there are expanded groups and this photo is not part of any expanded group, collapse all groups
    if (expandedGroups.value.size > 0) {
      const isPartOfExpandedGroup = item.isGroupPhoto && expandedGroups.value.has(item.parentGroupId);
      
      if (!isPartOfExpandedGroup) {
        // Collapse all groups
        expandedGroups.value.clear();
        expandingGroupId.value = null;
        return; // Don't open lightbox, just collapse
      }
    }
    
    // Open photo in lightbox
    openLightbox(item);
  }
};

// Toggle group expansion
const toggleGroupExpansion = async (groupId) => {
  if (expandedGroups.value.has(groupId)) {
    // Collapsing - just remove from set with smooth transition
    expandedGroups.value.delete(groupId);
    expandingGroupId.value = null;
    
    // Wait for DOM update and scroll to the collapsed group position
    await nextTick();
    setTimeout(() => {
      const groupElement = document.querySelector(`[data-item-id="${groupId}"]`);
      if (groupElement) {
        groupElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  } else {
    // Expanding - prepare animation
    expandingGroupId.value = groupId;
    
    // Find the group element before expansion
    await nextTick();
    const groupElement = document.querySelector(`[data-item-id="${groupId}"]`);
    if (groupElement && gridLayout.value?.prepareAnimation) {
      gridLayout.value.prepareAnimation(groupElement);
    }
    
    // Add to expanded groups
    expandedGroups.value.add(groupId);
    
    // Clear expanding flag after animation completes
    setTimeout(() => {
      expandingGroupId.value = null;
    }, 700);
  }
};

// Check if this is the first photo in an expanded group
const isFirstPhotoInGroup = (item) => {
  if (!item.isGroupPhoto || !item.parentGroupId) return false;
  
  const group = groups.value.find(g => g.id === item.parentGroupId);
  if (!group?.expand?.photos || group.expand.photos.length === 0) return false;
  
  // Check if this is the first photo in the group
  return group.expand.photos[0].id === item.id;
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
    // If photo is in a group, remove it from the group first
    if (photo.group) {
      const group = await pb.collection('groups').getOne(photo.group);
      const updatedPhotos = group.photos.filter(id => id !== photo.id);
      
      // Update group photos
      await pb.collection('groups').update(group.id, {
        photos: updatedPhotos
      });
      
      // If this was the cover photo, set a new one or clear it
      if (group.coverPhoto === photo.id) {
        const newCoverPhoto = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
        await pb.collection('groups').update(group.id, {
          coverPhoto: newCoverPhoto
        });
      }
    }
    
    await pb.collection('photos').delete(photo.id);
    photos.value = photos.value.filter(p => p.id !== photo.id);
    
    // Close lightbox if deleted photo was open
    if (selectedPhoto.value?.id === photo.id) {
      selectedPhoto.value = null;
    }
    
    // Refresh to update groups
    refresh();
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
.layout-switcher {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Masonry Layout for Groups */
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

/* Grid Layout for Groups */
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

/* Tile Layout for Groups */
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

/* Group Stack Effect */
.group-stack-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  transition: transform 0.3s ease;
}

.group-stack-container:hover {
  transform: translateY(-4px);
}

.group-stack-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  background: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.group-stack-container:hover .group-stack-layer {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.group-stack-layer:last-child {
  position: relative;
}

.group-stack-layer img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
</style>
