<template>
  <div class="license-detail">
    <div class="card-header">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="fas fa-key me-2"></i>Chi tiết bản quyền</h5>
        <router-link
          to="/profile/licenses"
          class="btn btn-sm btn-outline-secondary"
        >
          <i class="fas fa-arrow-left me-1"></i>Quay lại
        </router-link>
      </div>
    </div>

    <div class="card-body">
      <!-- Loading state -->
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải thông tin bản quyền...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center my-5">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
        <p class="text-danger">{{ error }}</p>
        <button class="btn btn-primary" @click="fetchLicenseDetails">
          <i class="fas fa-redo me-1"></i>Thử lại
        </button>
      </div>

      <div v-else-if="license" class="license-detail-content">
        <!-- Thông tin sách và bản quyền -->
        <div class="row">
          <!-- Ảnh bìa sách -->
          <div class="col-md-4 mb-4">
            <div class="book-cover-container">
              <img
                :src="license.book?.coverImages?.[0] || '/placeholder-book.jpg'"
                :alt="license.book?.title"
                class="book-cover"
              />
            </div>
          </div>

          <!-- Thông tin chi tiết -->
          <div class="col-md-8">
            <h4 class="book-title mb-3">{{ license.book?.title }}</h4>

            <!-- Thông tin trạng thái -->
            <div class="status-indicator mb-4">
              <span
                class="status-badge"
                :class="getStatusClass(license.status)"
              >
                {{ getStatusDisplay(license.status).text }}
              </span>

              <div class="license-time mt-2">
                <div v-if="license.licenseType.duration !== 'permanent'">
                  <i class="fas fa-calendar-alt me-2"></i>
                  <span
                    v-if="license.isValid"
                    :class="{ 'text-warning': isExpiringSoon(license) }"
                  >
                    <strong>{{ license.daysRemaining }}</strong> ngày còn lại
                  </span>
                  <span v-else class="text-danger">
                    <strong>Hết hạn</strong> vào
                    {{ formatDate(license.validUntil) }}
                  </span>
                </div>
                <div v-else>
                  <i class="fas fa-infinity me-2"></i>
                  <span class="text-success">Sử dụng vĩnh viễn</span>
                </div>
              </div>
            </div>

            <!-- Thông tin chi tiết bản quyền -->
            <div class="license-details">
              <div class="detail-row">
                <div class="label">Mã bản quyền:</div>
                <div class="value license-code">{{ license.licenseCode }}</div>
              </div>

              <div class="detail-row">
                <div class="label">Gói bản quyền:</div>
                <div class="value">
                  {{ formatLicenseType(license.licenseType) }}
                </div>
              </div>

              <div class="detail-row">
                <div class="label">Ngày bắt đầu:</div>
                <div class="value">{{ formatDate(license.validFrom) }}</div>
              </div>

              <div class="detail-row">
                <div class="label">Ngày hết hạn:</div>
                <div class="value">
                  {{
                    license.licenseType.duration === "permanent"
                      ? "Không giới hạn"
                      : formatDate(license.validUntil)
                  }}
                </div>
              </div>

              <div class="detail-row">
                <div class="label">Đơn hàng:</div>
                <div class="value">
                  <router-link
                    :to="`/profile/orders/${license.order?._id}`"
                    class="order-link"
                  >
                    {{ license.order?.orderCode || "N/A" }}
                    <i class="fas fa-external-link-alt ms-1"></i>
                  </router-link>
                </div>
              </div>

              <div class="detail-row">
                <div class="label">Ngày tạo:</div>
                <div class="value">{{ formatDate(license.createdAt) }}</div>
              </div>
            </div>

            <!-- Nút đọc sách -->
            <div class="action-buttons mt-4">
              <button
                class="btn btn-primary btn-lg"
                :disabled="!license.isValid"
                @click="readBook(license.book?._id)"
              >
                <i class="fas fa-book-reader me-2"></i>
                Đọc sách
              </button>

              <button
                v-if="!license.isValid && license.status === 'expired'"
                class="btn btn-outline-primary ms-3"
                @click="renewLicense(license._id)"
              >
                <i class="fas fa-sync me-2"></i>
                Gia hạn bản quyền
              </button>
            </div>
          </div>
        </div>
        <!-- Mô tả sách -->
        <div class="book-description mt-5" v-if="license.book?.description">
          <h5 class="section-title">Mô tả sách</h5>
          <div
            class="description-content"
            v-html="license.book?.description"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import licenseService from "@/services/licenseService";

const route = useRoute();
const router = useRouter();
const toast = useToast();

// State
const license = ref(null);
const loading = ref(false);
const error = ref(null);

// Methods
const fetchLicenseDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const licenseId = route.params.id;
    const response = await licenseService.getLicenseDetails(licenseId);

    if (response.success) {
      license.value = response.license;
    } else {
      throw new Error(response.message || "Không thể tải thông tin bản quyền");
    }
  } catch (err) {
    error.value = err.message || "Có lỗi xảy ra khi tải thông tin bản quyền";
    console.error("Error fetching license details:", err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
};

const formatLicenseType = (licenseType) => {
  if (!licenseType) return "N/A";

  const durationMap = {
    "1_month": "1 tháng",
    "3_months": "3 tháng",
    "6_months": "6 tháng",
    permanent: "Vĩnh viễn",
  };

  const duration = durationMap[licenseType.duration] || licenseType.duration;
  const price = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(licenseType.price);

  return `${duration} - ${price}`;
};

const getStatusClass = (status) => {
  switch (status) {
    case "active":
      return "status-active";
    case "expired":
      return "status-expired";
    case "suspended":
      return "status-suspended";
    default:
      return "";
  }
};

const getStatusDisplay = (status) => {
  return licenseService.getLicenseStatusDisplay({ status });
};

const isExpiringSoon = (license) => {
  if (license.licenseType.duration === "permanent") return false;
  return license.daysRemaining <= 7 && license.daysRemaining > 0;
};

const readBook = (bookId) => {
  if (!bookId) {
    toast.error("Không tìm thấy thông tin sách");
    return;
  }

  // Lấy slug của sách từ license
  const bookSlug = license.value?.book?.slug;
  if (!bookSlug) {
    toast.error("Không tìm thấy thông tin slug sách");
    return;
  }

  // Điều hướng đến trang đọc sách với slug
  router.push(`/read/${bookSlug}`);
};

const renewLicense = (licenseId) => {
  // Điều hướng đến trang gia hạn bản quyền
  toast.info("Chức năng gia hạn đang được phát triển");
  // router.push(`/book/${bookId}?renew=true`);
};

// Lifecycle
onMounted(() => {
  fetchLicenseDetails();
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

/* Book cover */
.book-cover-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background-color: #f8f9fa;
}

.book-cover {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  display: block;
}

/* Badge removed */

/* Book title */
.book-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  line-height: 1.3;
  margin-bottom: 1rem;
}

/* Status indicator */
.status-indicator {
  margin-bottom: 1.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-active {
  background-color: rgba(25, 135, 84, 0.1);
  color: #198754;
  border: 1px solid rgba(25, 135, 84, 0.2);
}

.status-expired {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.status-suspended {
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.license-time {
  margin-top: 0.75rem;
  font-size: 0.95rem;
}

.text-warning {
  color: #ffc107 !important;
}

/* License details */
.license-details {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1.5rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  width: 120px;
  font-weight: 600;
  color: #495057;
}

.detail-row .value {
  flex: 1;
  color: #212529;
}

.license-code {
  font-family: monospace;
  font-weight: 600;
  letter-spacing: 0.5px;
  background-color: #e9ecef;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.order-link {
  color: #0d6efd;
  text-decoration: none;
  font-weight: 500;
}

.order-link:hover {
  text-decoration: underline;
}

/* Book description */
.book-description {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eaeaea;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #343a40;
}

.description-content {
  color: #495057;
  line-height: 1.7;
  white-space: pre-line;
}

/* Action buttons */
.action-buttons {
  margin-top: 1.5rem;
}

/* Loading states */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Responsive */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem;
  }

  .book-title {
    font-size: 1.25rem;
    margin-top: 1rem;
  }

  .detail-row {
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .detail-row .label {
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-buttons .btn {
    width: 100%;
  }

  .action-buttons .ms-3 {
    margin-left: 0 !important;
  }
}
</style>
