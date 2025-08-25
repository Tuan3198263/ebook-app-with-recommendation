<!-- filepath: d:\LuanVan\frontend\src\components\common\BookCard.vue -->
<template>
  <div class="book-card" @click="navigateToBook">
    <div class="book-card-content">
      <!-- Ảnh bìa sách -->
      <div class="book-cover">
        <img
          :src="book.coverImages?.[0] || '/placeholder-book.jpg'"
          :alt="book.title"
          class="cover-image"
        />
        <!-- Badge nổi bật -->
        <div class="badges" v-if="book.featured">
          <span class="badge badge-featured">
            <i class="fas fa-star"></i>
          </span>
        </div>
      </div>

      <!-- Thông tin sách -->
      <div class="book-info">
        <!-- Tiêu đề -->
        <h3 class="book-title" :title="book.title">
          {{ book.title }}
        </h3>

        <!-- Đánh giá -->
        <div class="book-rating">
          <div class="stars">
            <i
              v-for="n in 5"
              :key="n"
              class="fas fa-star"
              :class="
                n <= Math.round(book.averageRating || 0)
                  ? 'text-warning'
                  : 'text-muted'
              "
            ></i>
          </div>
        </div>

        <!-- Giá -->
        <div class="book-price" v-if="lowestPrice !== null">
          <span class="price-label">Chỉ từ</span>
          <span class="price-value">{{ formatPrice(lowestPrice) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

// Computed để tìm giá thấp nhất
const lowestPrice = computed(() => {
  if (
    !props.book.ebookOptions ||
    !Array.isArray(props.book.ebookOptions) ||
    props.book.ebookOptions.length === 0
  ) {
    return null;
  }

  const prices = props.book.ebookOptions
    .map((option) => option.price)
    .filter((price) => price !== undefined && price !== null);

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
});

// Methods
const formatPrice = (price) => {
  if (!price || price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const navigateToBook = () => {
  if (props.book.slug) {
    router.push(`/book/${props.book.slug}`);
  }
};
</script>

<style scoped>
.book-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.book-card:hover {
  transform: translateY(-2px);
}

.book-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-cover {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.book-cover:hover .cover-image {
  transform: scale(1.1);
}

.badges {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
}

.badge-featured {
  background: linear-gradient(45deg, #f39c12, #e67e22);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.book-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.book-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  color: #2c3e50;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.stars {
  display: flex;
  gap: 0.125rem;
}

.stars .fa-star.text-muted {
  color: #e9ecef !important;
}

.stars .fa-star.text-warning {
  color: #ffc107 !important;
}

.book-price {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.price-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.price-value {
  font-size: 1rem;
  font-weight: 700;
  color: #dc3545;
}
</style>
