<template>
  <div class="profile-recently-viewed">
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="fas fa-history me-2"></i>Đã xem gần đây</h5>
        <button
          v-if="recentlyViewed.length > 0"
          class="btn btn-outline-danger btn-sm"
          @click="clearAllHistory"
        >
          <i class="fas fa-spinner fa-spin me-1" v-if="clearingAll"></i>
          <i class="fas fa-trash me-1" v-else></i>
          Xóa tất cả
        </button>
      </div>
    </div>

    <div class="card-body">
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải lịch sử xem...</p>
      </div>

      <div v-else-if="error" class="text-center my-5">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
        <p class="text-danger">{{ error }}</p>
        <button class="btn btn-primary" @click="fetchRecentlyViewed">
          <i class="fas fa-redo me-1"></i>Thử lại
        </button>
      </div>

      <div v-else-if="recentlyViewed.length === 0" class="text-center my-5">
        <i class="fas fa-eye-slash fa-3x mb-3 text-muted"></i>
        <p>Bạn chưa xem sách nào gần đây.</p>
        <router-link to="/" class="btn btn-primary">
          <i class="fas fa-search me-1"></i>Khám phá sách ngay
        </router-link>
      </div>

      <div v-else>
        <!-- Products Grid -->
        <div class="recently-viewed-grid">
          <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            <div v-for="item in recentlyViewed" :key="item._id" class="col">
              <div class="recently-viewed-item-wrapper">
                <!-- Book Card -->
                <div class="book-card-container">
                  <BookCard :book="item.bookId" />
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
import { ref, onMounted, watch, nextTick } from "vue";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import recentlyViewedService from "@/services/recentlyViewedService";
import BookCard from "@/components/common/BookCard.vue";
import ProductPagination from "@/components/category/ProductPagination.vue";

// State
const recentlyViewed = ref([]);
const totalPages = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const error = ref(null);
const clearingAll = ref(false);
const limit = 6;

// Methods
const fetchRecentlyViewed = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await recentlyViewedService.getHistory(
      currentPage.value,
      limit
    );

    if (response.success) {
      recentlyViewed.value = response.data;
      totalPages.value = response.totalPages;
      currentPage.value = response.currentPage;
    } else {
      throw new Error(response.message || "Không thể tải lịch sử xem");
    }
  } catch (err) {
    error.value = err.message || "Có lỗi xảy ra khi tải lịch sử xem";
    console.error("Error fetching recently viewed:", err);
  } finally {
    loading.value = false;
  }
};

const clearAllHistory = async () => {
  if (clearingAll.value) return;

  // Xác nhận trước khi xóa
  const result = await Swal.fire({
    title: "Xóa toàn bộ lịch sử xem?",
    text: "Hành động này không thể hoàn tác!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Xóa tất cả",
    cancelButtonText: "Hủy bỏ",
    returnFocus: false, // Rất quan trọng
  });

  if (!result.isConfirmed) return;

  try {
    clearingAll.value = true;

    const response = await recentlyViewedService.clearAllHistory();

    if (response.success) {
      // ✅ Hiển thị thông báo trước khi thay đổi UI
      await Swal.fire({
        title: "Thành công!",
        text: "Đã xóa toàn bộ lịch sử xem!",
        icon: "success",
        showConfirmButton: false,
        timer: 1500,
        returnFocus: false,
      });

      // ✅ Cập nhật UI sau khi Swal đóng
      recentlyViewed.value = [];
      totalPages.value = 0;
      currentPage.value = 1;
    } else {
      throw new Error(response.message || "Không thể xóa lịch sử xem");
    }
  } catch (err) {
    console.error("Error clearing history:", err);

    await Swal.fire({
      title: "Lỗi!",
      text: err.message || "Không thể xóa lịch sử xem",
      icon: "error",
      confirmButtonColor: "#dc3545",
      confirmButtonText: "OK",
      returnFocus: false,
    });
  } finally {
    clearingAll.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Watch for page changes
watch(
  () => currentPage.value,
  () => {
    fetchRecentlyViewed();
  }
);

// Lifecycle
onMounted(() => {
  fetchRecentlyViewed();
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

.recently-viewed-grid {
  margin-bottom: 2rem;
}

.book-card-container {
  flex: 1;
  overflow: hidden;
}

.recently-viewed-item-wrapper {
  position: relative;
  height: 100%;
}

/* Loading states */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Empty state */
.fa-eye-slash {
  color: #6c757d;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }

  .recently-viewed-grid .row {
    --bs-gutter-x: 1rem;
    --bs-gutter-y: 1rem;
  }

  .card-header {
    padding: 0.75rem 1rem;
  }

  .card-header h5 {
    font-size: 1rem;
  }

  .btn-sm {
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
  }
}

@media (max-width: 576px) {
  .card-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch !important;
  }

  .card-header .btn {
    width: 100%;
  }
}

/* Animation cho clear all button */
.btn-outline-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Fade animation cho items */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.recently-viewed-item-wrapper {
  animation: fadeIn 0.3s ease-out;
}
</style>
