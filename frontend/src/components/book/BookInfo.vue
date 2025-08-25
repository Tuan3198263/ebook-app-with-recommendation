<!-- filepath: d:\LuanVan\frontend\src\components\book\BookInfo.vue -->
<template>
  <div class="book-info">
    <!-- Title and rating -->
    <div class="book-header">
      <h1 class="book-title" :title="book.title">{{ book.title }}</h1>
      <div class="rating-section">
        <div class="stars">
          <span
            v-for="star in 5"
            :key="star"
            class="star"
            :class="{ filled: star <= Math.round(book.averageRating || 0) }"
          >
            ★
          </span>
        </div>
        <span class="rating-text">
          {{
            book.totalReviews > 0
              ? `${book.averageRating || 0}/5 (${book.totalReviews} đánh giá)`
              : "Chưa có đánh giá"
          }}
        </span>
      </div>
    </div>

    <!-- Authors -->
    <div class="book-authors">
      <div class="detail-item">
        <span class="label">Tác giả:</span>
        <span class="value">
          <template v-for="(author, index) in book.authors" :key="author._id">
            <span class="author-name">{{ author.name }}</span>
            <span v-if="index < book.authors.length - 1">, </span>
          </template>
        </span>
      </div>
    </div>

    <!-- Book details -->
    <div class="book-details">
      <div v-if="book.publisher" class="detail-item">
        <span class="label">Nhà xuất bản:</span>
        <span class="value">{{ book.publisher }}</span>
      </div>

      <div v-if="book.publicationYear" class="detail-item">
        <span class="label">Năm xuất bản:</span>
        <span class="value">{{ book.publicationYear }}</span>
      </div>

      <div v-if="book.dimensions" class="detail-item">
        <span class="label">Khuôn khổ:</span>
        <span class="value">{{ book.dimensions }}</span>
      </div>

      <div v-if="book.pages" class="detail-item">
        <span class="label">Số trang:</span>
        <span class="value">{{ book.pages }}</span>
      </div>

      <div v-if="book.language" class="detail-item">
        <span class="label">Ngôn ngữ:</span>
        <span class="value">{{ book.language }}</span>
      </div>

      <div v-if="book.isbn" class="detail-item">
        <span class="label">ISBN:</span>
        <span class="value">{{ book.isbn }}</span>
      </div>

      <div class="detail-item">
        <span class="label">Loại tài liệu:</span>
        <span class="value">{{ getDocumentTypeText(book.documentType) }}</span>
      </div>
    </div>

    <!-- Ebook options -->
    <div class="ebook-options">
      <h3>Tùy chọn thuê sách điện tử</h3>
      <div class="dropdown-container">
        <div class="custom-dropdown" @click="toggleDropdown">
          <div class="dropdown-selected">
            <span v-if="selectedOption" class="selected-text">
              {{ getDurationText(selectedOption.duration) }} -
              {{ formatPrice(selectedOption.price) }}
            </span>
            <span v-else class="placeholder">Chọn gói thuê</span>
            <i
              class="fas fa-chevron-down dropdown-icon"
              :class="{ rotated: isDropdownOpen }"
            ></i>
          </div>

          <div v-if="isDropdownOpen" class="dropdown-options">
            <div
              v-for="option in book.ebookOptions"
              :key="option.duration"
              class="dropdown-option"
              :class="{ active: selectedOption?.duration === option.duration }"
              @click.stop="selectOption(option)"
            >
              <span class="option-duration">{{
                getDurationText(option.duration)
              }}</span>
              <span class="option-price">{{ formatPrice(option.price) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="book-actions">
      <!-- Add to cart button -->
      <button
        :disabled="!selectedOption || isLoadingCart"
        @click="handleAddToCart"
        class="btn btn-success add-to-cart"
      >
        <i class="fas fa-shopping-cart"></i>
        Thêm vào giỏ hàng
      </button>

      <button
        @click="toggleFavorite"
        :disabled="isLoadingFavorite"
        class="btn favorite-btn"
        :class="{ 'btn-favorite-active': isFavorited }"
      >
        <i :class="isFavorited ? 'fas fa-heart' : 'far fa-heart'"></i>
        {{ isFavorited ? "Đã thích" : "Yêu thích" }}
      </button>

      <button
        @click="handlePreview"
        class="btn btn-outline-primary preview-btn"
      >
        <i class="fas fa-eye"></i>
        Đọc thử
      </button>
    </div>

    <!-- Additional info -->
    <div class="additional-info">
      <div class="info-item">
        <i class="fas fa-download"></i>
        <span>Tải xuống và đọc offline</span>
      </div>

      <div class="info-item">
        <i class="fas fa-sync-alt"></i>
        <span>Đồng bộ tiến độ đọc</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import favoriteService from "../../services/favoriteService";
import cartService from "../../services/cartService";

export default {
  name: "BookInfo",
  props: {
    book: {
      type: Object,
      required: true,
    },
  },
  emits: ["add-to-cart"],
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const router = useRouter();
    const toast = useToast();
    const selectedOption = ref(null);
    const isDropdownOpen = ref(false);

    // State cho chức năng yêu thích
    const isFavorited = ref(false);
    const isLoadingFavorite = ref(false);

    // State cho chức năng giỏ hàng
    const isLoadingCart = ref(false);

    // Auto-select first option
    const initializeSelectedOption = () => {
      if (props.book?.ebookOptions?.length > 0) {
        selectedOption.value = props.book.ebookOptions[0];
      }
    };

    initializeSelectedOption();

    // Kiểm tra trạng thái yêu thích của sách
    const checkFavoriteStatus = async () => {
      if (!authStore.isLoggedIn || !props.book?._id) {
        isFavorited.value = false;
        return;
      }

      try {
        const response = await favoriteService.checkFavoriteStatus(
          props.book._id
        );
        isFavorited.value = response.isFavorited || false;
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái yêu thích:", error);
        isFavorited.value = false;
      }
    };

    // Toggle thêm/xóa sách khỏi danh sách yêu thích
    const toggleFavorite = async () => {
      if (!authStore.isLoggedIn) {
        toast.warning("Vui lòng đăng nhập");
        return;
      }

      if (isLoadingFavorite.value || !props.book?._id) return;

      try {
        isLoadingFavorite.value = true;
        const response = await favoriteService.toggleFavorite(props.book._id);

        isFavorited.value = response.isFavorited;
        const message = response.isFavorited
          ? "Đã thêm vào danh sách yêu thích!"
          : "Đã xóa khỏi danh sách yêu thích!";
        toast.success(message);
      } catch (error) {
        console.error("Lỗi khi thao tác với danh sách yêu thích:", error);
        toast.error(error.message || "Không thể cập nhật danh sách yêu thích");
      } finally {
        isLoadingFavorite.value = false;
      }
    };

    const handleAddToCart = async () => {
      if (!authStore.isLoggedIn) {
        toast.warning("Vui lòng đăng nhập");
        return;
      }

      if (isLoadingCart.value || !selectedOption.value || !props.book?._id)
        return;

      try {
        isLoadingCart.value = true;
        const response = await cartService.addToCart(
          props.book._id,
          selectedOption.value.duration,
          selectedOption.value.price
        );

        if (response?.status === "success") {
          toast.success("Đã thêm sách vào giỏ hàng!");
          emit("add-to-cart", selectedOption.value);
        }
      } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Không thể thêm sách vào giỏ hàng";
        toast.error(errorMessage);
      } finally {
        isLoadingCart.value = false;
      }
    };

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };

    const selectOption = (option) => {
      selectedOption.value = option;
      isDropdownOpen.value = false;
    };

    const handlePreview = () => {
      console.log("Chức năng đọc thử đang được phát triển");
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest(".custom-dropdown")) {
        isDropdownOpen.value = false;
      }
    };

    // Watch for book changes
    watch(
      () => props.book,
      () => {
        initializeSelectedOption();
      },
      { deep: true }
    );

    // Watch for book ID changes
    watch(
      () => props.book?._id,
      async (newId, oldId) => {
        if (newId && newId !== oldId) {
          initializeSelectedOption();
          isFavorited.value = false;
          isDropdownOpen.value = false;
          await nextTick();
          await checkFavoriteStatus();
        }
      }
    );

    onMounted(() => {
      document.addEventListener("click", handleClickOutside);
      nextTick(() => {
        if (props.book?._id) {
          checkFavoriteStatus();
        }
      });
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
    });

    // Computed property cho nút yêu thích
    const favoriteButtonText = computed(() => {
      return isFavorited.value ? "Đã thích" : "Yêu thích";
    });

    const getDurationText = (duration) => {
      const durationMap = {
        "1_month": "1 tháng",
        "3_months": "3 tháng",
        "6_months": "6 tháng",
        permanent: "Vĩnh viễn",
      };
      return durationMap[duration] || duration;
    };

    const getDocumentTypeText = (type) => {
      const typeMap = {
        textbook: "Giáo trình",
        other: "Khác",
      };
      return typeMap[type] || "Khác";
    };

    const formatPrice = (price) => {
      if (!price || price === 0) return "0 VND";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    };

    return {
      selectedOption,
      isDropdownOpen,
      isFavorited,
      isLoadingFavorite,
      isLoadingCart,
      favoriteButtonText,
      toggleDropdown,
      selectOption,
      handleAddToCart,
      toggleFavorite,
      handlePreview,
      getDurationText,
      getDocumentTypeText,
      formatPrice,
    };
  },
};
</script>

<style scoped>
.book-info {
  padding: 0;
}

.book-header {
  margin-bottom: 20px;
}

.book-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 18px;
  color: #ddd;
}

.star.filled {
  color: #ffc107;
}

.rating-text {
  color: #666;
  font-size: 14px;
}

.book-authors {
  margin-bottom: 20px;
}

.author-link {
  color: #007bff;
  text-decoration: none;
}

.author-link:hover {
  text-decoration: underline;
}

.book-details {
  margin-bottom: 30px;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 15px;
  gap: 50px;
}

.label {
  font-weight: 700;
  color: #333;
  min-width: 120px;
  flex-shrink: 0;
}

.value {
  color: #333;
}

.ebook-options {
  margin-bottom: 30px;
}

.ebook-options h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

.dropdown-container {
  position: relative;
}

.custom-dropdown {
  position: relative;
  cursor: pointer;
}

.dropdown-selected {
  border: 1px solid #e9ecef;
  border-radius: 5px;
  padding: 10px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.3s ease;
}

.dropdown-selected:hover {
  border-color: #28a745;
}

.selected-text {
  font-weight: 600;
  color: #333;
}

.placeholder {
  color: #999;
}

.dropdown-icon {
  transition: transform 0.3s ease;
  color: #666;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #28a745;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-bottom: 1px solid #f1f3f4;
}

.dropdown-option:last-child {
  border-bottom: none;
}

.dropdown-option:hover {
  background-color: #f8f9fa;
}

.dropdown-option.active {
  background-color: #e8f5e8;
  color: #28a745;
}

.option-duration {
  font-weight: 600;
}

.option-price {
  font-weight: bold;
  color: #dc3545;
}

.book-actions {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 30px;
}

.btn {
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  border: 2px solid;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: 2px solid #007bff;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 2px solid #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: 2px solid #007bff;
}

.read-book-btn {
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.read-book-btn:hover {
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.3);
}

.btn-success {
  background: #28a745;
  color: white;
  border: 2px solid #28a745;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  border-color: #218838;
}

.btn-success:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.favorite-btn {
  background: white;
  color: #666;
  border-color: #ddd;
}

.favorite-btn:hover {
  border-color: #dc3545;
  color: #dc3545;
}

.btn-favorite-active {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-favorite-active:hover {
  background: white;
  border-color: #bd2130;
}

.btn-outline-primary {
  background: transparent;
  color: #007bff;
  border-color: #007bff;
}

.btn-outline-primary:hover {
  background: #007bff;
  color: white;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.fa-spinner {
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

.additional-info {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.info-item i {
  color: #007bff;
  width: 16px;
}

@media (max-width: 768px) {
  .book-title {
    font-size: 24px;
  }

  .book-actions {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .btn {
    padding: 14px 20px;
    font-size: 15px;
  }

  .dropdown-selected {
    padding: 12px;
  }

  .dropdown-option {
    padding: 10px 12px;
  }
}

@media (max-width: 480px) {
  .btn {
    padding: 12px 16px;
    font-size: 14px;
  }
}
</style>
