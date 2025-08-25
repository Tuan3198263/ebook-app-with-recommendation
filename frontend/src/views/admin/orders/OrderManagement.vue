<template>
  <div class="order-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1><i class="fas fa-shopping-cart me-2"></i>Quản lý đơn hàng</h1>
      <button class="btn btn-primary" @click="fetchOrders">
        <i class="fas fa-sync-alt me-1"></i>Làm mới
      </button>
    </div>

    <!-- Thẻ thông tin tổng quan -->
    <div class="row mb-4">
      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-primary shadow h-100">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-primary text-uppercase mb-1"
                >
                  Tổng đơn hàng
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stats.total || 0 }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-warning shadow h-100">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-warning text-uppercase mb-1"
                >
                  Chờ thanh toán
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stats.pending || 0 }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-clock fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-success shadow h-100">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-success text-uppercase mb-1"
                >
                  Hoàn thành
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stats.completed || 0 }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-check-circle fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-danger shadow h-100">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-danger text-uppercase mb-1"
                >
                  Đã hủy/Thất bại
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ (stats.canceled || 0) + (stats.failed || 0) }}
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-times-circle fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bảng quản lý đơn hàng với các bộ lọc -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="m-0 font-weight-bold text-primary">Danh sách đơn hàng</h6>
          <button
            class="btn btn-outline-primary btn-sm"
            @click="toggleFilters"
            :class="{ active: showFilters }"
          >
            <i class="fas fa-filter me-1"></i>Bộ lọc
          </button>
        </div>
      </div>

      <!-- Bộ lọc -->
      <div v-if="showFilters" class="card-body border-bottom filter-section">
        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label">Tìm kiếm</label>
            <input
              type="text"
              class="form-control"
              placeholder="Mã đơn hàng, email khách hàng..."
              v-model="searchQuery"
            />
          </div>
          <div class="col-md-2 mb-3">
            <label class="form-label">Trạng thái</label>
            <select class="form-select" v-model="filters.status">
              <option value="">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Thất bại</option>
              <option value="canceled">Đã hủy</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>
          <div class="col-md-2 mb-3">
            <label class="form-label">Phương thức</label>
            <select class="form-select" v-model="filters.paymentMethod">
              <option value="">Tất cả</option>
              <option value="vnpay">VNPay</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div class="col-md-2 mb-3">
            <label class="form-label">Từ ngày</label>
            <input
              type="date"
              class="form-control"
              v-model="filters.fromDate"
            />
          </div>
          <div class="col-md-2 mb-3">
            <label class="form-label">Đến ngày</label>
            <input type="date" class="form-control" v-model="filters.toDate" />
          </div>
          <div class="col-md-1 mb-3 d-flex align-items-end">
            <button
              class="btn btn-outline-secondary w-100"
              @click="resetFilters"
            >
              <i class="fas fa-undo"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="card-body">
        <!-- Điều khiển hiển thị -->
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <label class="form-label me-2 mb-0">Hiển thị:</label>
              <select
                class="form-select me-3"
                style="width: 80px"
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
            </div>
          </div>
          <div class="col-md-6 text-end">
            <div class="btn-group">
              <button
                class="btn btn-outline-secondary btn-sm"
                @click="toggleSort('createdAt')"
              >
                <i :class="getSortIcon('createdAt')"></i> Ngày tạo
              </button>
              <button
                class="btn btn-outline-secondary btn-sm"
                @click="toggleSort('totalAmount')"
              >
                <i :class="getSortIcon('totalAmount')"></i> Tổng tiền
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
          <p class="mt-2">Đang tải danh sách đơn hàng...</p>
        </div>

        <!-- Bảng đơn hàng -->
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th style="width: 80px">#</th>
                <th>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Số sách</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style="width: 200px">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(order, index) in paginatedOrders" :key="order._id">
                <td>{{ startIndex + index + 1 }}</td>
                <td>
                  <strong class="text-primary">{{ order.orderCode }}</strong>
                  <br />
                  <small class="text-muted">{{
                    order.paymentMethod === "vnpay"
                      ? "VNPay"
                      : order.paymentMethod
                  }}</small>
                </td>
                <td>
                  <div>{{ order.user?.name || "N/A" }}</div>
                  <small class="text-muted">{{
                    order.user?.email || "N/A"
                  }}</small>
                </td>
                <td>{{ order.totalItems || order.items?.length || 0 }} cuốn</td>
                <td>
                  <strong class="text-success">{{
                    formatPrice(order.totalAmount)
                  }}</strong>
                </td>
                <td>
                  <span
                    :class="getStatusBadgeClass(order.orderStatus)"
                    class="badge"
                  >
                    {{ getStatusText(order.orderStatus) }}
                  </span>
                </td>
                <td>{{ formatDate(order.createdAt) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button
                      class="btn btn-outline-info"
                      @click="viewOrder(order)"
                      title="Xem chi tiết"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      v-if="canUpdateStatus(order)"
                      class="btn btn-outline-warning"
                      @click="openStatusModal(order)"
                      title="Cập nhật trạng thái"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      @click="openDeleteModal(order)"
                      title="Xóa đơn hàng"
                      :disabled="order.orderStatus !== 'canceled'"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedOrders.length === 0">
                <td colspan="8" class="text-center py-4">
                  <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p class="text-muted">Không có đơn hàng nào</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Phân trang -->
        <nav v-if="totalPages > 1" aria-label="Phân trang đơn hàng">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button
                class="page-link"
                @click="currentPage = 1"
                :disabled="currentPage === 1"
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button
                class="page-link"
                @click="currentPage--"
                :disabled="currentPage === 1"
              >
                <i class="fas fa-angle-left"></i>
              </button>
            </li>

            <li
              v-for="page in visiblePageNumbers"
              :key="page"
              class="page-item"
              :class="{ active: page === currentPage }"
            >
              <button class="page-link" @click="currentPage = page">
                {{ page }}
              </button>
            </li>

            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages }"
            >
              <button
                class="page-link"
                @click="currentPage++"
                :disabled="currentPage === totalPages"
              >
                <i class="fas fa-angle-right"></i>
              </button>
            </li>
            <li
              class="page-item"
              :class="{ disabled: currentPage === totalPages }"
            >
              <button
                class="page-link"
                @click="currentPage = totalPages"
                :disabled="currentPage === totalPages"
              >
                <i class="fas fa-angle-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Modal cập nhật trạng thái -->
    <div class="modal fade" id="statusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Cập nhật trạng thái đơn hàng</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedOrder">
              <p><strong>Mã đơn hàng:</strong> {{ selectedOrder.orderCode }}</p>
              <p>
                <strong>Trạng thái hiện tại:</strong>
                <span
                  :class="getStatusBadgeClass(selectedOrder.orderStatus)"
                  class="badge"
                >
                  {{ getStatusText(selectedOrder.orderStatus) }}
                </span>
              </p>

              <div class="mb-3">
                <label class="form-label">Trạng thái mới</label>
                <select class="form-select" v-model="newStatus">
                  <option
                    v-for="status in getAvailableStatuses(
                      selectedOrder.orderStatus
                    )"
                    :key="status.value"
                    :value="status.value"
                  >
                    {{ status.label }}
                  </option>
                </select>
              </div>
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
              class="btn btn-primary"
              @click="updateStatus"
              :disabled="isLoading || !newStatus"
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal xóa đơn hàng -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-danger">Xóa đơn hàng</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedOrder">
              <p>
                <i class="fas fa-exclamation-triangle text-warning me-2"></i>Bạn
                có chắc chắn muốn xóa đơn hàng này?
              </p>
              <p><strong>Mã đơn hàng:</strong> {{ selectedOrder.orderCode }}</p>
              <p><strong>Khách hàng:</strong> {{ selectedOrder.user?.name }}</p>
              <p class="text-danger small">Hành động này không thể hoàn tác!</p>
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
              @click="deleteOrder"
              :disabled="isLoading"
            >
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
              ></span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Component modal chi tiết đơn hàng -->
    <OrderDetailModal
      :orderId="selectedOrderId"
      :show="showOrderDetail"
      @close="closeOrderDetail"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import orderService from "@/services/orderService";
import OrderDetailModal from "@/components/admin/OrderDetailModal.vue";
import { Modal } from "bootstrap";

const toast = useToast();

// Biến trạng thái
const orders = ref([]);
const stats = ref({});
const loading = ref(true);
const isLoading = ref(false);
const searchQuery = ref("");
const sortField = ref("createdAt");
const sortDirection = ref("desc");
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([10, 20, 50, 100]);
const showFilters = ref(false);
const filters = ref({
  status: "",
  paymentMethod: "",
  fromDate: "",
  toDate: "",
});

// Modal states
const selectedOrder = ref(null);
const selectedOrderId = ref(null);
const showOrderDetail = ref(false);
const newStatus = ref("");
let statusModal = null;
let deleteModal = null;

// Utility functions
const getStatusText = (status) => {
  const statusMap = {
    pending: "Chờ thanh toán",
    completed: "Hoàn thành",
    failed: "Thất bại",
    canceled: "Đã hủy",
    refunded: "Đã hoàn tiền",
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status) => {
  const classMap = {
    pending: "bg-warning text-dark",
    completed: "bg-success",
    failed: "bg-danger",
    canceled: "bg-secondary",
    refunded: "bg-info",
  };
  return classMap[status] || "bg-secondary";
};

const formatPrice = (price) => {
  if (!price) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

// Kiểm tra xem đơn hàng có được phép cập nhật trạng thái không
const canUpdateStatus = (order) => {
  // Chỉ cho phép cập nhật trạng thái với các đơn hàng chưa hoàn thành
  const updatableStatuses = ["pending", "failed"];
  return updatableStatuses.includes(order.orderStatus);
};

// Lấy danh sách trạng thái có thể cập nhật dựa trên trạng thái hiện tại
const getAvailableStatuses = (currentStatus) => {
  const allStatuses = [
    { value: "pending", label: "Chờ thanh toán" },
    { value: "completed", label: "Hoàn thành" },
    { value: "failed", label: "Thất bại" },
    { value: "canceled", label: "Đã hủy" },
    { value: "refunded", label: "Đã hoàn tiền" },
  ];

  // Logic nghiệp vụ cho việc chuyển trạng thái
  switch (currentStatus) {
    case "pending":
      return allStatuses.filter((s) =>
        ["completed", "failed", "canceled"].includes(s.value)
      );
    case "failed":
      return allStatuses.filter((s) =>
        ["pending", "canceled"].includes(s.value)
      );
    default:
      return allStatuses.filter((s) => s.value !== currentStatus);
  }
};

// Tải dữ liệu
const fetchOrders = async () => {
  try {
    loading.value = true;
    const response = await orderService.admin.getAllOrders();
    if (response.success) {
      orders.value = response.orders || [];
      stats.value = response.stats || {};
    } else {
      toast.error(response.message || "Không thể tải danh sách đơn hàng");
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách đơn hàng:", error);
    toast.error("Không thể tải danh sách đơn hàng");
  } finally {
    loading.value = false;
  }
};

// Lọc và sắp xếp
const filteredOrders = computed(() => {
  let result = [...orders.value];

  // Lọc theo tìm kiếm
  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (order) =>
        order.orderCode.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query)
    );
  }

  // Lọc theo trạng thái
  if (filters.value.status) {
    result = result.filter(
      (order) => order.orderStatus === filters.value.status
    );
  }

  // Lọc theo phương thức thanh toán
  if (filters.value.paymentMethod) {
    result = result.filter(
      (order) => order.paymentMethod === filters.value.paymentMethod
    );
  }

  // Lọc theo ngày
  if (filters.value.fromDate) {
    const fromDate = new Date(filters.value.fromDate);
    result = result.filter((order) => new Date(order.createdAt) >= fromDate);
  }

  if (filters.value.toDate) {
    const toDate = new Date(filters.value.toDate);
    toDate.setHours(23, 59, 59, 999);
    result = result.filter((order) => new Date(order.createdAt) <= toDate);
  }

  // Sắp xếp
  result.sort((a, b) => {
    let comparison = 0;
    if (sortField.value === "createdAt") {
      comparison = new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortField.value === "totalAmount") {
      comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
    }
    return sortDirection.value === "asc" ? comparison : -comparison;
  });

  return result;
});

// Phân trang
const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / pageSize.value);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value;
});

const paginatedOrders = computed(() => {
  return filteredOrders.value.slice(
    startIndex.value,
    startIndex.value + pageSize.value
  );
});

const displayedItemCount = computed(() => {
  return Math.min(
    startIndex.value + paginatedOrders.value.length,
    filteredOrders.value.length
  );
});

const visiblePageNumbers = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    let startPage = Math.max(
      1,
      currentPage.value - Math.floor(maxVisiblePages / 2)
    );
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages.value) {
      endPage = totalPages.value;
      startPage = endPage - maxVisiblePages + 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }

  return pages;
});

// Event handlers
const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
  currentPage.value = 1;
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

const resetFilters = () => {
  filters.value = {
    status: "",
    paymentMethod: "",
    fromDate: "",
    toDate: "",
  };
  searchQuery.value = "";
  currentPage.value = 1;
};

// Modal handlers
const viewOrder = (order) => {
  selectedOrderId.value = order._id;
  showOrderDetail.value = true;
};

const closeOrderDetail = () => {
  showOrderDetail.value = false;
  selectedOrderId.value = null;
};

const openStatusModal = (order) => {
  selectedOrder.value = order;
  // Không set newStatus.value = order.orderStatus để bắt buộc user chọn trạng thái mới
  newStatus.value = "";
  if (statusModal) {
    statusModal.show();
  }
};

const openDeleteModal = (order) => {
  selectedOrder.value = order;
  if (deleteModal) {
    deleteModal.show();
  }
};

const updateStatus = async () => {
  if (!selectedOrder.value || !newStatus.value) {
    toast.error("Vui lòng chọn trạng thái mới");
    return;
  }

  // Kiểm tra lại logic nghiệp vụ trước khi gửi request
  if (!canUpdateStatus(selectedOrder.value)) {
    toast.error("Đơn hàng này không thể cập nhật trạng thái");
    return;
  }

  try {
    isLoading.value = true;
    const response = await orderService.admin.updateOrderStatus(
      selectedOrder.value._id,
      newStatus.value
    );

    if (response.success) {
      toast.success("Cập nhật trạng thái thành công");
      await fetchOrders();
      if (statusModal) {
        statusModal.hide();
      }
    } else {
      toast.error(response.message || "Không thể cập nhật trạng thái");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái:", error);
    toast.error(error.message || "Không thể cập nhật trạng thái");
  } finally {
    isLoading.value = false;
  }
};

const deleteOrder = async () => {
  if (!selectedOrder.value) return;

  try {
    isLoading.value = true;
    const response = await orderService.admin.deleteOrder(
      selectedOrder.value._id
    );

    if (response.success) {
      toast.success(response.message || "Xóa đơn hàng thành công");
      await fetchOrders();
      if (deleteModal) {
        deleteModal.hide();
      }
    }
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng:", error);
    toast.error(error.message || "Không thể xóa đơn hàng");
  } finally {
    isLoading.value = false;
  }
};

// Watchers
watch([searchQuery, pageSize], () => {
  currentPage.value = 1;
});

// Initialize
onMounted(async () => {
  await fetchOrders();

  // Initialize modals
  const statusModalEl = document.getElementById("statusModal");
  if (statusModalEl) {
    statusModal = new Modal(statusModalEl);
  }

  const deleteModalEl = document.getElementById("deleteModal");
  if (deleteModalEl) {
    deleteModal = new Modal(deleteModalEl);
  }
});
</script>

<style scoped>
.order-management h1 {
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

.border-left-danger {
  border-left: 0.25rem solid #e74a3b !important;
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
