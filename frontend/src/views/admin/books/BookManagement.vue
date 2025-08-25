<template>
  <div class="book-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản lý sách</h1>
      <div>
        <router-link to="/admin/books/add" class="btn btn-primary">
          <i class="fas fa-plus me-1"></i> Thêm sách mới
        </router-link>
      </div>
    </div>

    <!-- Thẻ thông tin tổng quan -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-primary text-uppercase mb-1"
                >
                  Tổng số sách
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ totalBooks }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-book fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-success text-uppercase mb-1"
                >
                  Sách nổi bật
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ featuredCount }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-star fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-info text-uppercase mb-1"
                >
                  Sách hoạt động
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ activeCount }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-check-circle fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bảng quản lý sách với các bộ lọc -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h6 class="m-0 font-weight-bold text-primary">Danh sách sách</h6>
          </div>
          <div class="col-md-6">
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Tìm kiếm sách..."
                v-model="searchQuery"
              />
              <button class="btn btn-outline-secondary">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Đang tải dữ liệu...</p>
        </div>
        <div v-else>
          <!-- Bộ lọc nâng cao -->
          <div class="filter-section mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="font-weight-bold">Bộ lọc nâng cao</h6>
              <button
                class="btn btn-sm btn-link text-decoration-none"
                @click="toggleFilters"
              >
                {{ showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc" }}
                <i
                  class="fas"
                  :class="showFilters ? 'fa-chevron-up' : 'fa-chevron-down'"
                ></i>
              </button>
            </div>

            <div
              v-if="showFilters"
              class="filters-container p-3 border rounded bg-light"
            >
              <div class="row">
                <div class="col-md-3 mb-2">
                  <label class="form-label">Danh mục</label>
                  <select class="form-select" v-model="filters.category">
                    <option value="">Tất cả danh mục</option>
                    <option
                      v-for="cat in categories"
                      :key="cat._id"
                      :value="cat._id"
                    >
                      {{ cat.name }}
                    </option>
                  </select>
                </div>
                <div class="col-md-3 mb-2">
                  <label class="form-label">Loại tài liệu</label>
                  <select class="form-select" v-model="filters.documentType">
                    <option value="">Tất cả</option>
                    <option value="textbook">Giáo trình</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div class="col-md-3 mb-2">
                  <label class="form-label">Trạng thái</label>
                  <select class="form-select" v-model="filters.active">
                    <option value="">Tất cả</option>
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
                </div>
                <div class="col-md-3 mb-2">
                  <label class="form-label">Tác giả</label>
                  <select class="form-select" v-model="filters.author">
                    <option value="">Tất cả tác giả</option>
                    <option
                      v-for="author in authors"
                      :key="author._id"
                      :value="author._id"
                    >
                      {{ author.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="row mt-2">
                <div class="col-md-3 mb-2">
                  <label class="form-label">Nổi bật</label>
                  <select class="form-select" v-model="filters.featured">
                    <option value="">Tất cả</option>
                    <option value="true">Nổi bật</option>
                    <option value="false">Không nổi bật</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-end mb-2">
                  <button class="btn btn-primary me-2" @click="applyFilters">
                    Áp dụng
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    @click="resetFilters"
                  >
                    Đặt lại
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                Hiển thị
                <select
                  class="form-select form-select-sm d-inline-block w-auto mx-2"
                  v-model="pageSize"
                >
                  <option
                    v-for="size in pageSizeOptions"
                    :key="size"
                    :value="size"
                  >
                    {{ size }}
                  </option>
                </select>
                mục
              </div>
              <div>
                <span class="text-muted">
                  Hiển thị {{ displayedItemCount }} trên
                  {{ filteredBooks.length }} sách
                </span>
              </div>
            </div>

            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th scope="col" class="text-center">#</th>
                  <th scope="col" style="min-width: 80px">
                    <div class="d-flex align-items-center">Ảnh bìa</div>
                  </th>
                  <th scope="col" style="min-width: 200px">
                    <div class="d-flex align-items-center">
                      Tên sách
                      <button class="btn btn-sm" @click="toggleSort('title')">
                        <i :class="getSortIcon('title')"></i>
                      </button>
                    </div>
                  </th>
                  <th scope="col">
                    <div class="d-flex align-items-center">
                      Danh mục
                      <button
                        class="btn btn-sm"
                        @click="toggleSort('category.name')"
                      >
                        <i :class="getSortIcon('category.name')"></i>
                      </button>
                    </div>
                  </th>
                  <th scope="col">
                    <div class="d-flex align-items-center">Loại tài liệu</div>
                  </th>
                  <th scope="col" class="text-center">
                    <div class="d-flex align-items-center">
                      Năm XB
                      <button
                        class="btn btn-sm"
                        @click="toggleSort('publicationYear')"
                      >
                        <i :class="getSortIcon('publicationYear')"></i>
                      </button>
                    </div>
                  </th>
                  <th scope="col" class="text-center">
                    <div class="d-flex align-items-center">
                      Trạng thái
                      <button class="btn btn-sm" @click="toggleSort('active')">
                        <i :class="getSortIcon('active')"></i>
                      </button>
                    </div>
                  </th>
                  <th scope="col" class="text-center" style="min-width: 150px">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedBooks.length === 0">
                  <td colspan="8" class="text-center py-4">
                    <i class="fas fa-search me-2"></i>
                    Không tìm thấy sách nào phù hợp
                  </td>
                </tr>
                <tr v-for="(book, index) in paginatedBooks" :key="book._id">
                  <td class="text-center">{{ startIndex + index + 1 }}</td>
                  <td>
                    <img
                      :src="book.coverImages?.[0] || '/vite.svg'"
                      alt="Book Cover"
                      class="img-thumbnail book-cover-thumbnail"
                      style="height: 60px; width: 45px; object-fit: cover"
                    />
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <strong>{{ book.title }}</strong>
                      <small class="text-muted">
                        {{ getAuthorNames(book.authors) }}
                      </small>
                    </div>
                  </td>
                  <td>{{ getCategoryName(book.category) }}</td>
                  <td>
                    <span v-if="book.documentType === 'textbook'"
                      >Giáo trình</span
                    >
                    <span v-else>Khác</span>
                  </td>
                  <td class="text-center">{{ book.publicationYear || "-" }}</td>
                  <td class="text-center">
                    <span
                      class="badge"
                      :class="book.active ? 'bg-success' : 'bg-warning'"
                    >
                      {{ book.active ? "Hiện" : "Ẩn" }}
                    </span>
                    <span
                      v-if="book.featured"
                      class="badge bg-info ms-1"
                      title="Sách nổi bật"
                    >
                      <i class="fas fa-star"></i>
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group">
                      <button
                        class="btn btn-sm btn-outline-info"
                        @click="viewBook(book)"
                        title="Xem chi tiết"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                      <router-link
                        :to="`/admin/books/edit/${book._id}`"
                        class="btn btn-sm btn-outline-primary"
                        title="Chỉnh sửa"
                      >
                        <i class="fas fa-edit"></i>
                      </router-link>
                      <button
                        class="btn btn-sm"
                        :class="
                          book.active
                            ? 'btn-outline-warning'
                            : 'btn-outline-success'
                        "
                        @click="toggleBookStatus(book)"
                        :title="book.active ? 'Ẩn sách' : 'Hiển thị sách'"
                      >
                        <i
                          class="fas"
                          :class="book.active ? 'fa-eye-slash' : 'fa-eye'"
                        ></i>
                      </button>
                      <button
                        class="btn btn-sm"
                        :class="
                          book.featured
                            ? 'btn-outline-secondary'
                            : 'btn-outline-info'
                        "
                        @click="toggleFeatured(book)"
                        :title="
                          book.featured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'
                        "
                      >
                        <i class="fas fa-star"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Phân trang -->
          <div class="d-flex justify-content-center mt-4">
            <nav aria-label="Page navigation" v-if="totalPages > 0">
              <ul class="pagination">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <a
                    class="page-link"
                    href="#"
                    @click.prevent="currentPage = 1"
                  >
                    <i class="fas fa-angle-double-left"></i>
                  </a>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="currentPage--">
                    <i class="fas fa-angle-left"></i>
                  </a>
                </li>
                <li
                  v-for="page in visiblePageNumbers"
                  :key="page"
                  class="page-item"
                  :class="{ active: currentPage === page }"
                >
                  <a
                    class="page-link"
                    href="#"
                    @click.prevent="currentPage = page"
                    >{{ page }}</a
                  >
                </li>
                <li
                  class="page-item"
                  :class="{ disabled: currentPage === totalPages }"
                >
                  <a class="page-link" href="#" @click.prevent="currentPage++">
                    <i class="fas fa-angle-right"></i>
                  </a>
                </li>
                <li
                  class="page-item"
                  :class="{ disabled: currentPage === totalPages }"
                >
                  <a
                    class="page-link"
                    href="#"
                    @click.prevent="currentPage = totalPages"
                  >
                    <i class="fas fa-angle-double-right"></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal xóa sách -->
    <div
      class="modal fade"
      id="deleteBookModal"
      tabindex="-1"
      aria-labelledby="deleteBookModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteBookModalLabel">Xác nhận xóa</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              Bạn có chắc chắn muốn xóa sách
              <strong>"{{ bookToDelete?.title }}"</strong> không?
            </p>
            <p class="text-danger">Hành động này không thể hoàn tác.</p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteBook"
              :disabled="isLoading"
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sử dụng component modal chi tiết sách -->
    <BookDetailModal
      :bookId="selectedBookId"
      :show="showBookDetail"
      :categories="categories"
      :authors="authors"
      @close="closeBookDetail"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import bookService from "../../../services/bookService";
import categoryService from "../../../services/categoryService";
import authorService from "../../../services/authorService";
import BookDetailModal from "../../../components/admin/BookDetailModal.vue";
import { Modal } from "bootstrap"; // Import Bootstrap Modal

const toast = useToast();

// Biến trạng thái
const books = ref([]);
const categories = ref([]);
const authors = ref([]);
const loading = ref(true);
const isLoading = ref(false);
const bookDetailsLoading = ref(false);
const searchQuery = ref("");
const sortField = ref("createdAt");
const sortDirection = ref("desc");
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([10, 20, 50, 100]);
const showFilters = ref(false);
const filters = ref({
  category: "",
  author: "",
  documentType: "",
  active: "",
  featured: "",
});
const bookToDelete = ref(null);
const selectedBookId = ref(null);
const showBookDetail = ref(false);
let deleteModal = null;

// Tải dữ liệu từ API
const fetchBooks = async () => {
  try {
    loading.value = true;
    const response = await bookService.getAllBooks();
    if (response.success) {
      books.value = response.data || [];
    } else {
      toast.error("Không thể tải dữ liệu sách");
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu sách:", error);
    toast.error("Không thể tải dữ liệu sách");
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const response = await categoryService.getCategoriesList();
    if (response.success) {
      categories.value = response.data || [];
    }
  } catch (error) {
    console.error("Lỗi khi tải danh mục:", error);
    toast.error("Không thể tải danh mục");
  }
};

const fetchAuthors = async () => {
  try {
    const response = await authorService.getAuthorsList();
    if (response.success) {
      authors.value = response.data || [];
    }
  } catch (error) {
    console.error("Lỗi khi tải tác giả:", error);
    toast.error("Không thể tải danh sách tác giả");
  }
};

// Danh sách các năm xuất bản để lọc
const publicationYears = computed(() => {
  const years = [
    ...new Set(
      books.value.map((book) => book.publicationYear).filter((year) => year)
    ),
  ];
  return years.sort((a, b) => b - a); // Sắp xếp năm từ mới đến cũ
});

// Thống kê
const totalBooks = computed(() => books.value.length);
const featuredCount = computed(
  () => books.value.filter((book) => book.featured).length
);
const activeCount = computed(
  () => books.value.filter((book) => book.active).length
);

// Helper functions
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
        const foundAuthor = authors.value.find((a) => a._id === author);
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
    const foundCategory = categories.value.find((c) => c._id === category);
    return foundCategory ? foundCategory.name : category;
  }

  return "";
};

// Lọc sách dựa trên tìm kiếm và bộ lọc
const filteredBooks = computed(() => {
  let result = [...books.value];

  // Lọc theo tìm kiếm
  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query) ||
        book.slug?.toLowerCase().includes(query) ||
        getAuthorNames(book.authors).toLowerCase().includes(query) ||
        book.publisher?.toLowerCase().includes(query)
    );
  }

  // Lọc theo danh mục
  if (filters.value.category) {
    result = result.filter((book) => {
      if (typeof book.category === "object") {
        return book.category._id === filters.value.category;
      }
      return book.category === filters.value.category;
    });
  }

  // Lọc theo tác giả
  if (filters.value.author) {
    result = result.filter((book) => {
      if (Array.isArray(book.authors)) {
        return book.authors.some((author) => {
          if (typeof author === "object") {
            return author._id === filters.value.author;
          }
          return author === filters.value.author;
        });
      }
      return false;
    });
  }

  // Lọc theo loại tài liệu
  if (filters.value.documentType) {
    result = result.filter(
      (book) => book.documentType === filters.value.documentType
    );
  }

  // Lọc theo trạng thái hiển thị
  if (filters.value.active !== "") {
    const isActive = filters.value.active === "true";
    result = result.filter((book) => book.active === isActive);
  }

  // Lọc theo nổi bật
  if (filters.value.featured !== "") {
    const isFeatured = filters.value.featured === "true";
    result = result.filter((book) => book.featured === isFeatured);
  }

  // Sắp xếp
  result.sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField.value === "category.name") {
      comparison = getCategoryName(a.category).localeCompare(
        getCategoryName(b.category)
      );
    } else if (sortField.value === "publicationYear") {
      comparison = (a.publicationYear || 0) - (b.publicationYear || 0);
    } else if (sortField.value === "active") {
      comparison = a.active === b.active ? 0 : a.active ? -1 : 1;
    } else if (sortField.value === "createdAt") {
      comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });

  return result;
});

// Phân trang
const totalPages = computed(() => {
  return Math.ceil(filteredBooks.value.length / pageSize.value);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value;
});

const paginatedBooks = computed(() => {
  return filteredBooks.value.slice(
    startIndex.value,
    startIndex.value + pageSize.value
  );
});

const displayedItemCount = computed(() => {
  return Math.min(
    startIndex.value + paginatedBooks.value.length,
    filteredBooks.value.length
  );
});

const visiblePageNumbers = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages.value <= maxVisiblePages) {
    // Hiển thị tất cả các số trang nếu tổng số trang ít
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Luôn hiển thị trang hiện tại và một số trang xung quanh
    let startPage = Math.max(
      1,
      currentPage.value - Math.floor(maxVisiblePages / 2)
    );
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages.value) {
      endPage = totalPages.value;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }

  return pages;
});

// Các phương thức xử lý
const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
  currentPage.value = 1; // Reset về trang đầu khi thay đổi sắp xếp
};

const getSortIcon = (field) => {
  if (sortField.value !== field) {
    return "fas fa-sort";
  }
  return sortDirection.value === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const applyFilters = () => {
  currentPage.value = 1;
};

const resetFilters = () => {
  filters.value = {
    category: "",
    author: "",
    documentType: "",
    active: "",
    featured: "",
  };
  currentPage.value = 1;
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

// Xử lý các Modal
const viewBook = (book) => {
  selectedBookId.value = book._id;
  showBookDetail.value = true;
};

// Hàm đóng modal chi tiết
const closeBookDetail = () => {
  showBookDetail.value = false;
  selectedBookId.value = null;
};

const openDeleteModal = (book) => {
  bookToDelete.value = book;

  // Hiển thị modal xác nhận xóa
  if (deleteModal) {
    deleteModal.show();
  } else {
    const element = document.getElementById("deleteBookModal");
    if (element) {
      deleteModal = new Modal(element);
      deleteModal.show();
    }
  }
};

const deleteBook = async () => {
  if (!bookToDelete.value) return;

  try {
    isLoading.value = true;
    const response = await bookService.deleteBook(bookToDelete.value._id);

    if (response.success) {
      books.value = books.value.filter(
        (book) => book._id !== bookToDelete.value._id
      );
      toast.success("Đã xóa sách thành công!");

      // Đóng modal
      if (deleteModal) {
        deleteModal.hide();
      }
    } else {
      toast.error("Không thể xóa sách: " + response.message);
    }
  } catch (error) {
    console.error("Lỗi khi xóa sách:", error);
    toast.error(
      "Không thể xóa sách: " + (error.message || "Lỗi không xác định")
    );
  } finally {
    isLoading.value = false;
  }
};

const toggleBookStatus = async (book) => {
  try {
    const response = await bookService.toggleBookStatus(book._id, !book.active);
    if (response.success) {
      const index = books.value.findIndex((b) => b._id === book._id);
      if (index !== -1) {
        books.value[index].active = !books.value[index].active;
        const status = books.value[index].active ? "hiển thị" : "ẩn";
        toast.info(`Đã chuyển trạng thái sách thành ${status}`);
      }
    } else {
      toast.error("Không thể thay đổi trạng thái sách");
    }
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái sách:", error);
    toast.error("Không thể thay đổi trạng thái sách");
  }
};

const toggleFeatured = async (book) => {
  try {
    const response = await bookService.toggleFeaturedStatus(
      book._id,
      !book.featured
    );
    if (response.success) {
      const index = books.value.findIndex((b) => b._id === book._id);
      if (index !== -1) {
        books.value[index].featured = !books.value[index].featured;
        const status = books.value[index].featured ? "nổi bật" : "bình thường";
        toast.info(`Đã chuyển trạng thái sách thành ${status}`);
      }
    } else {
      toast.error("Không thể thay đổi trạng thái nổi bật");
    }
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái nổi bật:", error);
    toast.error("Không thể thay đổi trạng thái nổi bật");
  }
};

// Lắng nghe sự thay đổi trong tìm kiếm hoặc kích thước trang
watch([searchQuery, pageSize], () => {
  currentPage.value = 1; // Reset về trang đầu khi thay đổi bộ lọc hoặc kích thước trang
});

// Khởi tạo
onMounted(async () => {
  // Import Bootstrap Modal để sử dụng cho modal xóa
  await Promise.all([fetchBooks(), fetchCategories(), fetchAuthors()]);

  // Khởi tạo modal xóa sách
  const deleteModalEl = document.getElementById("deleteBookModal");
  if (deleteModalEl) {
    deleteModal = new Modal(deleteModalEl);
  }
});
</script>

<style scoped>
.book-management h1 {
  color: #3c4b64;
  font-weight: 600;
}

.card {
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
  border: none;
  border-radius: 0.5rem;
}

.card-header {
  background-color: #f8f9fc;
  border-bottom: 1px solid #e3e6f0;
}

.border-left-primary {
  border-left: 0.25rem solid #4e73df !important;
}

.border-left-success {
  border-left: 0.25rem solid #1cc88a !important;
}

.border-left-info {
  border-left: 0.25rem solid #36b9cc !important;
}

.border-left-warning {
  border-left: 0.25rem solid #f6c23e !important;
}

.text-xs {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.table-responsive {
  min-height: 300px;
}

.page-link {
  color: #3c4b64;
  margin: 0 2px;
}

.page-item.active .page-link {
  background-color: #4e73df;
  border-color: #4e73df;
}

.pagination {
  margin-bottom: 0;
}

table th,
table td {
  vertical-align: middle;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
  margin: 0 2px;
}

.book-cover-thumbnail {
  object-fit: cover;
}

.filter-section {
  transition: all 0.3s ease;
}

.filters-container {
  animation: fadeIn 0.3s ease;
}

/* Giới hạn độ rộng và hiển thị dấu ... cho text dài */
table td {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Cột tên sách rộng hơn */
table td:nth-child(3) {
  max-width: 250px;
}

/* Cột thao tác không bị giới hạn */
table td:last-child {
  max-width: none;
  white-space: nowrap;
}

/* Cột ảnh và số thứ tự không bị giới hạn */
table td:nth-child(1),
table td:nth-child(2) {
  max-width: none;
  white-space: nowrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
