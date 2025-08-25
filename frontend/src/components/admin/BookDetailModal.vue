<template>
  <div
    class="modal fade"
    id="viewBookModal"
    tabindex="-1"
    aria-labelledby="viewBookModalLabel"
    aria-hidden="true"
    ref="modalEl"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="viewBookModalLabel">
            <i class="fas fa-book me-2"></i>Chi tiết sách
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body" v-if="book">
          <div v-if="loading" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải thông tin...</p>
          </div>
          <div v-else>
            <!-- Phần thông tin chính -->
            <div class="row">
              <div class="col-md-4 text-center mb-3 mb-md-0">
                <!-- Ảnh bìa chính -->
                <div class="book-cover-wrapper">
                  <img
                    :src="
                      book.coverImages?.[0] ||
                      'https://via.placeholder.com/200x300'
                    "
                    alt="Book Cover"
                    class="img-fluid book-cover mb-3"
                  />
                  <div class="book-status-badges">
                    <span
                      v-if="book.featured"
                      class="badge bg-info"
                      title="Sách nổi bật"
                    >
                      <i class="fas fa-star me-1"></i>Nổi bật
                    </span>
                    <span
                      class="badge ms-1"
                      :class="book.active ? 'bg-success' : 'bg-warning'"
                    >
                      {{ book.active ? "Đang hiển thị" : "Đã ẩn" }}
                    </span>
                  </div>
                </div>

                <!-- Các ảnh bìa khác -->
                <div
                  class="additional-covers mt-3"
                  v-if="book.coverImages?.length > 1"
                >
                  <p class="small text-muted">Ảnh bìa khác</p>
                  <div class="d-flex flex-wrap justify-content-center">
                    <img
                      v-for="(image, idx) in book.coverImages?.slice(1)"
                      :key="idx"
                      :src="image"
                      alt="Additional cover"
                      class="additional-cover-img"
                    />
                  </div>
                </div>
              </div>

              <div class="col-md-8">
                <!-- Tiêu đề sách -->
                <h3 class="book-title">{{ book.title }}</h3>

                <!-- Thông tin cơ bản -->
                <div class="book-basic-info">
                  <p class="authors">
                    <i class="fas fa-user-edit me-2"></i>
                    <strong>Tác giả:</strong>
                    <span>{{ getAuthorNames(book.authors) }}</span>
                  </p>

                  <p>
                    <i class="fas fa-folder me-2"></i>
                    <strong>Danh mục:</strong>
                    {{ getCategoryName(book.category) }}
                  </p>

                  <div class="d-flex align-items-center gap-3 mb-2">
                    <!-- Đánh giá dạng sao -->
                    <div class="book-rating">
                      <div class="stars">
                        <template v-for="n in 5" :key="n">
                          <i
                            :class="[
                              'fas',
                              n <= Math.round(book.averageRating || 0)
                                ? 'fa-star text-warning'
                                : 'fa-star text-muted',
                            ]"
                          ></i>
                        </template>
                      </div>
                      <span class="rating-number"
                        >{{ book.averageRating?.toFixed(1) || "0" }}/5</span
                      >
                      <span class="rating-count"
                        >({{ book.totalReviews || 0 }} đánh giá)</span
                      >
                    </div>
                  </div>
                </div>

                <hr class="my-3" />

                <!-- Card thông tin chi tiết -->
                <div class="card mb-3">
                  <div class="card-header bg-light">
                    <h6 class="mb-0">
                      <i class="fas fa-info-circle me-2"></i>Thông tin chi tiết
                    </h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <ul class="list-unstyled">
                          <li class="mb-2">
                            <i class="fas fa-landmark me-2"></i>
                            <strong>NXB:</strong>
                            {{ book.publisher || "Chưa cập nhật" }}
                          </li>
                          <li class="mb-2">
                            <i class="fas fa-calendar-alt me-2"></i>
                            <strong>Năm XB:</strong>
                            {{ book.publicationYear || "Chưa cập nhật" }}
                          </li>
                          <li class="mb-2">
                            <i class="fas fa-file-alt me-2"></i>
                            <strong>Số trang:</strong>
                            {{ book.pages || "Chưa cập nhật" }}
                          </li>
                        </ul>
                      </div>
                      <div class="col-md-6">
                        <ul class="list-unstyled">
                          <li class="mb-2">
                            <i class="fas fa-barcode me-2"></i>
                            <strong>ISBN:</strong>
                            {{ book.isbn || "Chưa cập nhật" }}
                          </li>
                          <li class="mb-2">
                            <i class="fas fa-language me-2"></i>
                            <strong>Ngôn ngữ:</strong>
                            {{ book.language || "Tiếng Việt" }}
                          </li>
                          <li class="mb-2">
                            <i class="fas fa-bookmark me-2"></i>
                            <strong>Loại tài liệu: </strong>
                            <span v-if="book.documentType === 'textbook'"
                              >Giáo trình</span
                            >
                            <span v-else>Khác</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Thông tin giá ebook -->
                <div class="card border-primary">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">
                      <i class="fas fa-tablet-alt me-2"></i>Tùy chọn thuê/mua
                      ebook
                    </h6>
                  </div>
                  <div class="card-body">
                    <div
                      v-if="book.ebookOptions && book.ebookOptions.length > 0"
                    >
                      <ul class="list-group list-group-flush">
                        <li
                          v-for="(option, idx) in book.ebookOptions"
                          :key="idx"
                          class="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>{{ formatDuration(option.duration) }}</span>
                          <span class="badge bg-primary rounded-pill">{{
                            formatPrice(option.price)
                          }}</span>
                        </li>
                      </ul>
                    </div>
                    <div v-else class="text-center text-muted">
                      <i class="fas fa-exclamation-circle me-2"></i>
                      Chưa có tùy chọn giá
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mô tả sách -->
            <div class="card mt-4">
              <div class="card-header bg-light">
                <h6 class="mb-0">
                  <i class="fas fa-align-left me-2"></i>Mô tả sách
                </h6>
              </div>
              <div class="card-body">
                <div
                  v-if="book.description"
                  class="book-description"
                  v-html="book.description"
                ></div>
                <p v-else class="text-muted fst-italic">
                  Chưa có mô tả cho sách này
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            <i class="fas fa-times me-1"></i>Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { Modal } from "bootstrap";
import bookService from "@/services/bookService";
import { useToast } from "vue-toastification";

const toast = useToast();
const props = defineProps({
  bookId: {
    type: String,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  authors: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close"]);
const book = ref(null);
const loading = ref(false);
const modalEl = ref(null);
let modal = null;

const getAuthorNames = (authors) => {
  if (!authors) return "";
  return authors
    .map((author) => {
      // Nếu author là object có thuộc tính name
      if (author && typeof author === "object" && author.name) {
        return author.name;
      }
      // Nếu author là string ID, tìm trong danh sách authors
      if (typeof author === "string") {
        const foundAuthor = props.authors.find((a) => a._id === author);
        return foundAuthor ? foundAuthor.name : author;
      }
      return "";
    })
    .filter((name) => name)
    .join(", ");
};

const getCategoryName = (category) => {
  if (!category) return "";

  // Nếu category là object có thuộc tính name
  if (category && typeof category === "object" && category.name) {
    return category.name;
  }

  // Nếu category là string ID, tìm trong danh sách categories
  if (typeof category === "string") {
    const foundCategory = props.categories.find((c) => c._id === category);
    return foundCategory ? foundCategory.name : category;
  }

  return "";
};

const formatPrice = (price) => {
  if (!price) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const formatDuration = (duration) => {
  switch (duration) {
    case "1_month":
      return "1 tháng";
    case "3_months":
      return "3 tháng";
    case "6_months":
      return "6 tháng";
    case "permanent":
      return "Mua đứt";
    default:
      return duration;
  }
};

const showModal = () => {
  if (modal) {
    modal.show();
  }
};

const hideModal = () => {
  if (modal) {
    modal.hide();
  }
};

const loadBookDetail = async (id) => {
  if (!id) return;

  loading.value = true;
  book.value = null;

  try {
    const response = await bookService.getBookDetailById(id);
    if (response.success) {
      book.value = response.data;
    } else {
      toast.error("Không thể tải chi tiết sách");
    }
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sách:", error);
    toast.error("Không thể tải chi tiết sách");
  } finally {
    loading.value = false;
  }
};

// Theo dõi thay đổi của bookId
watch(
  () => props.bookId,
  (newId) => {
    if (newId) {
      loadBookDetail(newId);
    }
  }
);

// Theo dõi trạng thái hiển thị modal
watch(
  () => props.show,
  (value) => {
    if (value && modal) {
      showModal();
    } else if (!value && modal) {
      hideModal();
    }
  }
);

onMounted(() => {
  if (modalEl.value) {
    modal = new Modal(modalEl.value);

    // Xử lý sự kiện khi modal đóng để thông báo cho component cha
    modalEl.value.addEventListener("hidden.bs.modal", () => {
      emit("close");
    });

    if (props.show) {
      showModal();
    }

    if (props.bookId) {
      loadBookDetail(props.bookId);
    }
  }
});
</script>

<style scoped>
.book-cover-wrapper {
  position: relative;
  display: inline-block;
}

.book-cover {
  max-height: 300px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

.book-status-badges {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  display: flex;
  justify-content: center;
}

.additional-cover-img {
  height: 60px;
  width: 45px;
  object-fit: cover;
  margin: 0 4px 4px 0;
  border-radius: 3px;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: transform 0.2s;
}

.additional-cover-img:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.book-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #344767;
}

.authors {
  font-style: italic;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  color: #f8e825;
  margin-right: 5px;
}

.rating-number {
  font-weight: 600;
  margin-right: 4px;
}

.rating-count {
  font-size: 0.9rem;
  color: #6c757d;
}

.book-views {
  font-size: 0.9rem;
  color: #6c757d;
}

.card {
  border-radius: 0.5rem;
}

.card-header {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.book-description {
  line-height: 1.6;
}

/* Style cho nội dung HTML trong mô tả */
.book-description :deep(h1),
.book-description :deep(h2),
.book-description :deep(h3),
.book-description :deep(h4),
.book-description :deep(h5),
.book-description :deep(h6) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.book-description :deep(p) {
  margin-bottom: 1rem;
}

.book-description :deep(ul),
.book-description :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.book-description :deep(blockquote) {
  padding: 0.5rem 1rem;
  margin: 0 0 1rem;
  border-left: 3px solid #ced4da;
  background-color: #f8f9fa;
}

.book-description :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
}

.book-description :deep(table) {
  width: 100%;
  margin-bottom: 1rem;
  border-collapse: collapse;
}

.book-description :deep(table th),
.book-description :deep(table td) {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
}
</style>
