<template>
  <div class="author-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản lý tác giả</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <i class="fas fa-plus me-1"></i> Thêm tác giả mới
      </button>
    </div>

    <!-- Thẻ thông tin tổng quan -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-info text-uppercase mb-1"
                >
                  Tổng số tác giả
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ authors.length }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-user-edit fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bảng quản lý tác giả -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h6 class="m-0 font-weight-bold text-primary">Danh sách tác giả</h6>
          </div>
          <div class="col-md-6">
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Tìm kiếm tác giả..."
                v-model="searchQuery"
              />
              <button class="btn btn-outline-secondary" type="button">
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
        <div v-else class="table-responsive">
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
                {{ filteredAuthors.length }} tác giả
              </span>
            </div>
          </div>

          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th scope="col" class="text-center">#</th>
                <th scope="col">
                  <div class="d-flex align-items-center">
                    Tên tác giả
                    <button class="btn btn-sm" @click="toggleSort('name')">
                      <i :class="getSortIcon('name')"></i>
                    </button>
                  </div>
                </th>
                <th scope="col">Slug</th>
                <th scope="col" class="text-center">
                  <div class="d-flex align-items-center">
                    Số sách
                    <button class="btn btn-sm" @click="toggleSort('bookCount')">
                      <i :class="getSortIcon('bookCount')"></i>
                    </button>
                  </div>
                </th>
                <th scope="col" class="text-center">
                  <div class="d-flex align-items-center">
                    Ngày thêm
                    <button class="btn btn-sm" @click="toggleSort('createdAt')">
                      <i :class="getSortIcon('createdAt')"></i>
                    </button>
                  </div>
                </th>
                <th scope="col" class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedAuthors.length === 0">
                <td colspan="6" class="text-center py-4">
                  <i class="fas fa-search me-2"></i>
                  Không tìm thấy tác giả nào
                </td>
              </tr>
              <tr v-for="(author, index) in paginatedAuthors" :key="author._id">
                <td class="text-center">{{ startIndex + index + 1 }}</td>
                <td>{{ author.name }}</td>
                <td>{{ author.slug }}</td>
                <td class="text-center">{{ author.bookCount || 0 }}</td>
                <td class="text-center">{{ formatDate(author.createdAt) }}</td>
                <td class="text-center">
                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-outline-info"
                      @click="viewAuthor(author)"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="openEditModal(author)"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="openDeleteModal(author)"
                    >
                      <i class="fas fa-trash"></i>
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
                <a class="page-link" href="#" @click.prevent="currentPage = 1">
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

    <!-- Modal thêm/sửa tác giả -->
    <div
      class="modal fade"
      id="authorModal"
      tabindex="-1"
      aria-labelledby="authorModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="authorModalLabel">
              {{ isEditing ? "Chỉnh sửa tác giả" : "Thêm tác giả mới" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveAuthor">
              <div class="mb-3">
                <label for="authorName" class="form-label">
                  Tên tác giả <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="authorName"
                  v-model="authorForm.name"
                  required
                  maxlength="100"
                  :class="{ 'is-invalid': !!nameError }"
                />
                <div class="invalid-feedback" v-if="nameError">
                  {{ nameError }}
                </div>
                <div class="form-text">
                  Tên tác giả không được quá 100 ký tự
                </div>
              </div>
              <div class="mb-3">
                <label for="authorBio" class="form-label">Tiểu sử</label>
                <textarea
                  class="form-control"
                  id="authorBio"
                  rows="5"
                  v-model="authorForm.bio"
                  maxlength="1000"
                  :class="{ 'is-invalid': !!bioError }"
                ></textarea>
                <div class="invalid-feedback" v-if="bioError">
                  {{ bioError }}
                </div>
                <div class="form-text">
                  Giới thiệu về tác giả, không quá 1000 ký tự
                </div>
              </div>
            </form>
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
              class="btn btn-primary"
              @click="saveAuthor"
              :disabled="
                !authorForm.name || !!nameError || !!bioError || isLoading
              "
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isEditing ? "Cập nhật" : "Thêm mới" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal xóa tác giả -->
    <div
      class="modal fade"
      id="deleteAuthorModal"
      tabindex="-1"
      aria-labelledby="deleteAuthorModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteAuthorModalLabel">
              Xác nhận xóa
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              Bạn có chắc chắn muốn xóa tác giả
              <strong>"{{ authorToDelete?.name }}"</strong> không?
            </p>
            <p class="text-danger">
              Hành động này không thể hoàn tác và sẽ ảnh hưởng đến tất cả sách
              liên quan.
            </p>
            <div
              v-if="authorToDelete && authorToDelete.bookCount > 0"
              class="alert alert-warning"
            >
              <i class="fas fa-exclamation-triangle me-2"></i>
              Tác giả này hiện có {{ authorToDelete.bookCount }} sách. Xóa tác
              giả sẽ ảnh hưởng đến các sách này.
            </div>
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
              @click="deleteAuthor"
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

    <!-- Modal xem chi tiết tác giả -->
    <div
      class="modal fade"
      id="viewAuthorModal"
      tabindex="-1"
      aria-labelledby="viewAuthorModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewAuthorModalLabel">
              Chi tiết tác giả
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body" v-if="selectedAuthor">
            <div v-if="authorDetailsLoading" class="text-center py-3">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Đang tải thông tin...</p>
            </div>
            <div v-else>
              <h4>{{ selectedAuthor.name }}</h4>
              <p class="small text-muted">Slug: {{ selectedAuthor.slug }}</p>
              <div class="mb-3">
                <h6 class="fw-bold">Tiểu sử:</h6>
                <p>{{ selectedAuthor.bio || "Chưa có thông tin tiểu sử." }}</p>
              </div>
              <div class="mb-3">
                <h6 class="fw-bold">Sách của tác giả:</h6>
                <ul class="list-group">
                  <li
                    v-for="book in authorDetails?.books"
                    :key="book._id"
                    class="list-group-item d-flex justify-content-between align-items-center"
                  >
                    {{ book.title }}
                    <span class="badge bg-primary rounded-pill">{{
                      book.publicationYear
                    }}</span>
                  </li>
                  <li
                    v-if="
                      !authorDetails?.books || authorDetails.books.length === 0
                    "
                    class="list-group-item text-muted"
                  >
                    Không có sách nào.
                  </li>
                </ul>
                <div
                  class="mt-2 text-muted"
                  v-if="authorDetails?.bookCount > 5"
                >
                  <small
                    >Hiển thị 5/{{ authorDetails.bookCount }} cuốn sách</small
                  >
                </div>
              </div>
              <p class="text-muted mt-3">
                <small
                  >Ngày thêm: {{ formatDate(selectedAuthor.createdAt) }}</small
                >
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import authorService from "../../../services/authorService";
import slugify from "slugify";

const toast = useToast();

// Thiết lập các biến trạng thái
const authors = ref([]);
const loading = ref(false);
const isLoading = ref(false);
const authorDetailsLoading = ref(false);
const searchQuery = ref("");
const sortField = ref("name");
const sortDirection = ref("asc");
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([5, 10, 15, 20, 50]);

// Biến cho modal và form
const authorForm = ref({ name: "", bio: "" });
const nameError = ref("");
const bioError = ref("");
const isEditing = ref(false);
const authorToDelete = ref(null);
const selectedAuthor = ref(null);
const authorDetails = ref(null);
let authorModal = null;
let deleteModal = null;
let viewModal = null;

// Validate tên tác giả
const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return "Vui lòng nhập tên tác giả";
  }

  if (name.length > 100) {
    return "Tên tác giả không được quá 100 ký tự";
  }

  return "";
};

// Validate tiểu sử
const validateBio = (bio) => {
  if (bio && bio.length > 1000) {
    return "Tiểu sử không được quá 1000 ký tự";
  }

  return "";
};

// Lấy dữ liệu tác giả từ API
const fetchAuthors = async () => {
  try {
    loading.value = true;
    const response = await authorService.getAllAuthors();
    if (response.success) {
      authors.value = response.data || [];
    } else {
      toast.error("Không thể tải danh sách tác giả");
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách tác giả:", error);
    toast.error(
      "Lỗi khi tải danh sách tác giả: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    loading.value = false;
  }
};

// Lọc tác giả theo từ khóa tìm kiếm
const filteredAuthors = computed(() => {
  let result = [...authors.value];

  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (author) =>
        author.name.toLowerCase().includes(query) ||
        author.slug.toLowerCase().includes(query) ||
        (author.bio && author.bio.toLowerCase().includes(query))
    );
  }

  // Sắp xếp
  result.sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField.value === "bookCount") {
      const countA = a.bookCount || 0;
      const countB = b.bookCount || 0;
      comparison = countA - countB;
    } else if (sortField.value === "createdAt") {
      comparison = new Date(a.createdAt) - new Date(b.createdAt);
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });

  return result;
});

// Phân trang
const totalPages = computed(() => {
  return Math.ceil(filteredAuthors.value.length / pageSize.value);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value;
});

const paginatedAuthors = computed(() => {
  const start = startIndex.value;
  const end = start + pageSize.value;
  return filteredAuthors.value.slice(start, end);
});

const displayedItemCount = computed(() => {
  return Math.min(
    startIndex.value + paginatedAuthors.value.length,
    filteredAuthors.value.length
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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// Modal thêm, sửa tác giả
const openAddModal = () => {
  isEditing.value = false;
  authorForm.value = { name: "", bio: "" };
  nameError.value = "";
  bioError.value = "";
  if (authorModal) {
    authorModal.show();
  }
};

const openEditModal = (author) => {
  isEditing.value = true;
  authorForm.value = { ...author };
  nameError.value = "";
  bioError.value = "";
  if (authorModal) {
    authorModal.show();
  }
};

const saveAuthor = async () => {
  // Validate form
  nameError.value = validateName(authorForm.value.name);
  bioError.value = validateBio(authorForm.value.bio);

  if (nameError.value || bioError.value) {
    return;
  }

  try {
    isLoading.value = true;

    if (isEditing.value) {
      // Cập nhật tác giả
      const response = await authorService.updateAuthor(authorForm.value._id, {
        name: authorForm.value.name,
        bio: authorForm.value.bio,
      });

      if (response.success) {
        // Cập nhật vào mảng authors
        const index = authors.value.findIndex(
          (a) => a._id === response.data._id
        );
        if (index !== -1) {
          authors.value[index] = {
            ...response.data,
            bookCount: authors.value[index].bookCount, // Giữ lại số lượng sách
          };
        }
        toast.success("Đã cập nhật tác giả thành công");
      } else {
        toast.error(response.message || "Lỗi khi cập nhật tác giả");
      }
    } else {
      // Thêm tác giả mới
      const response = await authorService.createAuthor({
        name: authorForm.value.name,
        bio: authorForm.value.bio,
      });

      if (response.success) {
        // Thêm vào mảng authors với bookCount = 0
        authors.value.push({
          ...response.data,
          bookCount: 0,
        });
        toast.success("Đã thêm tác giả mới thành công");
      } else {
        toast.error(response.message || "Lỗi khi thêm tác giả mới");
      }
    }

    // Đóng modal
    if (authorModal) {
      authorModal.hide();
    }
  } catch (error) {
    console.error("Lỗi khi lưu tác giả:", error);
    toast.error(
      "Lỗi khi lưu tác giả: " + (error.response?.data?.message || error.message)
    );
  } finally {
    isLoading.value = false;
  }
};

// Modal xóa tác giả
const openDeleteModal = (author) => {
  authorToDelete.value = author;
  if (deleteModal) {
    deleteModal.show();
  }
};

const deleteAuthor = async () => {
  if (!authorToDelete.value) return;

  try {
    isLoading.value = true;

    const response = await authorService.deleteAuthor(authorToDelete.value._id);

    if (response.success) {
      // Xóa khỏi mảng authors
      const index = authors.value.findIndex(
        (a) => a._id === authorToDelete.value._id
      );
      if (index !== -1) {
        authors.value.splice(index, 1);
      }
      toast.success("Đã xóa tác giả thành công");

      // Đóng modal
      if (deleteModal) {
        deleteModal.hide();
      }
    } else {
      toast.error(response.message || "Không thể xóa tác giả");
    }
  } catch (error) {
    console.error("Lỗi khi xóa tác giả:", error);
    toast.error(
      "Lỗi khi xóa tác giả: " + (error.response?.data?.message || error.message)
    );
  } finally {
    isLoading.value = false;
  }
};

// Modal xem chi tiết tác giả
const viewAuthor = async (author) => {
  selectedAuthor.value = author;
  authorDetails.value = null;

  if (viewModal) {
    viewModal.show();

    // Lấy chi tiết tác giả bao gồm danh sách sách
    try {
      authorDetailsLoading.value = true;
      const response = await authorService.getAuthorDetail(author._id);

      if (response.success) {
        authorDetails.value = response.data;
      } else {
        toast.error("Không thể tải chi tiết tác giả");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết tác giả:", error);
      toast.error("Lỗi khi tải chi tiết tác giả");
    } finally {
      authorDetailsLoading.value = false;
    }
  }
};

// Lắng nghe sự thay đổi trong tìm kiếm
watch([searchQuery, pageSize], () => {
  currentPage.value = 1; // Reset về trang đầu khi thay đổi bộ lọc
});

// Validations cho form input
watch(
  () => authorForm.value.name,
  (newName) => {
    nameError.value = validateName(newName);
  }
);

watch(
  () => authorForm.value.bio,
  (newBio) => {
    bioError.value = validateBio(newBio);
  }
);

// Khởi tạo
onMounted(async () => {
  // Tải dữ liệu
  await fetchAuthors();

  // Khởi tạo các modal Bootstrap
  import("bootstrap/js/dist/modal").then((module) => {
    const Modal = module.default;

    const authorModalEl = document.getElementById("authorModal");
    if (authorModalEl) {
      authorModal = new Modal(authorModalEl);
    }

    const deleteModalEl = document.getElementById("deleteAuthorModal");
    if (deleteModalEl) {
      deleteModal = new Modal(deleteModalEl);
    }

    const viewModalEl = document.getElementById("viewAuthorModal");
    if (viewModalEl) {
      viewModal = new Modal(viewModalEl);
    }
  });
});
</script>

<style scoped>
.author-management h1 {
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

.text-xs {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.page-link {
  color: #3c4b64;
}

.page-item.active .page-link {
  background-color: #4e73df;
  border-color: #4e73df;
}

table th,
table td {
  vertical-align: middle;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
  margin: 0 3px;
}

/* Giới hạn độ rộng và hiển thị dấu ... cho text dài */
table td {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Cột tên tác giả rộng hơn */
table td:nth-child(2) {
  max-width: 250px;
}

/* Cột slug */
table td:nth-child(3) {
  max-width: 200px;
}

/* Cột số thứ tự, số sách, ngày thêm và thao tác không bị giới hạn */
table td:nth-child(1),
table td:nth-child(4),
table td:nth-child(5),
table td:nth-child(6) {
  max-width: none;
  white-space: nowrap;
}
</style>
