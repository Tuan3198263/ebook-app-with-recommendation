<template>
  <div class="category-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản lý danh mục</h1>
      <button class="btn btn-primary" @click="openAddModal">
        <i class="fas fa-plus me-1"></i> Thêm danh mục mới
      </button>
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
                  Tổng số danh mục
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ totalCategories }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-list fa-2x text-gray-300"></i>
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
                  Danh mục kích hoạt
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ activeCategories }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-check-circle fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-left-warning shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-warning text-uppercase mb-1"
                >
                  Danh mục ẩn
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ inactiveCategories }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-eye-slash fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bảng quản lý danh mục -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <div class="row align-items-center">
          <div class="col-md-8 d-flex align-items-center">
            <h6 class="m-0 font-weight-bold text-primary me-4">
              Danh sách danh mục
            </h6>
            <div class="form-check form-switch ms-2">
              <input
                class="form-check-input"
                type="checkbox"
                id="showInactive"
                v-model="showInactive"
              />
              <label class="form-check-label" for="showInactive"
                >Hiện danh mục ẩn</label
              >
            </div>
          </div>
          <div class="col-md-4">
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Tìm kiếm danh mục..."
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
                {{ filteredCategories.length }} danh mục
              </span>
            </div>
          </div>

          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th scope="col" class="text-center">#</th>
                <th scope="col">
                  <div class="d-flex align-items-center">
                    Tên danh mục
                    <button class="btn btn-sm" @click="toggleSort('name')">
                      <i :class="getSortIcon('name')"></i>
                    </button>
                  </div>
                </th>
                <th scope="col">Slug</th>
                <th scope="col" class="text-center">
                  <div class="d-flex align-items-center">
                    Trạng thái
                    <button class="btn btn-sm" @click="toggleSort('active')">
                      <i :class="getSortIcon('active')"></i>
                    </button>
                  </div>
                </th>
                <th scope="col" class="text-center">
                  <div class="d-flex align-items-center">
                    Ngày tạo
                    <button class="btn btn-sm" @click="toggleSort('createdAt')">
                      <i :class="getSortIcon('createdAt')"></i>
                    </button>
                  </div>
                </th>
                <th scope="col" class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedCategories.length === 0">
                <td colspan="6" class="text-center py-4">
                  <i class="fas fa-search me-2"></i>
                  Không tìm thấy danh mục nào
                </td>
              </tr>
              <tr
                v-for="(category, index) in paginatedCategories"
                :key="category._id"
              >
                <td class="text-center">{{ startIndex + index + 1 }}</td>
                <td>{{ category.name }}</td>
                <td>{{ category.slug }}</td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="category.active ? 'bg-success' : 'bg-warning'"
                  >
                    {{ category.active ? "Hiện" : "Ẩn" }}
                  </span>
                </td>
                <td class="text-center">
                  {{ formatDate(category.createdAt) }}
                </td>
                <td class="text-center">
                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="openEditModal(category)"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-sm"
                      :class="
                        category.active
                          ? 'btn-outline-warning'
                          : 'btn-outline-success'
                      "
                      @click="toggleCategoryStatus(category)"
                    >
                      <i
                        class="fas"
                        :class="category.active ? 'fa-eye-slash' : 'fa-eye'"
                      ></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="openDeleteModal(category)"
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

    <!-- Modal thêm/sửa danh mục -->
    <div
      class="modal fade"
      id="addCategoryModal"
      tabindex="-1"
      aria-labelledby="addCategoryModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addCategoryModalLabel">
              {{ isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCategory">
              <div class="mb-3">
                <label for="categoryName" class="form-label"
                  >Tên danh mục <span class="text-danger">*</span></label
                >
                <input
                  type="text"
                  class="form-control"
                  id="categoryName"
                  v-model="categoryForm.name"
                  required
                  :class="{ 'is-invalid': !!nameError }"
                  maxlength="100"
                />
                <div class="invalid-feedback" v-if="nameError">
                  {{ nameError }}
                </div>
                <div class="form-text">
                  Tên danh mục không được chứa ký tự đặc biệt và không quá 100
                  ký tự
                </div>
              </div>
              <div class="mb-3">
                <label for="categorySlug" class="form-label">Slug</label>
                <input
                  type="text"
                  class="form-control"
                  id="categorySlug"
                  v-model="categoryForm.slug"
                  disabled
                />
                <div class="form-text text-muted">
                  Slug sẽ được tự động tạo từ tên danh mục
                </div>
              </div>
              <div class="mb-3 form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="categoryActive"
                  v-model="categoryForm.active"
                />
                <label class="form-check-label" for="categoryActive"
                  >Kích hoạt danh mục</label
                >
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
              @click="saveCategory"
              :disabled="!categoryForm.name || !!nameError || isLoading"
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

    <!-- Modal xóa danh mục -->
    <div
      class="modal fade"
      id="deleteCategoryModal"
      tabindex="-1"
      aria-labelledby="deleteCategoryModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteCategoryModalLabel">
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
              Bạn có chắc chắn muốn xóa danh mục
              <strong>"{{ categoryToDelete?.name }}"</strong> không?
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
              @click="deleteCategory"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import categoryService from "../../../services/categoryService";
import slugify from "slugify";

const toast = useToast();

// Các biến trạng thái
const categories = ref([]);
const loading = ref(false);
const isLoading = ref(false);
const showInactive = ref(true);
const searchQuery = ref("");
const sortField = ref("createdAt");
const sortDirection = ref("desc");
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([5, 10, 15, 20, 50]);

// Biến cho modal và form
const categoryForm = ref({ name: "", slug: "", active: true });
const isEditing = ref(false);
const categoryToDelete = ref(null);
const nameError = ref("");
let addEditModal = null;
let deleteModal = null;

// Tính toán các số liệu
const totalCategories = computed(() => categories.value.length);
const activeCategories = computed(
  () => categories.value.filter((c) => c.active).length
);
const inactiveCategories = computed(
  () => categories.value.filter((c) => !c.active).length
);

// Validate tên danh mục
const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return "Vui lòng nhập tên danh mục";
  }

  if (name.length > 100) {
    return "Tên danh mục không được quá 100 ký tự";
  }

  // Kiểm tra ký tự đặc biệt - giống regex trong model ở server
  const regex =
    /^[a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+$/;
  if (!regex.test(name)) {
    return "Tên danh mục không được chứa ký tự đặc biệt";
  }

  return "";
};

// Lọc danh mục dựa trên trạng thái và từ khóa tìm kiếm
const filteredCategories = computed(() => {
  let result = [...categories.value];

  // Lọc theo trạng thái
  if (!showInactive.value) {
    result = result.filter((cat) => cat.active);
  }

  // Lọc theo từ khóa tìm kiếm
  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
    );
  }

  // Sắp xếp
  result.sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField.value === "active") {
      comparison = a.active === b.active ? 0 : a.active ? -1 : 1;
    } else if (sortField.value === "createdAt") {
      comparison = new Date(a.createdAt) - new Date(b.createdAt);
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });

  return result;
});

// Phân trang
const totalPages = computed(() => {
  return Math.ceil(filteredCategories.value.length / pageSize.value);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value;
});

const paginatedCategories = computed(() => {
  const start = startIndex.value;
  const end = start + pageSize.value;
  return filteredCategories.value.slice(start, end);
});

const displayedItemCount = computed(() => {
  return Math.min(
    startIndex.value + paginatedCategories.value.length,
    filteredCategories.value.length
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

// Lấy dữ liệu danh mục từ API
const fetchCategories = async () => {
  try {
    loading.value = true;
    const response = await categoryService.getAllCategories(true); // Lấy tất cả danh mục (kể cả đã ẩn)
    if (response.success) {
      categories.value = response.data || [];
    } else {
      toast.error("Không thể tải danh mục");
    }
  } catch (error) {
    console.error("Lỗi khi tải danh mục:", error);
    toast.error(
      "Lỗi khi tải danh mục: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    loading.value = false;
  }
};

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

// Xử lý các modal
const openAddModal = () => {
  isEditing.value = false;
  categoryForm.value = { name: "", slug: "", active: true };
  nameError.value = "";
  if (addEditModal) {
    addEditModal.show();
  }
};

const openEditModal = (category) => {
  isEditing.value = true;
  categoryForm.value = { ...category };
  nameError.value = "";
  if (addEditModal) {
    addEditModal.show();
  }
};

const saveCategory = async () => {
  // Validate form
  nameError.value = validateName(categoryForm.value.name);
  if (nameError.value) {
    return;
  }

  try {
    isLoading.value = true;

    if (isEditing.value) {
      // Cập nhật danh mục
      const response = await categoryService.updateCategory(
        categoryForm.value._id,
        {
          name: categoryForm.value.name,
          active: categoryForm.value.active,
        }
      );

      if (response.success) {
        // Cập nhật vào mảng categories
        const index = categories.value.findIndex(
          (c) => c._id === categoryForm.value._id
        );
        if (index !== -1) {
          categories.value[index] = response.data;
        }
        toast.success("Đã cập nhật danh mục thành công");
      } else {
        toast.error(response.message || "Lỗi khi cập nhật danh mục");
      }
    } else {
      // Thêm danh mục mới
      const response = await categoryService.createCategory({
        name: categoryForm.value.name,
        active: categoryForm.value.active,
      });

      if (response.success) {
        // Thêm vào mảng categories
        categories.value.push(response.data);
        toast.success("Đã thêm danh mục mới thành công");
      } else {
        toast.error(response.message || "Lỗi khi thêm danh mục mới");
      }
    }

    // Đóng modal
    if (addEditModal) {
      addEditModal.hide();
    }
  } catch (error) {
    console.error("Lỗi khi lưu danh mục:", error);

    // Kiểm tra lỗi trùng tên
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("đã tồn tại")
    ) {
      nameError.value = "Tên danh mục đã tồn tại";
    } else {
      toast.error(
        "Lỗi khi lưu danh mục: " +
          (error.response?.data?.message || error.message)
      );
    }
  } finally {
    isLoading.value = false;
  }
};

const openDeleteModal = (category) => {
  categoryToDelete.value = category;
  if (deleteModal) {
    deleteModal.show();
  }
};

const deleteCategory = async () => {
  if (!categoryToDelete.value) return;

  try {
    isLoading.value = true;

    const response = await categoryService.deleteCategory(
      categoryToDelete.value._id
    );

    if (response.success) {
      // Xóa khỏi mảng categories
      const index = categories.value.findIndex(
        (c) => c._id === categoryToDelete.value._id
      );
      if (index !== -1) {
        categories.value.splice(index, 1);
      }
      toast.success("Đã xóa danh mục thành công");

      // Đóng modal
      if (deleteModal) {
        deleteModal.hide();
      }
    } else {
      toast.error(response.message || "Không thể xóa danh mục");
    }
  } catch (error) {
    console.error("Lỗi khi xóa danh mục:", error);
    toast.error(
      "Lỗi khi xóa danh mục: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    isLoading.value = false;
  }
};

const toggleCategoryStatus = async (category) => {
  try {
    const response = await categoryService.toggleCategoryStatus(category._id);

    if (response.success) {
      // Cập nhật trạng thái trong mảng
      const index = categories.value.findIndex((c) => c._id === category._id);
      if (index !== -1) {
        categories.value[index] = response.data;
      }
      const status = response.data.active ? "hiển thị" : "ẩn";
      toast.info(`Đã chuyển trạng thái danh mục thành ${status}`);
    } else {
      toast.error(response.message || "Không thể thay đổi trạng thái danh mục");
    }
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái:", error);
    toast.error(
      "Lỗi khi thay đổi trạng thái: " +
        (error.response?.data?.message || error.message)
    );
  }
};

// Lắng nghe sự thay đổi trong tìm kiếm hoặc hiển thị
watch([searchQuery, showInactive, pageSize], () => {
  currentPage.value = 1; // Reset về trang đầu khi thay đổi bộ lọc
});

// Theo dõi khi giá trị của name thay đổi để cập nhật slug và validate
watch(
  () => categoryForm.value.name,
  (newName) => {
    // Tạo slug từ tên (chỉ cho mục hiển thị)
    if (newName) {
      categoryForm.value.slug = slugify(newName, {
        lower: true,
        locale: "vi",
        strict: true,
      });

      // Validate tên
      nameError.value = validateName(newName);
    } else {
      categoryForm.value.slug = "";
      nameError.value = "Vui lòng nhập tên danh mục";
    }
  }
);

// Khởi tạo
onMounted(async () => {
  // Tải danh mục
  await fetchCategories();

  // Khởi tạo các modal Bootstrap
  import("bootstrap/js/dist/modal").then((module) => {
    const Modal = module.default;

    // Initialize add/edit modal
    const addModalEl = document.getElementById("addCategoryModal");
    if (addModalEl) {
      addEditModal = new Modal(addModalEl);
    }

    // Initialize delete modal
    const deleteModalEl = document.getElementById("deleteCategoryModal");
    if (deleteModalEl) {
      deleteModal = new Modal(deleteModalEl);
    }
  });
});
</script>

<style scoped>
.category-management h1 {
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

.border-left-warning {
  border-left: 0.25rem solid #f6c23e !important;
}

.text-xs {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
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
  margin: 0 3px;
}

.modal-header {
  background-color: #f8f9fc;
}

/* Giới hạn độ rộng và hiển thị dấu ... cho text dài */
table td {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Cột tên danh mục rộng hơn */
table td:nth-child(2) {
  max-width: 250px;
}

/* Cột slug */
table td:nth-child(3) {
  max-width: 200px;
}

/* Cột số thứ tự, trạng thái, ngày tạo và thao tác không bị giới hạn */
table td:nth-child(1),
table td:nth-child(4),
table td:nth-child(5),
table td:nth-child(6) {
  max-width: none;
  white-space: nowrap;
}
</style>
