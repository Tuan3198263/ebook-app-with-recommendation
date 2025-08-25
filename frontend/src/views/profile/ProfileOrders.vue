<template>
  <div class="profile-orders" :key="`orders-${componentKey}`">
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center flex-wrap">
        <h5 class="mb-0">
          <i class="fas fa-shopping-bag me-2"></i>Đơn hàng của tôi
        </h5>
        <div class="header-actions d-flex gap-2 mt-2 mt-md-0">
          <!-- Sort Options -->
          <div class="dropdown">
            <button
              class="btn btn-sm dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              <i class="fas fa-sort me-1"></i>
              {{ getSortLabel(currentSort) }}
            </button>
            <ul class="dropdown-menu">
              <li>
                <button
                  class="dropdown-item"
                  :class="{ active: currentSort === 'newest' }"
                  @click="changeSort('newest')"
                >
                  <i class="fas fa-clock me-2"></i>Mới nhất
                </button>
              </li>
              <li>
                <button
                  class="dropdown-item"
                  :class="{ active: currentSort === 'oldest' }"
                  @click="changeSort('oldest')"
                >
                  <i class="fas fa-history me-2"></i>Cũ nhất
                </button>
              </li>
              <li>
                <button
                  class="dropdown-item"
                  :class="{ active: currentSort === 'highest_amount' }"
                  @click="changeSort('highest_amount')"
                >
                  <i class="fas fa-arrow-up me-2"></i>Giá cao
                </button>
              </li>
              <li>
                <button
                  class="dropdown-item"
                  :class="{ active: currentSort === 'lowest_amount' }"
                  @click="changeSort('lowest_amount')"
                >
                  <i class="fas fa-arrow-down me-2"></i>Giá thấp
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="card-body p-0">
      <!-- Status Tabs -->
      <div class="order-tabs">
        <div class="nav nav-tabs nav-fill" id="orderTabs" role="tablist">
          <button
            v-for="status in orderStatuses"
            :key="status.value"
            class="nav-link"
            :class="{ active: currentStatus === status.value }"
            @click="changeStatus(status.value)"
            type="button"
          >
            <i :class="status.icon" class="me-1"></i>
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- Orders Content -->
      <div class="orders-content p-3">
        <!-- Loading State -->
        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
          <p class="mt-2">Đang tải đơn hàng...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center my-5">
          <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
          <p class="text-danger">{{ error }}</p>
          <button class="btn btn-primary" @click="fetchOrders">
            <i class="fas fa-redo me-1"></i>Thử lại
          </button>
        </div>
        <!-- Empty State -->
        <div
          v-else-if="!Array.isArray(orders) || orders.length === 0"
          class="text-center my-5"
        >
          <i class="fas fa-shopping-bag fa-3x mb-3 text-muted"></i>
          <!-- Thành: -->
          <p class="text-muted">
            {{
              currentStatus === "all"
                ? "Bạn chưa có đơn hàng nào."
                : `Không có đơn hàng ${getStatusLabel(
                    currentStatus
                  ).toLowerCase()}.`
            }}
          </p>
          <router-link to="/" class="btn btn-primary">
            <i class="fas fa-shopping-cart me-1"></i>Mua sách ngay
          </router-link>
        </div>
        <!-- Orders List -->
        <div
          v-else-if="Array.isArray(orders) && orders.length > 0"
          class="orders-list"
          :key="componentKey"
        >
          <div
            v-for="order in orders.filter(
              (order) => order && order._id && order.orderCode
            )"
            :key="order._id"
            class="order-item mb-3"
          >
            <div class="order-card">
              <!-- Order Header -->
              <div class="order-header">
                <div class="row align-items-center">
                  <div class="col-md-8">
                    <div class="order-info">
                      <h6 class="order-code mb-1">
                        <i class="fas fa-receipt me-1"></i>
                        Đơn hàng: <strong>{{ order.orderCode }}</strong>
                      </h6>
                      <div class="order-meta">
                        <small class="text-muted">
                          <i class="fas fa-calendar me-1"></i>
                          {{ formatDate(order.createdAt) }}
                        </small>
                        <span class="mx-2">•</span>
                        <small class="text-muted">
                          <i class="fas fa-box me-1"></i>
                          {{ order.items?.length || 0 }} sản phẩm
                        </small>
                        <span class="mx-2">•</span>
                        <small class="text-muted">
                          <i class="fas fa-credit-card me-1"></i>
                          {{ getPaymentMethodLabel(order.paymentMethod) }}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4 text-md-end mt-2 mt-md-0">
                    <div class="order-status-info">
                      <span
                        class="badge order-status-badge mb-2"
                        :class="getStatusBadgeClass(order.orderStatus)"
                      >
                        <i
                          :class="getStatusIcon(order.orderStatus)"
                          class="me-1"
                        ></i>
                        {{ getStatusLabel(order.orderStatus) }}
                      </span>
                      <div class="order-total">
                        <strong class="text-primary fs-5">
                          {{ formatCurrency(order.totalAmount) }}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Order Actions -->
              <div class="order-actions mt-3 pt-3 border-top">
                <div class="d-flex justify-content-end gap-2">
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="viewOrderDetails(order._id)"
                  >
                    <i class="fas fa-eye me-1"></i>Xem chi tiết
                  </button>
                  <button
                    v-if="
                      canCancelOrder(order.orderStatus) && !processingAction
                    "
                    class="btn btn-outline-danger btn-sm"
                    @click="cancelOrder(order._id)"
                    :disabled="
                      cancellingOrderId === order._id ||
                      loading ||
                      processingAction
                    "
                  >
                    <i
                      class="fas fa-spinner fa-spin me-1"
                      v-if="cancellingOrderId === order._id"
                    ></i>
                    <i class="fas fa-times me-1" v-else></i>
                    {{
                      cancellingOrderId === order._id
                        ? "Đang hủy..."
                        : "Hủy đơn"
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Show More/Less Buttons -->
        <div
          v-if="totalOrdersCount > INITIAL_DISPLAY_COUNT"
          class="text-center mt-4"
        >
          <button
            v-if="canShowMore && !processingAction && !loading"
            @click="showMore"
            class="btn btn-outline-primary btn-sm"
            :disabled="processingAction || loading"
          >
            <i class="fas fa-chevron-down me-1"></i>
            Xem thêm ({{ totalOrdersCount - orders.length }} đơn hàng)
          </button>
          <button
            v-if="canShowLess && !processingAction && !loading"
            @click="showLess"
            class="btn btn-outline-secondary btn-sm"
            :disabled="processingAction || loading"
          >
            <i class="fas fa-chevron-up me-1"></i>
            Rút gọn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import orderService from "../../services/orderService";
import Swal from "sweetalert2"; // Import SweetAlert2

// Reactive data cải tiến với khởi tạo mặc định tốt hơn
const allOrders = ref([]); // Danh sách đơn hàng
const loading = ref(false); // Trạng thái loading
const error = ref(""); // Thông báo lỗi
const currentStatus = ref("all"); // Tab đang chọn
const currentSort = ref("newest"); // Sắp xếp hiện tại
const cancellingOrderId = ref(null); // ID đơn hàng đang hủy
const processingAction = ref(false); // Cờ đánh dấu đang xử lý bất kỳ hành động nào
const componentKey = ref(0); // Key để force re-render khi cần

// Cấu hình hiển thị
const INITIAL_DISPLAY_COUNT = 3; // Số lượng hiển thị ban đầu
const ordersVisibleCount = ref(INITIAL_DISPLAY_COUNT); // Số lượng hiển thị hiện tại

// Router
const router = useRouter();

// Computed
const filteredOrders = computed(() => {
  if (!Array.isArray(allOrders.value)) return [];
  let filtered = allOrders.value;

  if (currentStatus.value !== "all") {
    filtered = filtered.filter(
      (order) => order.orderStatus === currentStatus.value
    );
  }

  return filtered;
});

const sortedOrders = computed(() => {
  if (!Array.isArray(filteredOrders.value)) return [];

  const sorted = [...filteredOrders.value];
  switch (currentSort.value) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    case "highest_amount":
      return sorted.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    case "lowest_amount":
      return sorted.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    default:
      return sorted;
  }
});

const orders = computed(() => {
  return sortedOrders.value.slice(0, ordersVisibleCount.value);
});

const totalOrdersCount = computed(() => sortedOrders.value.length);

const canShowMore = computed(() => {
  return ordersVisibleCount.value < totalOrdersCount.value;
});

const canShowLess = computed(() => {
  return (
    ordersVisibleCount.value > INITIAL_DISPLAY_COUNT &&
    totalOrdersCount.value > INITIAL_DISPLAY_COUNT
  );
});

// Watch for filter changes to reset the visible count
watch([currentStatus, currentSort], () => {
  ordersVisibleCount.value = INITIAL_DISPLAY_COUNT;
});

// Statuses
const orderStatuses = [
  { value: "all", label: "Tất cả", icon: "fas fa-list" },
  { value: "pending", label: "Chờ thanh toán", icon: "fas fa-clock" },
  { value: "completed", label: "Đã hoàn thành", icon: "fas fa-check-circle" },
  { value: "failed", label: "Thất bại", icon: "fas fa-times-circle" },
  { value: "canceled", label: "Đã hủy", icon: "fas fa-ban" },
];

// Functions - Cải tiến để tránh lỗi DOM và tăng độ ổn định
const fetchOrders = async () => {
  // Nếu đang tải, không thực hiện lại
  if (loading.value) return;

  try {
    // Đánh dấu đang tải
    loading.value = true;
    error.value = "";

    // Gọi API lấy danh sách đơn hàng
    const response = await orderService.getUserOrders();

    // Kiểm tra và cập nhật dữ liệu - sử dụng bản sao tạm thời
    if (response && response.success) {
      // Kiểm tra và làm sạch dữ liệu trước khi gán
      const validOrders = (response.orders || []).filter(
        (order) => order && order._id && typeof order.orderStatus === "string"
      );

      // Gán dữ liệu đã được kiểm tra
      allOrders.value = validOrders;

      // Reset các giá trị hiển thị nếu cần
      if (ordersVisibleCount.value > validOrders.length) {
        ordersVisibleCount.value = Math.min(
          INITIAL_DISPLAY_COUNT,
          validOrders.length
        );
      }
    } else {
      // Xử lý khi response không thành công
      error.value = "Không thể tải danh sách đơn hàng";
      allOrders.value = [];
    }
  } catch (err) {
    // Xử lý lỗi
    error.value = "Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.";
    console.error("Lỗi khi tải đơn hàng:", err);
    allOrders.value = [];
  } finally {
    // Sử dụng timeout nhỏ để đảm bảo DOM có thời gian cập nhật
    setTimeout(() => {
      loading.value = false;
    }, 50);
  }
};

const changeStatus = (status) => {
  if (currentStatus.value !== status) {
    currentStatus.value = status;
  }
};

const changeSort = (sort) => {
  if (currentSort.value !== sort) {
    currentSort.value = sort;
  }
};

const viewOrderDetails = (orderId) => {
  router.push(`/profile/orders/${orderId}`);
};

const showMore = async () => {
  if (processingAction.value) return;

  processingAction.value = true;
  try {
    // Tạo hiệu ứng mượt mà hơn
    const step = Math.min(5, totalOrdersCount.value - ordersVisibleCount.value);
    ordersVisibleCount.value += step;

    // Nếu đã hiển thị tất cả, cập nhật để hiển thị đúng
    if (ordersVisibleCount.value >= totalOrdersCount.value) {
      ordersVisibleCount.value = totalOrdersCount.value;
    }

    // Chờ DOM cập nhật
    await waitForDomUpdate();
  } finally {
    processingAction.value = false;
  }
};

const showLess = async () => {
  if (processingAction.value) return;

  processingAction.value = true;
  try {
    // Reset về giá trị ban đầu
    ordersVisibleCount.value = INITIAL_DISPLAY_COUNT;

    // Chờ DOM cập nhật
    await waitForDomUpdate();
  } finally {
    processingAction.value = false;
  }
};

// Hàm hủy đơn hàng - cải tiến để sử dụng SweetAlert2
const cancelOrder = async (orderId) => {
  // Bảo vệ cơ bản
  if (!orderId || cancellingOrderId.value || loading.value) return;

  try {
    // Hiển thị dialog xác nhận sử dụng SweetAlert2
    const result = await Swal.fire({
      title: "Xác nhận hủy đơn hàng",
      text: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý ",
      cancelButtonText: "Không hủy",
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    // Đánh dấu đang xử lý
    cancellingOrderId.value = orderId;

    // Hiển thị thông báo đang xử lý
    Swal.fire({
      title: "Đang xử lý...",
      text: "Vui lòng đợi trong giây lát",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Gọi API hủy đơn hàng
    await orderService.cancelOrder(orderId);

    // Tăng giá trị key để force re-render component sau khi tải lại dữ liệu
    componentKey.value++;

    // Hiển thị thông báo thành công và tự động đóng sau 2 giây
    Swal.fire({
      title: "Thành công!",
      text: "Đơn hàng đã được hủy thành công",
      icon: "success",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });

    // Tải lại danh sách đơn hàng
    setTimeout(() => {
      fetchOrders();
    }, 300);
  } catch (err) {
    // Xử lý lỗi
    console.error("Lỗi khi hủy đơn:", err);

    // Hiển thị thông báo lỗi
    Swal.fire({
      title: "Có lỗi xảy ra!",
      text: "Không thể hủy đơn hàng. Vui lòng thử lại sau.",
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Đóng",
    });
  } finally {
    // Đặt lại trạng thái xử lý
    cancellingOrderId.value = null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount) => {
  if (!amount) return "0 VND";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getStatusLabel = (status) => {
  const s = orderStatuses.find((x) => x.value === status);
  return s?.label || status || "";
};

const getStatusIcon = (status) => {
  const s = orderStatuses.find((x) => x.value === status);
  return s?.icon || "fas fa-question";
};

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: "bg-warning text-dark",
    completed: "bg-success",
    failed: "bg-danger",
    canceled: "bg-secondary",
    refunded: "bg-info",
  };
  return classes[status] || "bg-secondary";
};

const getSortLabel = (sort) => {
  const labels = {
    newest: "Mới nhất",
    oldest: "Cũ nhất",
    highest_amount: "Giá cao",
    lowest_amount: "Giá thấp",
  };
  return labels[sort] || "Mới nhất";
};

const getPaymentMethodLabel = (method) => {
  const labels = {
    vnpay: "VNPay",
    other: "Khác",
  };
  return labels[method] || method;
};

const canCancelOrder = (status) => {
  return status === "pending";
};

// Thêm phương thức chờ xử lý DOM
const waitForDomUpdate = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
};

// Lifecycle cải tiến
onMounted(async () => {
  // Đánh dấu đang xử lý
  processingAction.value = true;

  try {
    // Tải dữ liệu khi component được mount
    await fetchOrders();
  } finally {
    // Đảm bảo luôn reset trạng thái xử lý
    processingAction.value = false;
  }
});

// Cleanup khi component bị hủy
onUnmounted(() => {
  // Đảm bảo không có operations đang chạy
  processingAction.value = true;
  cancellingOrderId.value = null;
});
</script>

<style scoped>
@import "./ProfileOrders.css";
</style>
