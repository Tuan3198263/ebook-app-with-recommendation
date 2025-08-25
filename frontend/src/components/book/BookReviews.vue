<template>
  <div class="book-reviews">
    <div v-if="loading" class="review-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>
    <div v-else>
      <!-- Hiển thị tổng quan đánh giá -->
      <div class="review-summary mb-4">
        <div class="d-flex align-items-center">
          <div class="ms-3">
            <div class="star-display">
              <template v-for="i in 5" :key="i">
                <i
                  :class="[
                    'fas fa-star',
                    i <= Math.round(averageRating)
                      ? 'text-warning'
                      : 'text-muted',
                  ]"
                ></i>
              </template>
            </div>
            <div class="review-count">{{ totalReviews }} đánh giá</div>
          </div>
        </div>
      </div>

      <!-- Nút đánh giá sách -->
      <div v-if="!showForm" class="text-end mb-4">
        <button
          v-if="canReview"
          @click="showForm = true"
          class="btn btn-primary"
        >
          <i class="fas fa-star me-1"></i>
          Đánh giá sách này
        </button>
      </div>

      <!-- Review Form - hiển thị khi click nút đánh giá -->
      <div v-if="showForm" class="review-form-container">
        <div v-if="formLoading" class="review-loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>

        <div v-else>
          <!-- Form đánh giá -->
          <form
            v-if="canReview"
            @submit.prevent="handleSubmit"
            class="review-form"
          >
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="m-0">Viết đánh giá của bạn</h5>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="showForm = false"
              >
                <i class="fas fa-times"></i> Đóng
              </button>
            </div>
            <!-- Star Rating -->
            <div class="mb-3">
              <label class="form-label">Đánh giá sách này</label>
              <div class="rating-select">
                <select
                  v-model="rating"
                  class="form-select"
                  aria-label="Chọn đánh giá"
                >
                  <option value="5">5 sao - Xuất sắc</option>
                  <option value="4">4 sao - Rất tốt</option>
                  <option value="3">3 sao - Tốt</option>
                  <option value="2">2 sao - Trung bình</option>
                  <option value="1">1 sao - Kém</option>
                </select>
              </div>
              <!-- Đã xóa hiển thị số sao ở đây -->
              <small class="text-danger" v-if="errors.rating">{{
                errors.rating
              }}</small>
            </div>

            <!-- Review Content -->
            <div class="mb-3">
              <label for="reviewContent" class="form-label"
                >Nhận xét của bạn (không bắt buộc)</label
              >
              <textarea
                id="reviewContent"
                v-model="content"
                class="form-control"
                rows="5"
                placeholder="Chia sẻ ý kiến của bạn về sách..."
              ></textarea>
              <small class="text-danger" v-if="errors.content">{{
                errors.content
              }}</small>
              <small class="text-muted d-block mt-1">Tối đa 300 ký tự</small>
            </div>

            <!-- Submit Button -->
            <div class="text-end">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="submitting"
              >
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Đăng đánh giá
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Thông báo không có đánh giá -->
      <div v-if="reviews.length === 0" class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        Chưa có đánh giá nào cho sách này.
      </div>

      <!-- Danh sách đánh giá -->
      <div v-else class="review-items">
        <div v-for="review in reviews" :key="review._id" class="review-item">
          <div class="review-header">
            <div class="user-info">
              <img
                :src="review.user.avatar || 'https://via.placeholder.com/40'"
                alt="User Avatar"
                class="user-avatar"
              />
              <div>
                <div class="user-name">{{ review.user.name }}</div>
                <div class="review-date">
                  {{ formatDate(review.createdAt) }}
                </div>
              </div>
            </div>
            <div class="review-rating">
              <template v-for="star in 5" :key="star">
                <i
                  :class="[
                    'fas fa-star',
                    star <= review.rating ? 'text-warning' : 'text-muted',
                  ]"
                ></i>
              </template>
            </div>
          </div>

          <div v-if="review.content" class="review-content mt-2">
            {{ review.content }}
          </div>
        </div>
      </div>

      <!-- Phân trang -->
      <!-- Phân trang đã bị loại bỏ -->
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from "vue";
import { useToast } from "vue-toastification";
import reviewService from "../../services/reviewService";
import bookService from "../../services/bookService";
import { useAuthStore } from "../../store/authStore";

export default {
  name: "BookReviews",
  props: {
    bookId: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },

  setup(props) {
    const toast = useToast();

    // Biến ReviewList
    const loading = ref(true);
    const reviews = ref([]);
    const showForm = ref(false);

    const book = ref({
      _id: props.bookId,
      averageRating: props.averageRating,
      totalReviews: props.totalReviews,
      title: "sách này",
    }); // Biến ReviewForm
    const formLoading = ref(true);
    const submitting = ref(false);
    const rating = ref(5); // Đặt giá trị mặc định là 5 sao
    const content = ref("");
    const errors = ref({});
    const canReview = ref(false);
    const eligibilityMessage = ref(""); // Phân trang đã bị loại bỏ    // Không cần reviewId vì đã loại bỏ chức năng chỉnh sửa đánh giá

    const formatDate = (dateString) => {
      try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      } catch (error) {
        return dateString;
      }
    };

    const checkEligibility = async () => {
      try {
        formLoading.value = true;
        const authStore = useAuthStore();

        if (!authStore.isLoggedIn) {
          canReview.value = false;
          return;
        }

        const response = await reviewService.checkReviewEligibility(
          props.bookId
        );
        if (response.data.success) {
          canReview.value = response.data.canReview;
          eligibilityMessage.value = response.data.reason || "";
        } else {
          toast.error("Không thể kiểm tra quyền đánh giá");
        }
      } catch (error) {
        console.error("Error checking review eligibility:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          canReview.value = false;
        } else {
          toast.error("Đã xảy ra lỗi khi kiểm tra quyền đánh giá");
        }
      } finally {
        formLoading.value = false;
      }
    }; // Đã xóa hàm setRating và isStarActive vì không cần thiết nữa
    // Sử dụng v-model trực tiếp với select

    const validateForm = () => {
      errors.value = {};
      if (!rating.value || rating.value < 1 || rating.value > 5) {
        errors.value.rating = "Vui lòng chọn số sao đánh giá (1-5)";
      }
      if (content.value && content.value.length > 300) {
        errors.value.content = "Nội dung đánh giá không được quá 300 ký tự";
      }
      return Object.keys(errors.value).length === 0;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;

      const reviewData = {
        rating: rating.value,
        content: content.value,
      };

      try {
        submitting.value = true;
        const response = await reviewService.createReview(
          props.bookId,
          reviewData
        );
        if (response.data.success) {
          toast.success("Đăng đánh giá thành công!");
          showForm.value = false;
          canReview.value = false; // Cập nhật lại trạng thái không thể đánh giá sau khi đã đánh giá
          loadReviews();
          checkEligibility(); // Kiểm tra lại quyền đánh giá từ server để đồng bộ
        } else {
          toast.error(response.data.message || "Có lỗi xảy ra");
        }
      } catch (error) {
        console.error("Error submitting review:", error);
        toast.error(
          error.response?.data?.message || "Đã xảy ra lỗi khi gửi đánh giá"
        );
      } finally {
        submitting.value = false;
      }
    };

    const loadReviews = async () => {
      try {
        loading.value = true;
        const response = await reviewService.getBookReviews(props.bookId);

        if (response.data.success) {
          reviews.value = response.data.data;
          book.value.totalReviews = response.data.total;
          book.value.averageRating = props.averageRating || 0;
        } else {
          toast.error("Không thể tải đánh giá");
        }
      } catch (error) {
        console.error("Error loading reviews:", error);
        toast.error("Đã xảy ra lỗi khi tải đánh giá");
      } finally {
        loading.value = false;
        // Kiểm tra quyền đánh giá sau khi tải xong danh sách
        checkEligibility();
      }
    }; // Watch rating changes for logging only
    watch(rating, (newValue) => {
      console.log("Rating changed to:", newValue);
    });

    watch(
      () => props.bookId,
      () => {
        loadReviews();
      }
    );
    onMounted(async () => {
      book.value = {
        _id: props.bookId,
        title: "",
        averageRating: props.averageRating,
        totalReviews: props.totalReviews,
      };

      try {
        const response = await bookService.getBookDetailById(props.bookId);
        if (response && response.data) {
          book.value = { ...book.value, ...response.data };
        }
      } catch (error) {
        console.error("Error loading book details:", error);
      } // loadReviews() sẽ tự gọi checkEligibility khi hoàn thành
      loadReviews();
    });
    return {
      loading,
      reviews,
      get totalReviews() {
        return book.value.totalReviews;
      },
      get averageRating() {
        return book.value.averageRating;
      },
      book,
      formatDate,
      showForm,
      formLoading,
      submitting,
      rating,
      content,
      errors,
      canReview,
      eligibilityMessage,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
/* Styles cho ReviewList */
.book-reviews {
  margin-top: 3rem;
}

.review-list-container {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #dee2e6;
}

.review-loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.review-section-title {
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.review-summary {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.star-display {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.review-count {
  color: #6c757d;
  font-size: 0.9rem;
}

.review-items {
  margin-top: 2rem;
}

.review-item {
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
}

.review-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.review-content {
  white-space: pre-line;
  color: #212529;
}

/* Styles cho ReviewForm */
.review-form-container {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.rating-select {
  margin-bottom: 0.75rem;
}

/* Đã xóa CSS cho rating-display không còn cần thiết */

.form-select {
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #ced4da;
  cursor: pointer;
  background-color: #fff;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.text-warning {
  color: #ffc107 !important;
}
</style>
