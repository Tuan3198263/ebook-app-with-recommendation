<template>
  <div class="profile-licenses">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0"><i class="fas fa-key me-2"></i>Bản quyền sách</h5>

      <!-- Bộ lọc và sắp xếp -->
      <div class="filter-bar d-flex gap-2">
        <!-- Bộ lọc theo trạng thái -->
        <div class="dropdown">
          <button
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            id="filterDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {{ getStatusFilterText() }}
          </button>
          <ul
            class="dropdown-menu dropdown-menu-end"
            aria-labelledby="filterDropdown"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="filterByStatus(null)"
                >Tất cả</a
              >
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="filterByStatus('active')"
                >Còn hiệu lực</a
              >
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="filterByStatus('expired')"
                >Hết hạn</a
              >
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="filterByStatus('suspended')"
                >Tạm khóa</a
              >
            </li>
          </ul>
        </div>

        <!-- Sắp xếp -->
        <div class="dropdown">
          <button
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            id="sortDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {{ getSortText() }}
          </button>
          <ul
            class="dropdown-menu dropdown-menu-end"
            aria-labelledby="sortDropdown"
          >
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="sortBy('newest')"
                >Mới nhất</a
              >
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                @click.prevent="sortBy('oldest')"
                >Cũ nhất</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card-body">
      <!-- Trạng thái thống kê -->
      <div class="license-stats mb-4">
        <div class="row">
          <div class="col-6 col-md-3">
            <div class="stat-item">
              <div class="stat-value">{{ stats.active || 0 }}</div>
              <div class="stat-label">Còn hiệu lực</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-item">
              <div class="stat-value">{{ stats.expired || 0 }}</div>
              <div class="stat-label">Hết hạn</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-item">
              <div class="stat-value">{{ stats.suspended || 0 }}</div>
              <div class="stat-label">Tạm khóa</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-item">
              <div class="stat-value">{{ totalLicenses }}</div>
              <div class="stat-label">Tổng cộng</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải danh sách bản quyền...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center my-5">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
        <p class="text-danger">{{ error }}</p>
        <button class="btn btn-primary" @click="fetchLicenses">
          <i class="fas fa-redo me-1"></i>Thử lại
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="licenses.length === 0" class="text-center my-5">
        <i class="fas fa-book-open fa-3x mb-3 text-muted"></i>
        <p>Bạn chưa có bản quyền sách nào.</p>
        <router-link to="/" class="btn btn-primary">
          <i class="fas fa-search me-1"></i>Khám phá sách ngay
        </router-link>
      </div>

      <!-- Licenses Grid -->
      <div v-else class="licenses-grid">
        <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          <div v-for="license in licenses" :key="license._id" class="col">
            <LicenseCard
              :license="license"
              @click="viewLicenseDetails(license._id)"
            />
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
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import licenseService from "@/services/licenseService";
import ProductPagination from "@/components/category/ProductPagination.vue";
import LicenseCard from "@/components/profile/LicenseCard.vue";

const router = useRouter();
const toast = useToast();

// State
const licenses = ref([]);
const totalPages = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const error = ref(null);
const statusFilter = ref(null);
const sortOrder = ref("newest");
const stats = ref({});
const limit = 6;

// Tổng số bản quyền
const totalLicenses = computed(() => {
  return Object.values(stats.value).reduce((sum, val) => sum + (val || 0), 0);
});

// Methods
const fetchLicenses = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      page: currentPage.value,
      limit: limit,
    };

    // Thêm bộ lọc trạng thái nếu có
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }

    // Thêm sắp xếp
    if (sortOrder.value === "oldest") {
      params.sort = "createdAt";
    } else {
      params.sort = "-createdAt"; // Mặc định sắp xếp giảm dần (mới nhất trước)
    }

    const response = await licenseService.getUserEbookLicenses(params);

    if (response.success) {
      licenses.value = response.licenses;
      totalPages.value = response.pagination.totalPages;
      currentPage.value = response.pagination.currentPage;
      stats.value = response.stats;
    } else {
      throw new Error(response.message || "Không thể tải danh sách bản quyền");
    }
  } catch (err) {
    error.value = err.message || "Có lỗi xảy ra khi tải danh sách bản quyền";
    console.error("Error fetching licenses:", err);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const filterByStatus = (status) => {
  if (statusFilter.value !== status) {
    statusFilter.value = status;
    currentPage.value = 1; // Reset về trang 1 khi lọc
    fetchLicenses();
  }
};

const sortBy = (sort) => {
  if (sortOrder.value !== sort) {
    sortOrder.value = sort;
    fetchLicenses();
  }
};

const viewLicenseDetails = (licenseId) => {
  router.push(`/profile/licenses/${licenseId}`);
};

const getStatusFilterText = () => {
  switch (statusFilter.value) {
    case "active":
      return "Còn hiệu lực";
    case "expired":
      return "Đã hết hạn";
    case "suspended":
      return "Tạm khóa";
    default:
      return "Tất cả trạng thái";
  }
};

const getSortText = () => {
  return sortOrder.value === "newest" ? "Mới nhất" : "Cũ nhất";
};

// Watch for page changes
watch(
  () => currentPage.value,
  () => {
    fetchLicenses();
  }
);

// Lifecycle
onMounted(() => {
  fetchLicenses();
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

.licenses-grid {
  margin-bottom: 2rem;
}

/* Styling cho stats */
.license-stats {
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background-color: #e9ecef;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #495057;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

/* Filter và Sort */
.filter-bar {
  flex-wrap: wrap;
}

/* Loading states */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Empty state */
.fa-book-open {
  color: #6c757d;
}

/* Responsive */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }

  .licenses-grid .row {
    --bs-gutter-x: 1rem;
    --bs-gutter-y: 1rem;
  }

  .filter-bar {
    flex-direction: column;
    gap: 0.5rem !important;
    align-items: flex-end;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 576px) {
  .license-stats .row {
    row-gap: 1rem;
  }
}
</style>
