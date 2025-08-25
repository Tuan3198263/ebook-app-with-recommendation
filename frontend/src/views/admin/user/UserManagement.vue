<template>
  <div class="user-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản lý người dùng</h1>
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
                  Tổng số người dùng
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ totalUsers }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-users fa-2x text-gray-300"></i>
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
                  Admin
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ adminCount }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-user-shield fa-2x text-gray-300"></i>
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
                  Người dùng hoạt động
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ activeCount }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-user-check fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bảng quản lý người dùng với các bộ lọc -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h6 class="m-0 font-weight-bold text-primary">
              Danh sách người dùng
            </h6>
          </div>
          <div class="col-md-6">
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Tìm kiếm người dùng..."
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
                  <label class="form-label">Vai trò</label>
                  <select class="form-select" v-model="filters.role">
                    <option value="">Tất cả</option>
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <!-- Xóa bộ lọc trạng thái -->
                <div class="col-md-3 mb-2">
                  <label class="form-label">Khoa/Ngành</label>
                  <input
                    class="form-control"
                    v-model="filters.faculty"
                    placeholder="Nhập khoa/ngành"
                  />
                </div>
                <div class="col-md-3 mb-2">
                  <label class="form-label">Email</label>
                  <input
                    class="form-control"
                    v-model="filters.email"
                    placeholder="Nhập email"
                  />
                </div>
              </div>
              <div class="row mt-2">
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
                  {{ filteredUsers.length }} người dùng
                </span>
              </div>
            </div>

            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th scope="col" class="text-center">#</th>
                  <th scope="col">Tên</th>
                  <th scope="col">Email</th>
                  <th scope="col">Vai trò</th>
                  <th scope="col">Khoa</th>
                  <th scope="col">Ngành</th>
                  <th scope="col" class="text-center" style="min-width: 150px">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedUsers.length === 0">
                  <td colspan="7" class="text-center py-4">
                    <i class="fas fa-search me-2"></i>
                    Không tìm thấy người dùng nào phù hợp
                  </td>
                </tr>
                <tr v-for="(user, index) in paginatedUsers" :key="user._id">
                  <td class="text-center">{{ startIndex + index + 1 }}</td>
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="
                        user.role === 'admin' ? 'bg-success' : 'bg-secondary'
                      "
                    >
                      {{ user.role === "admin" ? "Admin" : "Student" }}
                    </span>
                  </td>
                  <td>{{ user.faculty || "-" }}</td>
                  <td>{{ user.major || "-" }}</td>
                  <td class="text-center">
                    <div class="btn-group">
                      <button
                        class="btn btn-sm btn-outline-info"
                        @click="viewUser(user)"
                        title="Xem chi tiết"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="editUser(user)"
                        title="Chỉnh sửa"
                      >
                        <i class="fas fa-edit"></i>
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

    <!-- Modal chi tiết và chỉnh sửa user -->
    <UserDetailModal
      :userId="selectedUserId"
      :show="showUserDetail"
      @close="closeUserDetail"
    />
    <UserEditModal
      :userId="editUserId"
      :show="showEditUser"
      @close="closeEditUser"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import userService from "../../../services/userService";
import UserDetailModal from "../../../components/admin/UserDetailModal.vue";
import UserEditModal from "../../../components/admin/UserEditModal.vue";

const toast = useToast();

const users = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const sortField = ref("createdAt");
const sortDirection = ref("desc");
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([10, 20, 50, 100]);
const showFilters = ref(false);
const filters = ref({
  role: "",
  active: "",
  faculty: "",
  email: "",
});
const selectedUserId = ref(null);
const showUserDetail = ref(false);
const editUserId = ref(null);
const showEditUser = ref(false);

const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await userService.getAllUsers();
    if (response.success) {
      users.value = response.data || [];
    } else {
      toast.error("Không thể tải dữ liệu người dùng");
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu người dùng:", error);
    toast.error("Không thể tải dữ liệu người dùng");
  } finally {
    loading.value = false;
  }
};

// Thống kê
const totalUsers = computed(() => users.value.length);
const adminCount = computed(
  () => users.value.filter((u) => u.role === "admin").length
);
const activeCount = computed(() => users.value.filter((u) => u.active).length);

// Lọc người dùng
const filteredUsers = computed(() => {
  let result = [...users.value];
  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.faculty?.toLowerCase().includes(query)
    );
  }
  if (filters.value.role) {
    result = result.filter((user) => user.role === filters.value.role);
  }
  if (filters.value.active !== "") {
    const isActive = filters.value.active === "true";
    result = result.filter((user) => user.active === isActive);
  }
  if (filters.value.faculty) {
    result = result.filter((user) =>
      user.faculty?.toLowerCase().includes(filters.value.faculty.toLowerCase())
    );
  }
  if (filters.value.email) {
    result = result.filter((user) =>
      user.email?.toLowerCase().includes(filters.value.email.toLowerCase())
    );
  }
  // Sắp xếp
  result.sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField.value === "email") {
      comparison = a.email.localeCompare(b.email);
    } else if (sortField.value === "createdAt") {
      comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    return sortDirection.value === "asc" ? comparison : -comparison;
  });
  return result;
});

// Phân trang
const totalPages = computed(() =>
  Math.ceil(filteredUsers.value.length / pageSize.value)
);
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value);
const paginatedUsers = computed(() =>
  filteredUsers.value.slice(startIndex.value, startIndex.value + pageSize.value)
);
const displayedItemCount = computed(() =>
  Math.min(
    startIndex.value + paginatedUsers.value.length,
    filteredUsers.value.length
  )
);
const visiblePageNumbers = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  } else {
    let startPage = Math.max(
      1,
      currentPage.value - Math.floor(maxVisiblePages / 2)
    );
    let endPage = startPage + maxVisiblePages - 1;
    if (endPage > totalPages.value) {
      endPage = totalPages.value;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
  }
  return pages;
});

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};
const applyFilters = () => {
  currentPage.value = 1;
};
const resetFilters = () => {
  filters.value = { role: "", active: "", faculty: "", email: "" };
  currentPage.value = 1;
};
const viewUser = (user) => {
  selectedUserId.value = user._id;
  showUserDetail.value = true;
};
const closeUserDetail = () => {
  showUserDetail.value = false;
  selectedUserId.value = null;
};
const editUser = (user) => {
  editUserId.value = user._id;
  showEditUser.value = true;
};
const closeEditUser = () => {
  showEditUser.value = false;
  editUserId.value = null;
};

watch([searchQuery, pageSize], () => {
  currentPage.value = 1;
});

onMounted(async () => {
  await fetchUsers();
});
</script>

<style scoped>
.user-management h1 {
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
.filter-section {
  transition: all 0.3s ease;
}
.filters-container {
  animation: fadeIn 0.3s ease;
}
table td {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
table td:nth-child(2) {
  max-width: 250px;
}
table td:last-child {
  max-width: none;
  white-space: nowrap;
}
table td:nth-child(1) {
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
