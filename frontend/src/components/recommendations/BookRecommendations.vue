<template>
  <div class="recommendation-section">
    <!-- Header -->
    <div class="section-header">
      <h2 class="section-title">
        <i class="fas fa-heart text-danger me-2"></i>
        Có thể bạn sẽ thích
      </h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="d-flex justify-content-center align-items-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <span class="ms-3">Đang tìm sách phù hợp với bạn...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <div class="alert alert-warning text-center">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>
    </div>

    <!-- Carousel -->
    <div v-else-if="books.length > 0" class="carousel-wrapper">
      <button class="scroll-btn left" @click="scrollLeft">
        <i class="fas fa-chevron-left"></i>
      </button>

      <div class="scroll-container" ref="scrollRef">
        <div class="book-card" v-for="book in books" :key="book._id">
          <RecommendationBookCard :book="book" />
        </div>
      </div>

      <button class="scroll-btn right" @click="scrollRight">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <div class="text-center py-5">
        <i class="fas fa-book-open fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">Chưa có sách gợi ý</h4>
        <p class="text-muted">
          Hãy khám phá thư viện để chúng tôi hiểu sở thích của bạn!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { featuredService } from "../../services/recomendationService.js";
import RecommendationBookCard from "./RecommendationBookCard.vue";
import { useAuthStore } from "../../store/authStore.js";

// Props
const props = defineProps({
  limit: {
    type: Number,
    default: 10,
  },
});

// State
const books = ref([]);
const loading = ref(false);
const error = ref(null);
const responseType = ref(null);
const scrollRef = ref(null);

const authStore = useAuthStore();
const fetchRecommendedBooks = async () => {
  loading.value = true;
  error.value = null;

  try {
    let response;
    if (!authStore.isLoggedIn) {
      // Nếu chưa đăng nhập, gọi getFeaturedBooks
      response = await featuredService.getFeaturedBooks(props.limit);
    } else {
      // Nếu đã đăng nhập, gọi getRecommendedBooks
      response = await featuredService.getRecommendedBooks(props.limit);
    }

    if (response.success) {
      books.value = response.data || [];
      responseType.value = response.type;

      // Ghi log các sách + điểm score
      books.value.forEach((book) => {
        const titleShort =
          book.title.length > 30 ? book.title.slice(0, 30) + "..." : book.title;
        console.log(`📚 ${titleShort} | Score: ${book.score}`);
      });
    } else {
      error.value = response.message || "Không thể tải danh sách sách gợi ý";
    }
  } catch (err) {
    console.error("Lỗi khi tải sách gợi ý:", err);
    error.value = "Có lỗi xảy ra khi tải sách gợi ý. Vui lòng thử lại sau.";
  } finally {
    loading.value = false;
  }
};

// Scroll controls
const scrollLeft = () => {
  scrollRef.value?.scrollBy({ left: -216, behavior: "smooth" });
};
const scrollRight = () => {
  scrollRef.value?.scrollBy({ left: 216, behavior: "smooth" });
};

// Mounted
onMounted(fetchRecommendedBooks);

// Cho phép cha gọi lại hàm này
defineExpose({
  refresh: fetchRecommendedBooks,
});
</script>

<style scoped>
.recommendation-section {
  margin: 2rem 0;
}

.section-header {
  text-align: left;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.loading-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  margin: 2rem 0;
}

.empty-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== Carousel styles ===== */
.carousel-wrapper {
  position: relative;
  overflow: hidden;
  margin-top: 2rem;
}

.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  gap: 1rem;
  padding-bottom: 1rem;
  scrollbar-width: none;
}
.scroll-container::-webkit-scrollbar {
  display: none;
}

.book-card {
  flex: 0 0 auto;
  width: 200px;
  transition: transform 0.3s;
}
.book-card:hover {
  transform: translateY(-4px);
}

.scroll-btn {
  position: absolute;
  top: 40%;
  transform: translateY(-50%);
  background-color: #ffffffcc;
  border: none;
  padding: 0.75rem;
  cursor: pointer;
  z-index: 10;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.scroll-btn.left {
  left: -10px;
}
.scroll-btn.right {
  right: -10px;
}

/* Responsive fix */
@media (max-width: 1200px) {
  .book-card {
    width: 180px;
  }
}
@media (max-width: 768px) {
  .book-card {
    width: 150px;
  }
}
@media (max-width: 480px) {
  .book-card {
    width: 130px;
  }
}
</style>
