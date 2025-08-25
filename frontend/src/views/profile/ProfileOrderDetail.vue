<template>
  <div class="profile-order-detail">
    <!-- Header with Breadcrumb -->
    <div class="card-header border-bottom">
      <div class="d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h5 class="mb-0">
            <i class="fas fa-file-invoice me-2"></i>Chi tiết đơn hàng
          </h5>
        </div>
        <div>
          <router-link to="/profile/orders" class="btn btn-light btn-sm">
            <i class="fas fa-arrow-left me-1"></i>Quay lại đơn hàng
          </router-link>
        </div>
      </div>
    </div>

    <div class="card-body">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2 text-muted">Đang tải thông tin đơn hàng...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-5">
        <div class="error-icon mb-3">
          <i
            class="fas fa-exclamation-triangle text-danger"
            style="font-size: 3rem"
          ></i>
        </div>
        <h5 class="text-danger mb-2">Có lỗi xảy ra</h5>
        <p class="text-muted mb-3">{{ error }}</p>
        <button class="btn btn-primary" @click="fetchOrderDetails">
          <i class="fas fa-redo me-1"></i>Thử lại
        </button>
      </div>

      <!-- Order Details Content -->
      <div v-else-if="order">
        <!-- Order Info Card -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="order-info-card">
              <div class="row">
                <div class="col-md-6">
                  <div class="info-group">
                    <label class="info-label">Mã đơn hàng</label>
                    <div class="info-value d-flex align-items-center">
                      <code class="order-code">{{ order.orderCode }}</code>
                      <button
                        class="btn btn-sm btn-outline-secondary ms-2"
                        @click="copyOrderCode"
                        title="Sao chép mã đơn hàng"
                      >
                        <i class="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-group">
                    <label class="info-label">Trạng thái</label>
                    <div class="info-value">
                      <span :class="getStatusBadgeClass(order.orderStatus)">
                        <i :class="getStatusIcon(order.orderStatus)"></i>
                        {{ getStatusText(order.orderStatus) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-md-6">
                  <div class="info-group">
                    <label class="info-label">Ngày tạo</label>
                    <div class="info-value">
                      <i class="fas fa-calendar-alt me-1 text-muted"></i>
                      {{ formatDateTime(order.createdAt) }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-group">
                    <label class="info-label">Tổng tiền</label>
                    <div class="info-value">
                      <span class="total-amount">{{
                        formatPrice(order.totalAmount)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row mt-3" v-if="order.note">
                <div class="col-12">
                  <div class="info-group">
                    <label class="info-label">Ghi chú</label>
                    <div class="info-value">
                      <i class="fas fa-sticky-note me-1 text-muted"></i>
                      {{ order.note }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="section-card">
              <div class="section-header">
                <h6 class="section-title">
                  <i class="fas fa-list me-2"></i>
                  Sản phẩm trong đơn hàng ({{
                    order.totalItems || order.items?.length || 0
                  }})
                </h6>
              </div>
              <div class="section-content">
                <div
                  v-if="!order.items || order.items.length === 0"
                  class="text-center py-3 text-muted"
                >
                  <i class="fas fa-inbox me-1"></i>Không có sản phẩm nào
                </div>
                <div v-else>
                  <div
                    v-for="(item, index) in order.items"
                    :key="item._id || index"
                    class="order-item"
                    :class="{ 'border-bottom': index < order.items.length - 1 }"
                  >
                    <div class="row align-items-center">
                      <div class="col-auto">
                        <div class="book-cover">
                          <img
                            :src="item.coverImage || '/placeholder-book.jpg'"
                            :alt="item.title"
                            class="cover-image"
                            @error="handleImageError"
                          />
                        </div>
                      </div>
                      <div class="col">
                        <div class="item-info">
                          <h6 class="item-title mb-1">{{ item.title }}</h6>
                          <div class="item-details">
                            <span class="badge bg-light text-dark me-2">
                              <i class="fas fa-clock me-1"></i>
                              {{ getDurationText(item.ebookOption?.duration) }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="col-auto">
                        <div class="item-price">
                          <span class="price-text">{{
                            formatPrice(item.ebookOption?.price)
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div
          class="row mb-4"
          v-if="order.paymentDetails || order.paymentMethod"
        >
          <div class="col-12">
            <div class="section-card">
              <div class="section-header">
                <h6 class="section-title">
                  <i class="fas fa-credit-card me-2"></i>
                  Thông tin thanh toán
                </h6>
              </div>
              <div class="section-content">
                <div class="row">
                  <div class="col-md-6">
                    <div class="info-group">
                      <label class="info-label">Phương thức thanh toán</label>
                      <div class="info-value">
                        <span class="badge bg-primary">
                          <i class="fas fa-wallet me-1"></i>
                          {{ getPaymentMethodText(order.paymentMethod) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    class="col-md-6"
                    v-if="order.paymentDetails?.transactionId"
                  >
                    <div class="info-group">
                      <label class="info-label">Mã giao dịch</label>
                      <div class="info-value">
                        <code>{{ order.paymentDetails.transactionId }}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="row mt-3"
                  v-if="
                    order.paymentDetails?.bankCode ||
                    order.paymentDetails?.payDate
                  "
                >
                  <div class="col-md-6" v-if="order.paymentDetails?.bankCode">
                    <div class="info-group">
                      <label class="info-label">Ngân hàng</label>
                      <div class="info-value">
                        <span class="badge bg-secondary">{{
                          order.paymentDetails.bankCode
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6" v-if="order.paymentDetails?.payDate">
                    <div class="info-group">
                      <label class="info-label">Thời gian thanh toán</label>
                      <div class="info-value">
                        <i class="fas fa-clock me-1 text-muted"></i>
                        {{ formatPaymentDate(order.paymentDetails.payDate) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row mt-3" v-if="order.paymentError">
                  <div class="col-12">
                    <div class="info-group">
                      <label class="info-label text-danger"
                        >Lỗi thanh toán</label
                      >
                      <div class="info-value">
                        <div class="alert alert-danger mb-0">
                          <i class="fas fa-exclamation-triangle me-1"></i>
                          {{ order.paymentError }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Order Actions -->
        <div class="row" v-if="order.orderStatus === 'pending'">
          <div class="col-12">
            <div class="action-card">
              <div class="d-flex justify-content-center gap-3">
                <button class="btn btn-primary" @click="continuePayment">
                  <i class="fas fa-credit-card me-1"></i>
                  Tiếp tục thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import orderService from "@/services/orderService";
import { useToast } from "vue-toastification";

// Router
const route = useRoute();
const router = useRouter();

// Reactive data
const loading = ref(true);
const error = ref(null);
const order = ref(null);
const mounted = ref(true);
const toast = useToast();

// Computed properties - không cần nữa vì đã xóa cancel order

// Methods
const fetchOrderDetails = async () => {
  try {
    loading.value = true;
    error.value = null;

    const orderId = route.params.id;
    if (!orderId) {
      throw new Error("Không tìm thấy mã đơn hàng");
    }

    const response = await orderService.getOrderDetails(orderId);

    if (!mounted.value) return;

    if (response.success && response.order) {
      order.value = response.order;
    } else {
      throw new Error("Không thể lấy thông tin đơn hàng");
    }
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
    if (mounted.value) {
      error.value = err.message || "Có lỗi xảy ra khi tải thông tin đơn hàng";
    }
  } finally {
    if (mounted.value) {
      loading.value = false;
    }
  }
};

const copyOrderCode = async () => {
  if (!order.value?.orderCode) return;

  try {
    await navigator.clipboard.writeText(order.value.orderCode);
    toast.success("Đã sao chép mã đơn hàng!");
  } catch (err) {
    console.error("Lỗi khi sao chép:", err);
    toast.error("Không thể sao chép mã đơn hàng");
  }
};

const continuePayment = () => {
  if (!order.value?._id) return;

  // Navigate to payment page or handle payment continuation
  // This depends on your payment flow implementation
  toast.info("Tính năng thanh toán đang được phát triển");
};

// Helper functions
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
    pending: "badge bg-warning text-dark",
    completed: "badge bg-success",
    failed: "badge bg-danger",
    canceled: "badge bg-secondary",
    refunded: "badge bg-info",
  };
  return classMap[status] || "badge bg-secondary";
};

const getStatusIcon = (status) => {
  const iconMap = {
    pending: "fas fa-clock me-1",
    completed: "fas fa-check-circle me-1",
    failed: "fas fa-times-circle me-1",
    canceled: "fas fa-ban me-1",
    refunded: "fas fa-undo me-1",
  };
  return iconMap[status] || "fas fa-question-circle me-1";
};

const getPaymentMethodText = (method) => {
  const methodMap = {
    vnpay: "VNPay",
    other: "Khác",
  };
  return methodMap[method] || method;
};

const getDurationText = (duration) => {
  const durationMap = {
    "1_month": "1 tháng",
    "3_months": "3 tháng",
    "6_months": "6 tháng",
    permanent: "Vĩnh viễn",
  };
  return durationMap[duration] || duration;
};

const formatPrice = (price) => {
  if (!price && price !== 0) return "0₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch (error) {
    console.error("Lỗi format ngày:", error);
    return "N/A";
  }
};

const formatPaymentDate = (payDateString) => {
  if (!payDateString) return "N/A";

  try {
    // VNPay payDate format: yyyyMMddHHmmss
    if (payDateString.length === 14) {
      const year = payDateString.substr(0, 4);
      const month = payDateString.substr(4, 2);
      const day = payDateString.substr(6, 2);
      const hour = payDateString.substr(8, 2);
      const minute = payDateString.substr(10, 2);
      const second = payDateString.substr(12, 2);

      const date = new Date(
        `${year}-${month}-${day}T${hour}:${minute}:${second}`
      );
      return formatDateTime(date);
    }

    // Fallback for other formats
    return formatDateTime(payDateString);
  } catch (error) {
    console.error("Lỗi format payment date:", error);
    return payDateString;
  }
};

const handleImageError = (event) => {
  event.target.src = "/placeholder-book.jpg";
};

// Lifecycle
onMounted(() => {
  fetchOrderDetails();
});

onUnmounted(() => {
  mounted.value = false;
});
</script>

<style scoped>
.profile-order-detail {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  padding: 1rem 1.25rem;
}

.btn-light {
  transition: all 0.2s ease;
}

.btn-light:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 2rem;
}

.order-info-card,
.section-card,
.action-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
}

.section-header {
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0;
  color: #495057;
  font-weight: 600;
}

.info-group {
  margin-bottom: 1rem;
}

.info-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: #212529;
}

.order-code {
  font-size: 1.1rem;
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #28a745;
}

.order-item {
  padding: 1rem 0;
}

.order-item:last-child {
  border-bottom: none !important;
}

.book-cover {
  width: 60px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.item-price {
  text-align: right;
}

.price-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #28a745;
}

.action-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px dashed #ced4da;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.error-icon i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }

  .order-info-card,
  .section-card,
  .action-card {
    padding: 1rem;
  }

  .item-title {
    font-size: 0.9rem;
  }

  .book-cover {
    width: 50px;
    height: 65px;
  }

  .d-flex.gap-3 {
    flex-direction: column;
    gap: 0.5rem !important;
  }

  .d-flex.gap-3 .btn {
    width: 100%;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .order-info-card,
  .section-card {
    background: #2d3748;
    border-color: #4a5568;
  }

  .section-header {
    border-bottom-color: #4a5568;
  }

  .section-title,
  .info-value {
    color: #e2e8f0;
  }

  .info-label {
    color: #a0aec0;
  }

  .order-code {
    background: #4a5568;
    border-color: #718096;
    color: #e2e8f0;
  }
}
</style>
