<template>
  <div
    class="modal fade"
    id="orderDetailModal"
    tabindex="-1"
    aria-labelledby="orderDetailModalLabel"
    aria-hidden="true"
    ref="modalEl"
  >
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="orderDetailModalLabel">
            <i class="fas fa-shopping-cart me-2"></i>Chi tiết đơn hàng
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-2">Đang tải thông tin đơn hàng...</p>
          </div>

          <div v-else-if="order" class="order-details">
            <!-- Thông tin tổng quan -->
            <div class="row mb-4">
              <div class="col-md-6">
                <div class="card border-primary">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">
                      <i class="fas fa-info-circle me-2"></i>Thông tin đơn hàng
                    </h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Mã đơn hàng:</strong> {{ order.orderCode }}</p>
                    <p>
                      <strong>Trạng thái:</strong>
                      <span
                        :class="getStatusBadgeClass(order.orderStatus)"
                        class="badge"
                      >
                        {{ getStatusText(order.orderStatus) }}
                      </span>
                    </p>
                    <p>
                      <strong>Tổng tiền:</strong>
                      <span class="text-success fw-bold">{{
                        formatPrice(order.totalAmount)
                      }}</span>
                    </p>
                    <p>
                      <strong>Phương thức thanh toán:</strong>
                      {{
                        order.paymentMethod === "vnpay"
                          ? "VNPay"
                          : order.paymentMethod
                      }}
                    </p>
                    <p>
                      <strong>Ngày tạo:</strong>
                      {{ formatDate(order.createdAt) }}
                    </p>
                    <p v-if="order.note">
                      <strong>Ghi chú:</strong> {{ order.note }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="card border-info">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0">
                      <i class="fas fa-user me-2"></i>Thông tin khách hàng
                    </h6>
                  </div>
                  <div class="card-body">
                    <p>
                      <strong>Họ tên:</strong>
                      {{ order.user?.name || "N/A" }}
                    </p>
                    <p>
                      <strong>Email:</strong> {{ order.user?.email || "N/A" }}
                    </p>
                    <p>
                      <strong>Vai trò:</strong>
                      <span
                        class="badge"
                        :class="getRoleBadgeClass(order.user?.role)"
                      >
                        {{ getRoleText(order.user?.role) }}
                      </span>
                    </p>
                    <p v-if="order.user?.faculty">
                      <strong>Khoa:</strong> {{ order.user.faculty }}
                    </p>
                    <p v-if="order.user?.major">
                      <strong>Ngành:</strong> {{ order.user.major }}
                    </p>
                    <p v-if="order.user?.dateOfBirth">
                      <strong>Ngày sinh:</strong>
                      {{ formatDate(order.user.dateOfBirth) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Danh sách sản phẩm -->
            <div class="card mb-4">
              <div class="card-header bg-success text-white">
                <h6 class="mb-0">
                  <i class="fas fa-book me-2"></i>Danh sách sách ({{
                    order.items?.length || 0
                  }}
                  cuốn)
                </h6>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Ảnh bìa</th>
                        <th>Tên sách</th>
                        <th>Tác giả</th>
                        <th>Thời hạn</th>
                        <th class="text-end">Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in order.items" :key="item._id">
                        <td>
                          <img
                            :src="
                              item.coverImage ||
                              'https://via.placeholder.com/60x80'
                            "
                            :alt="item.title"
                            class="img-thumbnail"
                            style="width: 40px; height: 60px; object-fit: cover"
                          />
                        </td>
                        <td>
                          <strong>{{ item.title }}</strong>
                        </td>
                        <td>{{ getAuthorNames(item.book?.authors) }}</td>
                        <td>
                          <span class="badge bg-secondary">{{
                            formatDuration(item.ebookOption?.duration)
                          }}</span>
                        </td>
                        <td class="text-end">
                          <strong class="text-success">{{
                            formatPrice(item.ebookOption?.price)
                          }}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Thông tin thanh toán -->
            <div
              v-if="
                order.paymentDetails &&
                Object.keys(order.paymentDetails).length > 0
              "
              class="card"
            >
              <div class="card-header bg-warning text-dark">
                <h6 class="mb-0">
                  <i class="fas fa-credit-card me-2"></i>Thông tin thanh toán
                </h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <p v-if="order.paymentDetails.transactionId">
                      <strong>Mã giao dịch:</strong>
                      {{ order.paymentDetails.transactionId }}
                    </p>
                    <p v-if="order.paymentDetails.bankCode">
                      <strong>Ngân hàng:</strong>
                      {{ order.paymentDetails.bankCode }}
                    </p>
                    <p v-if="order.paymentDetails.cardType">
                      <strong>Loại thẻ:</strong>
                      {{ order.paymentDetails.cardType }}
                    </p>
                  </div>
                  <div class="col-md-6">
                    <p v-if="order.paymentDetails.payDate">
                      <strong>Thời gian thanh toán:</strong>
                      {{ formatPaymentDate(order.paymentDetails.payDate) }}
                    </p>
                    <p v-if="order.paymentDetails.responseCode">
                      <strong>Mã phản hồi:</strong>
                      <span
                        :class="
                          order.paymentDetails.responseCode === '00'
                            ? 'text-success'
                            : 'text-danger'
                        "
                      >
                        {{ order.paymentDetails.responseCode }}
                      </span>
                    </p>
                    <p v-if="order.paymentDetails.responseMessage">
                      <strong>Thông báo:</strong>
                      {{ order.paymentDetails.responseMessage }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4">
            <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
            <p class="text-muted">Không thể tải thông tin đơn hàng</p>
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
import orderService from "@/services/orderService";
import { useToast } from "vue-toastification";

const toast = useToast();

const props = defineProps({
  orderId: {
    type: String,
    default: null,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const order = ref(null);
const loading = ref(false);
const modalEl = ref(null);
let modal = null;

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

const getRoleText = (role) => {
  const roleMap = {
    student: "Sinh viên",
    teacher: "Giáo viên",
    admin: "Quản trị viên",
  };
  return roleMap[role] || role || "N/A";
};

const getRoleBadgeClass = (role) => {
  const classMap = {
    student: "bg-primary",
    teacher: "bg-success",
    admin: "bg-danger",
  };
  return classMap[role] || "bg-secondary";
};

const formatPaymentDate = (paymentDate) => {
  if (!paymentDate) return "";
  // paymentDate format: yyyyMMddHHmmss
  const year = paymentDate.substring(0, 4);
  const month = paymentDate.substring(4, 6);
  const day = paymentDate.substring(6, 8);
  const hour = paymentDate.substring(8, 10);
  const minute = paymentDate.substring(10, 12);
  const second = paymentDate.substring(12, 14);

  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
};

const formatDuration = (duration) => {
  const durationMap = {
    "1_month": "1 tháng",
    "3_months": "3 tháng",
    "6_months": "6 tháng",
    permanent: "Vĩnh viễn",
  };
  return durationMap[duration] || duration;
};

const getAuthorNames = (authors) => {
  if (!authors) return "N/A";
  if (Array.isArray(authors)) {
    return authors
      .map((author) => (typeof author === "object" ? author.name : author))
      .join(", ");
  }
  return typeof authors === "object" ? authors.name : authors;
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

const loadOrderDetail = async (id) => {
  if (!id) return;

  loading.value = true;
  order.value = null;

  try {
    const response = await orderService.admin.getOrderDetails(id);
    if (response.success) {
      order.value = response.order;
    } else {
      toast.error("Không thể tải chi tiết đơn hàng");
    }
  } catch (error) {
    console.error("Lỗi khi tải chi tiết đơn hàng:", error);
    toast.error(error.message || "Không thể tải chi tiết đơn hàng");
  } finally {
    loading.value = false;
  }
};

// Watch for changes
watch(
  () => props.orderId,
  (newId) => {
    if (newId) {
      loadOrderDetail(newId);
    }
  }
);

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

    modalEl.value.addEventListener("hidden.bs.modal", () => {
      emit("close");
    });

    if (props.show) {
      showModal();
    }

    if (props.orderId) {
      loadOrderDetail(props.orderId);
    }
  }
});
</script>

<style scoped>
.order-details .card {
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.order-details .card-header {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.table th {
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.img-thumbnail {
  border-radius: 0.25rem;
}
</style>
