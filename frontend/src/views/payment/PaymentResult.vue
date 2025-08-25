<!-- filepath: d:\LuanVan\frontend\src\views\payment\PaymentResult.vue -->
<template>
  <div class="payment-result-container">
    <div class="result-card">
      <!-- Loading state -->
      <div v-if="loading" class="loading-section">
        <div class="spinner"></div>
        <p>Đang xử lý kết quả thanh toán...</p>
      </div>

      <!-- Success state -->
      <div v-else-if="paymentSuccess" class="success-section">
        <div class="success-icon">✅</div>
        <h1>Thanh toán thành công!</h1>
        <p>Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận.</p>

        <div class="order-info" v-if="orderInfo">
          <h3>Thông tin đơn hàng:</h3>
          <div class="info-row">
            <span>Mã đơn hàng:</span>
            <span class="order-code">{{ orderInfo.orderCode }}</span>
          </div>
          <div class="info-row">
            <span>Tổng tiền:</span>
            <span class="amount"
              >{{ formatPrice(orderInfo.totalAmount) }}đ</span
            >
          </div>
        </div>

        <div class="action-buttons">
          <button @click="goToOrders" class="primary-btn">Xem đơn hàng</button>
          <button @click="goHome" class="secondary-btn">Về trang chủ</button>
        </div>
      </div>

      <!-- Failed state -->
      <div v-else class="failed-section">
        <div class="failed-icon">❌</div>
        <h1>Thanh toán thất bại!</h1>
        <p v-if="errorMessage">{{ errorMessage }}</p>
        <p v-else>Đã xảy ra lỗi trong quá trình thanh toán.</p>

        <div class="action-buttons">
          <button @click="retryPayment" class="primary-btn">Thử lại</button>
          <button @click="goToCart" class="secondary-btn">Về giỏ hàng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import orderService from "../../services/orderService";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const paymentSuccess = ref(false);
const errorMessage = ref("");
const orderInfo = ref(null);

onMounted(async () => {
  try {
    // Lấy thông tin từ URL query parameters
    const { success, code, orderCode } = route.query;

    paymentSuccess.value = success === "true";

    if (paymentSuccess.value && orderCode) {
      // Lấy thông tin đơn hàng
      try {
        const orderDetails = await orderService.getOrderDetails(orderCode);
        orderInfo.value = orderDetails.order;
      } catch (error) {
        console.error("Không thể lấy thông tin đơn hàng:", error);
      }
    } else {
      // Xử lý thông báo lỗi dựa trên mã response
      const errorMessages = {
        "07": "Giao dịch bị nghi ngờ gian lận",
        "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
        10: "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
        11: "Đã hết hạn chờ thanh toán",
        12: "Thẻ/Tài khoản bị khóa",
        13: "Mật khẩu xác thực giao dịch (OTP) không đúng",
        24: "Khách hàng hủy giao dịch",
        51: "Tài khoản không đủ số dư",
        65: "Tài khoản vượt quá hạn mức giao dịch trong ngày",
        75: "Ngân hàng thanh toán đang bảo trì",
        79: "Nhập sai mật khẩu thanh toán quá số lần quy định",
        99: "Lỗi khác",
      };

      errorMessage.value = errorMessages[code] || "Thanh toán không thành công";
    }
  } catch (error) {
    console.error("Lỗi khi xử lý kết quả thanh toán:", error);
    paymentSuccess.value = false;
    errorMessage.value = "Không thể xác định kết quả thanh toán";
  } finally {
    loading.value = false;
  }
});

const formatPrice = (price) => {
  return price?.toLocaleString("vi-VN") || "0";
};

const goToOrders = () => {
  router.push("/profile/orders");
};

const goHome = () => {
  router.push("/");
};

const goToCart = () => {
  router.push("/cart");
};

const retryPayment = () => {
  router.push("/cart");
};
</script>

<style scoped>
.payment-result-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.success-section,
.failed-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.success-icon,
.failed-icon {
  font-size: 60px;
  margin-bottom: 10px;
}

.success-section h1 {
  color: #28a745;
  margin: 0;
}

.failed-section h1 {
  color: #dc3545;
  margin: 0;
}

.order-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  margin: 20px 0;
}

.order-info h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.order-code {
  font-weight: bold;
  color: #007bff;
}

.amount {
  font-weight: bold;
  color: #28a745;
  font-size: 18px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.primary-btn,
.secondary-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn {
  background: #007bff;
  color: white;
}

.primary-btn:hover {
  background: #0056b3;
}

.secondary-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.secondary-btn:hover {
  background: #e9ecef;
}

@media (max-width: 768px) {
  .payment-result-container {
    margin: 20px auto;
    padding: 15px;
  }

  .result-card {
    padding: 30px 20px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}
</style>
