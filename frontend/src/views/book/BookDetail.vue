<!-- filepath: d:\LuanVan\frontend\src\views\book\BookDetail.vue -->
<template>
  <div class="book-detail">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Đang tải thông tin sách...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <h3>Có lỗi xảy ra</h3>
        <p>{{ error }}</p>
        <button @click="fetchBookDetail" class="retry-btn">Thử lại</button>
      </div>
    </div>

    <!-- Book content -->
    <div v-else-if="book" class="book-content">
      <!-- Section 1: Book Images & Info -->
      <div class="book-overview">
        <BookImages :images="book.coverImages" :title="book.title" />
        <BookInfo :book="book" @add-to-cart="handleAddToCart" />
      </div>
      <!-- Section 2: Book Description -->
      <BookDescription :description="book.description" :book="book" />

      <!-- Section 3: Book Reviews -->
      <BookReviews
        :book-id="book._id"
        :average-rating="book.averageRating"
        :total-reviews="book.totalReviews"
      />
    </div>

    <!-- Book Recommendations Section -->
    <div class="recommendations-wrapper">
      <BookRecommendations />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import bookService from "../../services/bookService";
import recentlyViewedService from "../../services/recentlyViewedService";
import BookImages from "../../components/book/BookImages.vue";
import BookInfo from "../../components/book/BookInfo.vue";
import BookDescription from "../../components/book/BookDescription.vue";
import BookReviews from "../../components/book/BookReviews.vue";
import BookRecommendations from "../../components/recommendations/BookRecommendations.vue";

export default {
  name: "BookDetail",
  components: {
    BookImages,
    BookInfo,
    BookDescription,
    BookReviews,
    BookRecommendations,
  },
  props: {
    slug: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const authStore = useAuthStore();
    const book = ref(null);
    const loading = ref(true);
    const error = ref(null);

    // Tracking variables
    const viewStartTime = ref(null);
    const interactionScore = ref(0);
    const scrollDepth = ref(0);
    const maxScrollDepth = ref(0);
    const isPageVisible = ref(true);

    const fetchBookDetail = async () => {
      try {
        loading.value = true;
        error.value = null;
        const response = await bookService.getBookDetail(props.slug);
        book.value = response.data;

        // Update page title
        if (book.value) {
          document.title = `${book.value.title} - Thư viện trực tuyến`;

          // Chỉ lưu lịch sử xem cho người dùng đã đăng nhập
          if (authStore.isLoggedIn) {
            // Bắt đầu tracking thời gian xem
            viewStartTime.value = Date.now();
            // Bắt đầu với interaction score = 1 (base viewing score)
            interactionScore.value = 1;

            // Setup scroll tracking
            setupScrollTracking();
            setupVisibilityTracking();
          }
        }
      } catch (err) {
        console.error("Error fetching book detail:", err);
        error.value =
          err.response?.data?.message || "Không thể tải thông tin sách";
      } finally {
        loading.value = false;
      }
    };

    const trackBookView = async () => {
      if (
        !book.value ||
        !book.value._id ||
        !authStore.isLoggedIn ||
        !viewStartTime.value
      )
        return;

      try {
        // Tính thời gian xem (milliseconds)
        const duration = Date.now() - viewStartTime.value;

        // Tính điểm dựa trên hành vi thực tế
        calculateInteractionScore(duration);

        // Giới hạn interactionScore trước khi gửi
        const finalScore = Math.max(1, Math.min(5, interactionScore.value));

        const result = await recentlyViewedService.trackBookView(
          book.value._id,
          duration,
          finalScore
        );

        if (result && result.success) {
          console.log("Đã ghi lại lượt xem sách:", book.value.title, {
            durationSeconds: `${Math.round(duration / 1000)}s`,
            durationMs: `${duration}ms`,
            interactionScore: finalScore,
            maxScrollDepth: `${maxScrollDepth.value}%`,
          });
        }
      } catch (error) {
        // Không hiển thị lỗi cho user, chỉ log để debug
        console.warn("Không thể ghi lại lượt xem:", error.message);
      }
    };

    // Tính điểm dựa trên hành vi thực tế của user
    const calculateInteractionScore = (duration) => {
      let behaviorScore = 1; // Base score cho behavior

      // +1 điểm cho mỗi 30 giây xem (tối đa +3)
      const timeBonus = Math.min(3, Math.floor(duration / 30000));
      behaviorScore += timeBonus;

      // +1 điểm nếu scroll > 50% trang (user đọc nhiều nội dung)
      if (maxScrollDepth.value > 50) {
        behaviorScore += 1;
      }

      // +1 điểm nếu scroll > 80% trang (user đọc gần hết)
      if (maxScrollDepth.value > 80) {
        behaviorScore += 1;
      }

      // Bonus cho thời gian xem dài và scroll sâu (user thực sự quan tâm)
      if (duration > 120000 && maxScrollDepth.value > 70) {
        // 2 phút + scroll 70%
        behaviorScore += 1;
      }

      // MERGE behavior score với action score (không override!)
      // Nếu đã có action score (add to cart), giữ score cao nhất
      const currentActionScore =
        interactionScore.value > behaviorScore ? interactionScore.value : 0;

      // ĐẢM BẢO KHÔNG BAO GIỜ VƯỢT QUÁ 5 ĐIỂM
      interactionScore.value = Math.min(
        5,
        Math.max(behaviorScore, currentActionScore)
      );
    };

    // Setup scroll depth tracking
    const setupScrollTracking = () => {
      const handleScroll = () => {
        if (!isPageVisible.value) return;

        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const currentScrollDepth = Math.round((scrollTop / scrollHeight) * 100);

        scrollDepth.value = currentScrollDepth;
        maxScrollDepth.value = Math.max(
          maxScrollDepth.value,
          currentScrollDepth
        );
      };

      window.addEventListener("scroll", handleScroll);

      // Cleanup function
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    };

    // Setup page visibility tracking (không tính thời gian khi user không xem)
    const setupVisibilityTracking = () => {
      const handleVisibilityChange = () => {
        isPageVisible.value = !document.hidden;

        if (!isPageVisible.value) {
          // User rời khỏi tab/window - tạm dừng tracking
          console.log("User left page, pausing tracking");
        } else {
          // User quay lại - tiếp tục tracking
          console.log("User returned, resuming tracking");
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    };

    // Tăng interaction score cho hành động add to cart (chỉ dùng cho add to cart)
    const increaseInteractionScore = (points = 5) => {
      if (authStore.isLoggedIn && viewStartTime.value) {
        // GIỚI HẠN TỔNG ĐIỂM KHÔNG QUÁ 5
        interactionScore.value = Math.min(5, interactionScore.value + points);
        console.log(
          `🔥 Interaction score increased by ${points}, total: ${interactionScore.value} (max: 5)`
        );
      }
    };

    const handleAddToCart = (ebookOption) => {
      // Tăng interaction score khi thêm vào giỏ hàng (strong signal)
      increaseInteractionScore(5);

      console.log("Adding to cart:", ebookOption);

      // TODO: Implement add to cart functionality
    };

    // Watch for route changes
    watch(
      () => props.slug,
      () => {
        fetchBookDetail();
      },
      { immediate: true }
    );

    onMounted(() => {
      fetchBookDetail();
    });

    // Track khi user rời khỏi trang
    onUnmounted(() => {
      if (authStore.isLoggedIn && viewStartTime.value) {
        trackBookView();
      }

      // Cleanup event listeners
      const cleanupScroll = setupScrollTracking();
      const cleanupVisibility = setupVisibilityTracking();
      if (cleanupScroll) cleanupScroll();
      if (cleanupVisibility) cleanupVisibility();
    });

    return {
      book,
      loading,
      error,
      fetchBookDetail,
      handleAddToCart,
      // increaseInteractionScore chỉ dùng internally cho add to cart
    };
  },
};
</script>

<style scoped>
.book-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.error-message {
  text-align: center;
  background: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.error-message h3 {
  color: #dc3545;
  margin-bottom: 10px;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
}

.retry-btn:hover {
  background: #0056b3;
}

.book-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.recommendations-wrapper {
  margin: 2rem 0;
  padding: 2rem;
}

@media (max-width: 768px) {
  .book-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .book-detail {
    padding: 15px;
  }
}
</style>
