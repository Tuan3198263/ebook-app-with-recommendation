<!-- filepath: d:\LuanVan\frontend\src\views\cart\Cart.vue -->
<template>
  <div class="cart-container">
    <div class="cart-header">
      <h1>Giỏ hàng của bạn</h1>
      <button class="back-btn" @click="$router.push('/')">
        ← Tiếp tục mua sắm
      </button>
    </div>

    <div class="cart-content">
      <!-- Loading state -->
      <div v-if="loading" class="cart-loading">
        <div class="spinner"></div>
        <p>Đang tải giỏ hàng...</p>
      </div>

      <!-- Empty cart -->
      <div v-else-if="!cart?.items?.length" class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h2>Giỏ hàng trống</h2>
        <p>Bạn chưa có sách nào trong giỏ hàng.</p>
        <button class="browse-books-btn" @click="$router.push('/')">
          Khám phá sách
        </button>
      </div>

      <!-- Cart with items -->
      <div v-else class="cart-main">
        <div class="cart-items">
          <div class="cart-actions">
            <span class="item-count">
              {{ cart.totalItems }} sản phẩm trong giỏ hàng
            </span>
            <button class="clear-cart-btn" @click="handleClearCart">
              🗑 Xóa tất cả
            </button>
          </div>

          <div class="items-list">
            <div v-for="(item, index) in cart.items" :key="item._id">
              <div v-if="index > 0" class="item-divider"></div>
              <div class="cart-item">
                <div class="item-image">
                  <img
                    :src="item.book.coverImages?.[0] || '/placeholder-book.jpg'"
                    :alt="item.book.title"
                    @error="handleImageError"
                  />
                </div>

                <div class="item-details">
                  <router-link
                    :to="`/book/${item.book.slug}`"
                    class="item-title-link"
                    :title="item.book.title"
                  >
                    <h3 class="item-title">{{ item.book.title }}</h3>
                  </router-link>

                  <div class="item-controls">
                    <div class="item-options">
                      <label>Gói thuê:</label>
                      <select
                        :value="item.ebookOption.duration"
                        @change="
                          handleUpdateCartItem(
                            item._id,
                            $event.target.value,
                            item.book
                          )
                        "
                        :disabled="updating[item._id]"
                        class="duration-select"
                      >
                        <option
                          v-for="option in item.book.ebookOptions"
                          :key="option.duration"
                          :value="option.duration"
                        >
                          {{ formatDurationLabel(option.duration) }} -
                          {{ formatPrice(option.price) }}đ
                        </option>
                      </select>
                    </div>

                    <div class="item-price">
                      <span class="price">
                        {{ formatPrice(item.ebookOption.price) }}đ
                      </span>
                    </div>
                  </div>
                </div>

                <div class="item-actions">
                  <button
                    class="remove-btn"
                    @click="handleRemoveItem(item._id, item.book.title)"
                    title="Xóa khỏi giỏ hàng"
                  >
                    ×
                  </button>
                </div>

                <div v-if="updating[item._id]" class="item-updating">
                  <div class="mini-spinner"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <div class="summary-card">
            <div class="guide-section">
              <p class="guide-text">
                📚 Hướng dẫn mua hàng sẽ được cập nhật trong phiên bản tiếp theo
              </p>
            </div>

            <div class="summary-details">
              <div class="summary-row">
                <span>Số lượng:</span>
                <span>{{ cart.totalItems }}</span>
              </div>

              <div class="summary-row">
                <span>Tạm tính:</span>
                <span>{{ formatPrice(cart.totalAmount) }}đ</span>
              </div>

              <div class="summary-row">
                <span>Phí dịch vụ:</span>
                <span>0đ</span>
              </div>

              <div class="summary-divider"></div>

              <div class="summary-row total">
                <span>Tổng cộng:</span>
                <span>{{ formatPrice(cart.totalAmount) }}đ</span>
              </div>
            </div>

            <button class="checkout-btn" @click="handleCheckout">
              Thanh toán
            </button>

            <div class="payment-note">
              <p>Truy cập sách ngay sau khi thanh toán</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import cartService from "../../services/cartService";
import orderService from "../../services/orderService";

const router = useRouter();

// Reactive data
const cart = ref(null);
const loading = ref(true);
const updating = reactive({});
const checkingOut = ref(false);

onMounted(() => {
  loadCart();
});

const loadCart = async () => {
  try {
    loading.value = true;
    const response = await cartService.getCart();
    cart.value = response.data.cart;
  } catch (error) {
    console.error("Lỗi khi tải giỏ hàng:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: "Không thể tải giỏ hàng. Vui lòng thử lại.",
      confirmButtonText: "OK",
    });
  } finally {
    loading.value = false;
  }
};

const handleUpdateCartItem = async (itemId, duration, book) => {
  try {
    updating[itemId] = true;

    // Tìm giá từ ebookOptions của sách thực tế
    const selectedOption = book.ebookOptions.find(
      (option) => option.duration === duration
    );
    if (!selectedOption) {
      throw new Error("Gói thuê không hợp lệ");
    }

    const price = selectedOption.price;
    await cartService.updateCartItem(itemId, duration, price);
    await loadCart();

    await Swal.fire({
      icon: "success",
      title: "Thành công!",
      text: "Đã cập nhật gói thuê sách.",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error);
    await Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text: "Không thể cập nhật gói thuê. Vui lòng thử lại.",
      confirmButtonText: "OK",
    });
  } finally {
    updating[itemId] = false;
  }
};

const handleRemoveItem = async (itemId, bookTitle) => {
  const result = await Swal.fire({
    title: "Xác nhận xóa",
    text: `Bạn có chắc chắn muốn xóa "${bookTitle}" khỏi giỏ hàng?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  });

  if (result.isConfirmed) {
    try {
      await cartService.removeFromCart(itemId);
      await loadCart();

      await Swal.fire({
        icon: "success",
        title: "Đã xóa!",
        text: "Sách đã được xóa khỏi giỏ hàng.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không thể xóa sách. Vui lòng thử lại.",
        confirmButtonText: "OK",
      });
    }
  }
};

const handleClearCart = async () => {
  const result = await Swal.fire({
    title: "Xóa toàn bộ giỏ hàng?",
    text: "Bạn có chắc chắn muốn xóa tất cả sách trong giỏ hàng?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Xóa tất cả",
    cancelButtonText: "Hủy",
  });

  if (result.isConfirmed) {
    try {
      await cartService.clearCart();
      await loadCart();

      await Swal.fire({
        icon: "success",
        title: "Đã xóa!",
        text: "Giỏ hàng đã được xóa sạch.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Lỗi khi xóa giỏ hàng:", error);
      await Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không thể xóa giỏ hàng. Vui lòng thử lại.",
        confirmButtonText: "OK",
      });
    }
  }
};

const handleCheckout = async () => {
  const result = await Swal.fire({
    title: "Xác nhận thanh toán",
    html: `
        <div class="checkout-confirm">
          <p>Bạn có chắc chắn muốn thanh toán cho ${
            cart.value.totalItems
          } sách với tổng số tiền:</p>
          <p class="total-amount">${formatPrice(cart.value.totalAmount)}đ</p>
          <p style="margin-top: 10px; font-size: 14px; color: #666;">
            Bạn sẽ được chuyển hướng đến trang thanh toán VNPay
          </p>
        </div>
      `,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Thanh toán",
    cancelButtonText: "Hủy",
    customClass: {
      popup: "checkout-popup",
    },
  });

  if (result.isConfirmed) {
    try {
      checkingOut.value = true;

      // Hiển thị loading
      Swal.fire({
        title: "Đang tạo đơn hàng...",
        text: "Vui lòng đợi trong giây lát",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Tạo đơn hàng
      const orderResult = await orderService.createOrder(
        "", // note - có thể để trống hoặc thêm input cho người dùng nhập
        `${window.location.origin}/payment/result` // redirectUrl - trang kết quả thanh toán
      );

      if (orderResult.success) {
        // Đóng loading
        Swal.close();

        // Hiển thị thông báo thành công nếu có sản phẩm không hợp lệ
        if (orderResult.invalidItems && orderResult.invalidItems.length > 0) {
          await Swal.fire({
            icon: "warning",
            title: "Thông báo",
            html: `
              <p>${orderResult.message}</p>
              <div style="margin-top: 15px;">
                <p><strong>Các sản phẩm đã bị loại bỏ:</strong></p>
                <ul style="text-align: left; margin: 10px 0;">
                  ${orderResult.invalidItems
                    .map((item) => `<li>${item.title} - ${item.reason}</li>`)
                    .join("")}
                </ul>
              </div>
            `,
            timer: 5000,
            showConfirmButton: true,
            confirmButtonText: "Tiếp tục thanh toán",
          });
        }

        // Chuyển hướng đến trang thanh toán VNPay
        window.location.href = orderResult.paymentUrl;
      } else {
        throw new Error(orderResult.message || "Không thể tạo đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);

      Swal.fire({
        icon: "error",
        title: "Lỗi tạo đơn hàng!",
        text: error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
        confirmButtonText: "OK",
      });
    } finally {
      checkingOut.value = false;
    }
  }
};

const formatPrice = (price) => {
  return price?.toLocaleString("vi-VN") || "0";
};

// Hàm format label cho duration
const formatDurationLabel = (duration) => {
  const durationLabels = {
    "1_month": "1 tháng",
    "3_months": "3 tháng",
    "6_months": "6 tháng",
    permanent: "Vĩnh viễn",
  };

  return durationLabels[duration] || duration;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const handleImageError = (event) => {
  event.target.src = "/placeholder-book.jpg";
};
</script>
<style scoped>
@import "./Cart.css";
</style>
