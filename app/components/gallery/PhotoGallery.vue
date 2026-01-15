<template>
  <div class="photo-gallery-wrapper">
    <!-- Selection Actions Bar (shown when in selection mode) -->
    <div v-if="!loading && unifiedItems.length > 0 && selectionMode" class="selection-actions-wrapper">
      <div class="selection-actions flex items-center gap-3 p-3 bg-white bg-opacity-70 backdrop-blur rounded-lg shadow-sm border border-gray-200">
      <!-- Selected Count -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">{{ selectedPhotos.length }} selected</span>
      </div>
      
      <!-- Group Selected Button (only in select mode) -->
      <button
        v-if="!isEditMode && selectedPhotos.length >= 2"
        @click="openGroupModal"
        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:folder-plus" class="text-lg" />
        <span>Group</span>
      </button>
      
      <!-- Add to Group Button (when external photos are selected) -->
      <button
        v-if="isEditMode && hasPhotosOutsideGroup && selectedPhotos.length > 0"
        @click="addPhotosToGroup"
        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:folder-plus" class="text-lg" />
        <span>Add to Group</span>
      </button>
      
      <!-- Remove from Group Button (when only internal photos are selected) -->
      <button
        v-if="isEditMode && !hasPhotosOutsideGroup && selectedPhotos.length > 0"
        @click="removePhotosFromGroup"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:trash" class="text-lg" />
        <span>Remove from Group</span>
      </button>
      
      <!-- Delete Selected Photos Button (only in select mode, not edit mode) -->
      <button
        v-if="!isEditMode && selectedPhotos.length > 0"
        @click="confirmDeleteSelected"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:trash" class="text-lg" />
        <span>Delete</span>
      </button>
      
      <!-- Delete Group Button (only in edit mode when a group is expanded, and no photos from group are selected) -->
      <button
        v-if="isEditMode && currentExpandedGroupId && selectedPhotosInGroup.length === 0"
        @click="confirmDeleteGroup"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <Icon name="heroicons:trash" class="text-lg" />
        <span>Delete Group</span>
      </button>

      <button
          v-if="selectedPhotos.length > 0"
          @click="clearSelection"
          class="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
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
    <div v-else class="gallery-grid-shell">
      <div
        v-if="expandedGroups.size > 0"
        class="gallery-dismiss-zone gallery-dismiss-zone--top"
        @click="collapseAllGroups"
        aria-hidden="true"
      ></div>
      <GalleryPhotoGridLayout
        ref="gridLayout"
        :items="unifiedItems"
        :layout="props.currentLayout"
        :selection-mode="props.selectionMode"
        :selected-photos="selectedPhotos"
        :expanding-group-id="expandingGroupId"
      :expanded-group-ids="expandedGroups"
      :is-edit-mode="isEditMode"
      :current-expanded-group-id="currentExpandedGroupId"
      @photo-click="handleItemClick"
      @toggle-selection="togglePhotoSelection"
      @reorder="reorderItems"
    >
      <template #photo-overlay="{ item }">
        <!-- Overlay for photos -->
        <div
          v-if="!item.isGroup && !props.selectionMode"
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
          v-if="item.isGroup && !props.selectionMode"
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
        </div>
        
        <!-- Regular photo (including photos from expanded groups) -->
        <div v-else :class="['relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group', props.selectionMode && isEditMode && item.isGroupPhoto && item.parentGroupId === currentExpandedGroupId ? 'edit-mode-glow' : '']">
          <img
            :src="getPhotoUrl(item, '500x500')"
            :alt="item.title || 'Photo'"
            class="w-full h-auto object-cover"
            loading="lazy"
          />
          
          <!-- Selection Checkbox -->
          <div
            v-if="props.selectionMode && !item.isGroup"
            class="absolute top-3 left-3 z-10"
            @click.stop="togglePhotoSelection(item)"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                selectedPhotos.includes(item.id)
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white/90 border-white hover:bg-white'
              ]"
            >
              <Icon
                v-if="selectedPhotos.includes(item.id)"
                name="heroicons:check"
                class="text-white text-sm"
              />
            </div>
          </div>
        </div>
      </template>
      </GalleryPhotoGridLayout>
      <div
        v-if="expandedGroups.size > 0"
        class="gallery-dismiss-zone gallery-dismiss-zone--bottom"
        @click="collapseAllGroups"
        aria-hidden="true"
      ></div>
    </div>

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

const props = defineProps({
  selectionMode: {
    type: Boolean,
    default: false
  },
  currentLayout: {
    type: String,
    default: 'grid',
    validator: (value) => ['masonry', 'grid', 'tile'].includes(value)
  }
});

const emit = defineEmits(['update:selectionMode']);

// Use shared gallery state
const { selectedPhotos } = useGalleryState();

const photos = ref([]);
const groups = ref([]);
const loading = ref(true);
const selectedPhoto = ref(null);
const showGroupModal = ref(false);
const expandedGroups = ref(new Set()); // Track which groups are expanded
const expandingGroupId = ref(null); // Track which group is currently expanding
const gridLayout = ref(null); // Ref to the grid layout component

const setItemSortOrder = (itemId, isGroup, sortOrder) => {
  const targetList = isGroup ? groups.value : photos.value;
  const itemIndex = targetList.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return;
  targetList[itemIndex] = { ...targetList[itemIndex], sortOrder };
};

const setGroupPhotoSortOrder = (groupId, photoId, sortOrder) => {
  const groupIndex = groups.value.findIndex(group => group.id === groupId);
  if (groupIndex === -1) return;
  const group = groups.value[groupIndex];
  if (!group.expand?.photos) return;
  const photoIndex = group.expand.photos.findIndex(photo => photo.id === photoId);
  if (photoIndex === -1) return;
  const updatedPhotos = [...group.expand.photos];
  updatedPhotos[photoIndex] = { ...updatedPhotos[photoIndex], sortOrder };
  groups.value[groupIndex] = {
    ...group,
    expand: {
      ...group.expand,
      photos: updatedPhotos
    }
  };
};

const ensureSortOrder = async (items) => {
  const missing = items.filter(item => typeof item.sortOrder !== 'number');
  if (missing.length === 0) return;

  const withOrder = items.filter(item => typeof item.sortOrder === 'number');
  const step = 1000;
  const missingSorted = [...missing].sort((a, b) => new Date(b.created) - new Date(a.created));

  let updates = [];
  if (withOrder.length === 0) {
    updates = missingSorted.map((item, index) => ({
      item,
      sortOrder: index * step
    }));
  } else {
    const minOrder = Math.min(...withOrder.map(item => item.sortOrder));
    const missingCount = missingSorted.length;
    updates = missingSorted.map((item, index) => ({
      item,
      sortOrder: minOrder - step * (missingCount - index)
    }));
  }

  await Promise.all(updates.map(async ({ item, sortOrder }) => {
    try {
      const collectionName = item.isGroup ? 'groups' : 'photos';
      await pb.collection(collectionName).update(item.id, { sortOrder });
      setItemSortOrder(item.id, item.isGroup, sortOrder);
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  }));
};

const normalizeSortOrder = async (items) => {
  if (!items || items.length === 0) return;
  const numericOrders = items
    .map(item => item.sortOrder)
    .filter(order => typeof order === 'number');
  const uniqueOrders = new Set(numericOrders);
  if (numericOrders.length === items.length && uniqueOrders.size === items.length) return;

  const step = 1000;
  const sortedItems = [...items].sort((a, b) => new Date(b.created) - new Date(a.created));
  await Promise.all(sortedItems.map(async (item, index) => {
    const sortOrder = index * step;
    try {
      const collectionName = item.isGroup ? 'groups' : 'photos';
      await pb.collection(collectionName).update(item.id, { sortOrder });
      setItemSortOrder(item.id, item.isGroup, sortOrder);
    } catch (error) {
      console.error('Error normalizing sort order:', error);
    }
  }));
};

const ensureGroupPhotoSortOrder = async () => {
  const step = 1000;
  const updates = [];

  groups.value.forEach(group => {
    const photosInGroup = group.expand?.photos || [];
    if (photosInGroup.length === 0) return;

    const missing = photosInGroup.filter(photo => typeof photo.sortOrder !== 'number');
    const numericOrders = photosInGroup
      .map(photo => photo.sortOrder)
      .filter(order => typeof order === 'number');
    const uniqueOrders = new Set(numericOrders);
    const needsNormalize = numericOrders.length !== photosInGroup.length || uniqueOrders.size !== photosInGroup.length;

    if (missing.length === 0 && !needsNormalize) return;

    const sortedPhotos = [...photosInGroup].sort((a, b) => new Date(a.created) - new Date(b.created));
    sortedPhotos.forEach((photo, index) => {
      updates.push({
        groupId: group.id,
        photoId: photo.id,
        sortOrder: index * step
      });
    });
  });

  if (updates.length === 0) return;

  await Promise.all(updates.map(async ({ groupId, photoId, sortOrder }) => {
    try {
      await pb.collection('photos').update(photoId, { sortOrder });
      setGroupPhotoSortOrder(groupId, photoId, sortOrder);
    } catch (error) {
      console.error('Error updating group photo sort order:', error);
    }
  }));
};

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

    const itemsForOrdering = [
      ...photos.value.map(photo => ({ ...photo, isGroup: false })),
      ...groups.value.map(group => ({ ...group, isGroup: true }))
    ];
    await ensureSortOrder(itemsForOrdering);
    await normalizeSortOrder(itemsForOrdering);
    await ensureGroupPhotoSortOrder();
  } catch (error) {
    console.error('Error fetching photos:', error);
  } finally {
    loading.value = false;
  }
};

// Check if we're in edit mode (only one specific group is expanded, not all groups)
const isEditMode = computed(() => {
  // Edit mode is when exactly one group is expanded and not all groups
  if (expandedGroups.value.size === 0) return false;
  if (expandedGroups.value.size === groups.value.length && groups.value.length > 1) return false;
  return expandedGroups.value.size === 1;
});

// Get the currently expanded group ID (for edit mode)
const currentExpandedGroupId = computed(() => {
  if (isEditMode.value && expandedGroups.value.size === 1) {
    return Array.from(expandedGroups.value)[0];
  }
  return null;
});

const baseItems = computed(() => {
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
        sortOrder: group.sortOrder,
        isExpanded: expandedGroups.value.has(group.id)
      };
      
      items.push(groupItem);
    });
  }
  return items;
});

const orderedBaseItems = computed(() => {
  const items = [...baseItems.value];
  items.sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
    if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;
    return new Date(b.created) - new Date(a.created);
  });
  return items;
});

// Create unified items array (photos + groups) based on manual order
const unifiedItems = computed(() => {
  // Build result: skip expanded groups, but include their photos
  const result = [];
  orderedBaseItems.value.forEach(item => {
    // If this is an expanded group, skip it but add its photos
    if (item.isGroup && item.isExpanded && item.group?.expand?.photos) {
      const groupPhotos = [...item.group.expand.photos].sort((a, b) => {
        const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
        const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
        if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        return new Date(a.created) - new Date(b.created);
      });
      groupPhotos.forEach(photo => {
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

// Get selected photos data (full objects) - includes photos from groups
const selectedPhotosData = computed(() => {
  const selected = [];
  
  // Add standalone photos
  selected.push(...photos.value.filter(p => selectedPhotos.value.includes(p.id)));
  
  // Add photos from expanded groups
  groups.value.forEach(group => {
    if (group.expand?.photos) {
      const groupPhotos = group.expand.photos.filter(p => selectedPhotos.value.includes(p.id));
      selected.push(...groupPhotos);
    }
  });
  
  return selected;
});

// Check which selected photos are inside vs outside the expanded group (for edit mode)
const selectedPhotosInGroup = computed(() => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return [];
  
  const currentGroup = groups.value.find(g => g.id === currentExpandedGroupId.value);
  if (!currentGroup) return [];
  
  return selectedPhotos.value.filter(photoId => 
    currentGroup.photos?.includes(photoId)
  );
});

const selectedPhotosOutsideGroup = computed(() => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return [];
  
  return selectedPhotos.value.filter(photoId => 
    !selectedPhotosInGroup.value.includes(photoId)
  );
});

// Determine if we should show "Add to Group" or "Remove from Group" button
const hasPhotosOutsideGroup = computed(() => {
  return isEditMode.value && selectedPhotosOutsideGroup.value.length > 0;
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

const lastSelectedPhotoId = ref(null);

const clearSelectionState = () => {
  selectedPhotos.value = [];
  lastSelectedPhotoId.value = null;
};

// Toggle photo selection
const togglePhotoSelection = (payload) => {
  const { item, shiftKey } = payload?.item ? payload : { item: payload, shiftKey: false };
  // Only allow selecting photos, not groups
  if (item.isGroup) return;
  
  if (shiftKey && lastSelectedPhotoId.value) {
    const selectableIds = unifiedItems.value
      .filter(candidate => !candidate.isGroup)
      .map(candidate => candidate.id);
    const startIndex = selectableIds.indexOf(lastSelectedPhotoId.value);
    const endIndex = selectableIds.indexOf(item.id);
    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const rangeIds = selectableIds.slice(from, to + 1);
      const selectionSet = new Set(selectedPhotos.value);
      rangeIds.forEach(id => selectionSet.add(id));
      selectedPhotos.value = Array.from(selectionSet);
      lastSelectedPhotoId.value = item.id;
      return;
    }
  }

  const index = selectedPhotos.value.indexOf(item.id);
  if (index > -1) {
    selectedPhotos.value.splice(index, 1);
  } else {
    selectedPhotos.value.push(item.id);
  }
  lastSelectedPhotoId.value = item.id;
};

const reorderItems = async ({ sourceId, targetId, groupId }) => {
  if (!props.selectionMode) return;
  if (!sourceId || !targetId || sourceId === targetId) return;

  if (groupId) {
    if (!isEditMode.value || currentExpandedGroupId.value !== groupId) return;
    const group = groups.value.find(item => item.id === groupId);
    const groupPhotos = group?.expand?.photos || [];
    const orderedGroupPhotos = [...groupPhotos].sort((a, b) => {
      const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : null;
      const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : null;
      if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
      if (aOrder !== null) return -1;
      if (bOrder !== null) return 1;
      return new Date(a.created) - new Date(b.created);
    });
    const ids = orderedGroupPhotos.map(photo => photo.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, sourceId);

    const prevId = ids[toIndex - 1];
    const nextId = ids[toIndex + 1];
    const prevItem = prevId ? orderedGroupPhotos.find(photo => photo.id === prevId) : null;
    const nextItem = nextId ? orderedGroupPhotos.find(photo => photo.id === nextId) : null;
    const prevOrder = typeof prevItem?.sortOrder === 'number' ? prevItem.sortOrder : null;
    const nextOrder = typeof nextItem?.sortOrder === 'number' ? nextItem.sortOrder : null;

    let newOrder = 0;
    if (prevOrder === null && nextOrder === null) {
      newOrder = 0;
    } else if (prevOrder === null) {
      newOrder = nextOrder - 1000;
    } else if (nextOrder === null) {
      newOrder = prevOrder + 1000;
    } else {
      newOrder = prevOrder + (nextOrder - prevOrder) / 2;
    }

    setGroupPhotoSortOrder(groupId, sourceId, newOrder);
    try {
      await pb.collection('photos').update(sourceId, { sortOrder: newOrder });
    } catch (error) {
      console.error('Error updating group photo sort order:', error);
    }
    return;
  }

  const ids = orderedBaseItems.value.map(item => item.id);
  const fromIndex = ids.indexOf(sourceId);
  const toIndex = ids.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, sourceId);

  const sourceItem = baseItems.value.find(item => item.id === sourceId);
  if (!sourceItem) return;

  const prevId = ids[toIndex - 1];
  const nextId = ids[toIndex + 1];
  const prevItem = prevId ? baseItems.value.find(item => item.id === prevId) : null;
  const nextItem = nextId ? baseItems.value.find(item => item.id === nextId) : null;
  const prevOrder = typeof prevItem?.sortOrder === 'number' ? prevItem.sortOrder : null;
  const nextOrder = typeof nextItem?.sortOrder === 'number' ? nextItem.sortOrder : null;

  let newOrder = 0;
  if (prevOrder === null && nextOrder === null) {
    newOrder = 0;
  } else if (prevOrder === null) {
    newOrder = nextOrder - 1000;
  } else if (nextOrder === null) {
    newOrder = prevOrder + 1000;
  } else {
    newOrder = prevOrder + (nextOrder - prevOrder) / 2;
  }

  setItemSortOrder(sourceId, sourceItem.isGroup, newOrder);
  try {
    const collectionName = sourceItem.isGroup ? 'groups' : 'photos';
    await pb.collection(collectionName).update(sourceId, { sortOrder: newOrder });
  } catch (error) {
    console.error('Error updating sort order:', error);
  }
};

// Handle group expansion when selection mode changes
watch(() => props.selectionMode, (newValue, oldValue) => {
  if (!newValue) {
    // When exiting selection/edit mode, clear selection
    clearSelectionState();
    // Don't collapse groups - let them stay as they are
  }
});

// Clear selection
const clearSelection = () => {
  clearSelectionState();
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
  emit('update:selectionMode', false);
  clearSelectionState();
  refresh();
};

// Handle item click (photo or group)
const handleItemClick = (item) => {
  if (item.isGroup) {
    // In selection mode, don't allow toggling groups
    if (props.selectionMode) {
      return;
    }
    
    // If there are expanded groups and this group is not one of them, collapse all groups
    if (expandedGroups.value.size > 0 && !expandedGroups.value.has(item.id)) {
      // Collapse all groups
      expandedGroups.value.clear();
      expandingGroupId.value = null;
      return; // Don't expand the clicked group, just collapse
    }
    
    // Toggle group expansion
    toggleGroupExpansion(item.id);
  } else {
    // In selection mode, clicking photos is handled by the grid layout (toggles selection)
    if (props.selectionMode) {
      return;
    }
    
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

// Collapse all groups (called when clicking margins)
const collapseAllGroups = () => {
  expandedGroups.value.clear();
  expandingGroupId.value = null;
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

// Confirm delete selected photos
const confirmDeleteSelected = async () => {
  if (selectedPhotos.value.length === 0) return;
  
  const photoCount = selectedPhotos.value.length;
  const alert = document.createElement('ion-alert');
  alert.header = 'Delete Photos';
  alert.message = `Are you sure you want to delete ${photoCount} photo${photoCount !== 1 ? 's' : ''}? This action cannot be undone.`;
  alert.buttons = [
    {
      text: 'Cancel',
      role: 'cancel'
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => deleteSelectedPhotos()
    }
  ];
  
  document.body.appendChild(alert);
  await alert.present();
};

// Delete multiple selected photos
const deleteSelectedPhotos = async () => {
  if (selectedPhotos.value.length === 0) return;
  
  try {
    const photosToDelete = selectedPhotosData.value;
    
    // Delete each photo
    for (const photo of photosToDelete) {
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
      
      // Delete the photo
      await pb.collection('photos').delete(photo.id);
    }
    
    // Update local state
    photos.value = photos.value.filter(p => !selectedPhotos.value.includes(p.id));
    
    // Close lightbox if deleted photo was open
    if (selectedPhoto.value && selectedPhotos.value.includes(selectedPhoto.value.id)) {
      selectedPhoto.value = null;
    }
    
    // Clear selection
    clearSelectionState();
    
    // Refresh to update groups
    refresh();
  } catch (error) {
    console.error('Error deleting selected photos:', error);
  }
};

// Add photos to group (Edit Mode)
const addPhotosToGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value || selectedPhotos.value.length === 0) {
    return;
  }

  try {
    const groupId = currentExpandedGroupId.value;
    const group = await pb.collection('groups').getOne(groupId);
    
    // Add all selected photos to the group (combine existing and new)
    const updatedPhotos = [...new Set([...group.photos, ...selectedPhotos.value])];
    
    // Update group photos
    await pb.collection('groups').update(groupId, {
      photos: updatedPhotos
    });
    
    // Update the photos to add the group reference
    for (const photoId of selectedPhotos.value) {
      await pb.collection('photos').update(photoId, {
        group: groupId
      });
    }
    
    // Clear selection and exit selection mode
    clearSelectionState();
    emit('update:selectionMode', false);
    
    // Refresh to update the gallery
    refresh();
  } catch (error) {
    console.error('Error adding photos to group:', error);
  }
};

// Remove photos from group (Edit Mode)
const removePhotosFromGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value || selectedPhotos.value.length === 0) {
    return;
  }

  try {
    const groupId = currentExpandedGroupId.value;
    const group = await pb.collection('groups').getOne(groupId);
    
    // Filter out the selected photos from the group
    const updatedPhotos = group.photos.filter(id => !selectedPhotos.value.includes(id));
    
    // Update group photos
    await pb.collection('groups').update(groupId, {
      photos: updatedPhotos
    });
    
    // If the cover photo was removed, set a new one or clear it
    if (selectedPhotos.value.includes(group.coverPhoto)) {
      const newCoverPhoto = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
      await pb.collection('groups').update(groupId, {
        coverPhoto: newCoverPhoto
      });
    }
    
    // Update the photos to remove the group reference
    for (const photoId of selectedPhotos.value) {
      await pb.collection('photos').update(photoId, {
        group: ''
      });
    }
    
    // Clear selection and exit selection mode
    clearSelectionState();
    emit('update:selectionMode', false);
    
    // Refresh to update the gallery
    refresh();
  } catch (error) {
    console.error('Error removing photos from group:', error);
  }
};

// Confirm delete group
const confirmDeleteGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return;
  
  const group = groups.value.find(g => g.id === currentExpandedGroupId.value);
  if (!group) return;
  
  const alert = document.createElement('ion-alert');
  alert.header = 'Delete Group';
  alert.message = `Are you sure you want to delete the group "${group.title || 'Untitled Group'}"? This will remove all photos from the group and delete it.`;
  alert.buttons = [
    {
      text: 'Cancel',
      role: 'cancel'
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => deleteGroup()
    }
  ];
  
  document.body.appendChild(alert);
  await alert.present();
};

// Delete group (removes all photos from group and deletes the group)
const deleteGroup = async () => {
  if (!isEditMode.value || !currentExpandedGroupId.value) return;
  
  try {
    const groupId = currentExpandedGroupId.value;
    const group = await pb.collection('groups').getOne(groupId);
    
    // Remove group reference from all photos in the group
    if (group.photos && group.photos.length > 0) {
      for (const photoId of group.photos) {
        await pb.collection('photos').update(photoId, {
          group: ''
        });
      }
    }
    
    // Delete the group
    await pb.collection('groups').delete(groupId);
    
    // Clear selection and exit selection mode
    clearSelectionState();
    emit('update:selectionMode', false);
    
    // Collapse the group (it's now deleted)
    expandedGroups.value.clear();
    
    // Refresh to update the gallery
    refresh();
  } catch (error) {
    console.error('Error deleting group:', error);
  }
};

// Refresh gallery (called from parent)
const refresh = () => {
  loading.value = true;
  fetchPhotos();
};

// Expose methods and state to parent
defineExpose({ 
  refresh,
  expandedGroups,
  collapseAllGroups 
});

onMounted(() => {
  fetchPhotos();
});
</script>

<style scoped>
.selection-actions-wrapper {
  position: sticky;
  top: calc(env(safe-area-inset-top, 0px) + 5.5rem); /* Account for navbar height + safe area */
  z-index: 999;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 1rem;
}

.gallery-grid-shell {
  position: relative;
  padding: 2rem 0;
}

.gallery-dismiss-zone {
  position: absolute;
  left: 0;
  right: 0;
  height: 2rem;
  cursor: pointer;
}

.gallery-dismiss-zone--top {
  top: -0.75rem;
  height: 2.75rem;
}

.gallery-dismiss-zone--bottom {
  bottom: 0;
}

.selection-actions {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Masonry Layout for Groups */
.masonry-grid {
  column-count: 2;
  column-gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    column-count: 3;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .grid-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .tile-layout {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  aspect-ratio: 1 / 1;
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
  height: 100%;
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
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

/* Glowing box shadow for photos in expanded group when in edit mode */
.edit-mode-glow {
  box-shadow: 0 0 8px rgba(255, 100, 255, 0.5), 0 0 15px rgba(255, 100, 255, 0.3);
}
</style>
