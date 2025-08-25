<!-- filepath: d:\LuanVan\frontend\src\components\book\BookImages.vue -->
<template>
  <div class="book-images">
    <!-- Main image -->
    <div class="main-image">
      <img
        :src="currentImage || defaultImage"
        :alt="title"
        @error="handleImageError"
        class="main-img"
      />
    </div>

    <!-- Thumbnail images -->
    <div v-if="images && images.length > 1" class="thumbnail-list">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="thumbnail"
        :class="{ active: currentImage === image }"
        @click="currentImage = image"
      >
        <img
          :src="image"
          :alt="`${title} - Ảnh ${index + 1}`"
          @error="handleThumbnailError($event, index)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";

export default {
  name: "BookImages",
  props: {
    images: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: "Sách",
    },
  },
  setup(props) {
    const currentImage = ref(null);
    const defaultImage = "/images/default-book-cover.jpg";

    // Set initial image
    watch(
      () => props.images,
      (newImages) => {
        if (newImages && newImages.length > 0) {
          currentImage.value = newImages[0];
        } else {
          currentImage.value = defaultImage;
        }
      },
      { immediate: true }
    );

    const handleImageError = (event) => {
      event.target.src = defaultImage;
    };

    const handleThumbnailError = (event, index) => {
      event.target.style.display = "none";
    };

    return {
      currentImage,
      defaultImage,
      handleImageError,
      handleThumbnailError,
    };
  },
};
</script>

<style scoped>
.book-images {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.main-image {
  width: 100%;
  max-width: 400px;
  height: 500px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

.main-img:hover {
  transform: scale(1.02);
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.thumbnail {
  width: 60px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail:hover {
  border-color: #007bff;
}

.thumbnail.active {
  border-color: #007bff;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 768px) {
  .main-image {
    max-width: 300px;
    height: 375px;
  }

  .thumbnail {
    width: 50px;
    height: 65px;
  }
}

@media (max-width: 480px) {
  .main-image {
    max-width: 250px;
    height: 315px;
  }

  .thumbnail {
    width: 45px;
    height: 60px;
  }
}
</style>
