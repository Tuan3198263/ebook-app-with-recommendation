<!-- filepath: d:\LuanVan\frontend\src\components\category\ProductGrid.vue -->
<template>
  <div class="product-grid">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="row">
        <div v-for="n in 6" :key="n" class="col-lg-4 col-md-6 col-6 mb-4">
          <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-line-long"></div>
              <div class="skeleton-line skeleton-line-medium"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="books.length === 0" class="empty-state">
      <div class="empty-content">
        <i class="fas fa-search fa-3x text-muted mb-3"></i>
        <h4>Không tìm thấy sách nào</h4>
        <p class="text-muted">
          Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
        </p>
      </div>
    </div>

    <!-- Books grid -->
    <div v-else>
      <div class="row">
        <div
          v-for="book in books"
          :key="book._id"
          class="col-lg-4 col-md-6 col-6 mb-4"
        >
          <BookCard :book="book" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BookCard from "../common/BookCard.vue";

const props = defineProps({
  books: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.product-grid {
  min-height: 400px;
}

/* Loading skeleton */
.skeleton-card {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 3/4;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.skeleton-line-long {
  width: 90%;
}

.skeleton-line-medium {
  width: 70%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Empty state */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

/* Mobile responsive adjustments */
@media (max-width: 576px) {
  .product-grid {
    padding: 0 0.5rem;
  }

  .skeleton-content {
    padding: 0.75rem;
  }

  .empty-content h4 {
    font-size: 1.25rem;
  }

  .empty-content p {
    font-size: 0.875rem;
  }
}
</style>
