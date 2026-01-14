<script setup>
import { ref } from 'vue';

definePageMeta({
  middleware: "auth"
});

const galleryRef = ref(null);

const refreshGallery = () => {
  if (galleryRef.value) {
    galleryRef.value.refresh();
  }
};
</script>

<template>
  <ion-page>
    <ion-content>
      <CommonContainer>
        <GalleryPhotoUpload @uploaded="refreshGallery" />
        <GalleryPhotoGallery ref="galleryRef" />
      </CommonContainer>
    </ion-content>
  </ion-page>
</template>
