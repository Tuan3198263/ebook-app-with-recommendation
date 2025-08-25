<template>
  <div class="profile-favorites">
    <div class="card-header">
      <h5 class="mb-0"><i class="fas fa-heart me-2"></i>Sách yêu thích</h5>
    </div>

    <div class="card-body">
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải danh sách yêu thích...</p>
      </div>

      <div v-else-if="error" class="text-center my-5">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
        <p class="text-danger">{{ error }}</p>
        <button class="btn btn-primary" @click="fetchFavorites">
          <i class="fas fa-redo me-1"></i>Thử lại
        </button>
      </div>

      <div v-else-if="favorites.length === 0" class="text-center my-5">
        <i class="fas fa-heart-broken fa-3x mb-3 text-muted"></i>
        <p>Bạn chưa có sách yêu thích nào.</p>
        <router-link to="/" class="btn btn-primary">
          <i class="fas fa-search me-1"></i>Khám phá sách ngay
        </router-link>
      </div>

      <div v-else>
        <!-- Products Grid -->
        <div class="favorites-grid">
          <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            <div v-for="favorite in favorites" :key="favorite._id" class="col">
              <div class="favorite-item-wrapper">
                <!-- Remove Button (X icon) ở góc trái -->
                <button
                  class="remove-favorite-btn"
                  @click="removeFavorite(favorite.book._id)"
                  :disabled="removingId === favorite.book._id"
                  title="Bỏ yêu thích"
                  aria-label="Bỏ yêu thích"
                >
                  <!-- Spinner luôn sẵn sàng, chỉ show khi loading -->
                  <i
                    class="fas fa-spinner fa-spin"
                    v-show="removingId === favorite.book._id"
                  ></i>
                  <!-- X icon luôn sẵn sàng, chỉ show khi không loading -->
                  <i
                    class="fas fa-times"
                    v-show="removingId !== favorite.book._id"
                  ></i>
                </button>

                <!-- Book Card -->
                <div class="book-card-container">
                  <BookCard :book="favorite.book" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-center mt-4" v-if="totalPages > 1">
          <ProductPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import favoriteService from "@/services/favoriteService";
import BookCard from "@/components/common/BookCard.vue";
import ProductPagination from "@/components/category/ProductPagination.vue";

const toast = useToast();

// State
const favorites = ref([]);
const totalPages = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const error = ref(null);
const removingId = ref(null);
const limit = 6;

// Methods
const fetchFavorites = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await favoriteService.getFavoriteBooks(
      currentPage.value,
      limit
    );

    if (response.success) {
      favorites.value = response.data;
      totalPages.value = response.totalPages;
      currentPage.value = response.currentPage;
    } else {
      throw new Error(response.message || "Không thể tải danh sách yêu thích");
    }
  } catch (err) {
    error.value = err.message || "Có lỗi xảy ra khi tải danh sách yêu thích";
    console.error("Error fetching favorites:", err);
  } finally {
    loading.value = false;
  }
};

const removeFavorite = async (bookId) => {
  if (removingId.value) return;

  try {
    removingId.value = bookId;
    const response = await favoriteService.removeFavorite(bookId);

    if (response.success) {
      toast.success("Đã xóa khỏi danh sách yêu thích!");

      // Refetch data để cập nhật chính xác
      await fetchFavorites();

      // Kiểm tra nếu trang hiện tại không có data và không phải trang đầu
      // thì chuyển về trang trước
      if (favorites.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1;
        await fetchFavorites();
      }
    } else {
      throw new Error(
        response.message || "Không thể xóa khỏi danh sách yêu thích"
      );
    }
  } catch (err) {
    console.error("Error removing favorite:", err);
    toast.error(err.message || "Không thể xóa khỏi danh sách yêu thích");
  } finally {
    removingId.value = null;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const formatDate = (dateString) => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
};

// Watch for page changes
watch(
  () => currentPage.value,
  () => {
    fetchFavorites();
  }
);

// Lifecycle
onMounted(() => {
  fetchFavorites();
});
</script>

<style scoped>
.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  padding: 1rem 1.25rem;
}

.card-body {
  padding: 1.5rem;
}

.favorites-grid {
  margin-bottom: 2rem;
}

.book-card-container {
  flex: 1;
  overflow: hidden;
}

.favorite-item-wrapper {
  position: relative;
  height: 100%;
}

.remove-favorite-btn {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 32px;
  height: 32px;
  background: rgba(220, 53, 69, 0.9);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  z-index: 10;
  transition: all 0.3s ease;
  opacity: 0;
  visibility: hidden;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.favorite-item-wrapper:hover .remove-favorite-btn {
  opacity: 1;
  visibility: visible;
}

.remove-favorite-btn:hover:not(:disabled) {
  background: rgba(220, 53, 69, 1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.remove-favorite-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.remove-favorite-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
  opacity: 1;
  visibility: visible;
}

/* Loading states */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Empty state */
.fa-heart-broken {
  color: #dc3545;
}

/* Favorite heart icon animation */
@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
}

.favorite-info .fa-heart {
  animation: heartBeat 1.5s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }

  .favorites-grid .row {
    --bs-gutter-x: 1rem;
    --bs-gutter-y: 1rem;
  }

  .favorite-actions {
    padding: 0.25rem;
    gap: 0.5rem;
  }

  .remove-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
  }

  .remove-favorite-btn {
    opacity: 0.8;
    visibility: visible;
    top: 0.5rem;
    left: 0.5rem;
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
}

@media (max-width: 576px) {
  .remove-favorite-btn {
    top: 0.5rem;
    left: 0.5rem;
    width: 26px;
    height: 26px;
    font-size: 0.7rem;
  }
}

/* Animation cho remove button */
@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.favorite-item-wrapper:hover .remove-favorite-btn {
  animation: fadeInScale 0.2s ease-out;
}

/* Pulse effect for loading state */
.remove-favorite-btn:disabled .fa-spinner {
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
</style>
