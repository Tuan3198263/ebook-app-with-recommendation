<template>
  <div class="license-card" @click="$emit('click')">
    <div class="license-card-content">
      <!-- Badge trạng thái -->
      <div class="license-badge" :class="statusClass">
        {{ statusText }}
      </div>

      <!-- Ảnh bìa sách -->
      <div class="book-cover">
        <img
          :src="license.book?.coverImages?.[0] || '/placeholder-book.jpg'"
          :alt="license.book?.title"
          class="cover-image"
        />
      </div>

      <!-- Thông tin sách và bản quyền -->
      <div class="license-info">
        <!-- Tiêu đề sách -->
        <h3 class="book-title" :title="license.book?.title">
          {{ license.book?.title || "Không có tiêu đề" }}
        </h3>

        <!-- Thông tin bản quyền -->
        <div class="license-details">
          <!-- Loại bản quyền -->
          <div class="license-type" :title="licenseTypeText">
            <i class="fas fa-award me-1"></i>
            {{ licenseTypeText }}
          </div>

          <!-- Thời gian còn lại -->
          <div
            class="time-remaining"
            :class="{ 'text-danger': isExpiringSoon && isValid }"
          >
            <i :class="timeRemainingIcon"></i>
            {{ timeRemainingText }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import licenseService from "@/services/licenseService";

const props = defineProps({
  license: {
    type: Object,
    required: true,
  },
});

// Computed
const isValid = computed(() => {
  return props.license.isValid;
});

// Kiểm tra xem bản quyền có sắp hết hạn không (còn dưới 7 ngày)
const isExpiringSoon = computed(() => {
  if (props.license.licenseType.duration === "permanent") return false;
  return props.license.daysRemaining <= 7 && props.license.daysRemaining > 0;
});

// Class CSS cho badge trạng thái
const statusClass = computed(() => {
  switch (props.license.status) {
    case "active":
      return "license-badge-active";
    case "expired":
      return "license-badge-expired";
    case "suspended":
      return "license-badge-suspended";
    default:
      return "";
  }
});

// Text cho badge trạng thái
const statusText = computed(() => {
  const statusDisplay = licenseService.getLicenseStatusDisplay(props.license);
  return statusDisplay.text;
});

// Hiển thị loại bản quyền
const licenseTypeText = computed(() => {
  return licenseService.formatLicenseDuration(props.license);
});

// Hiển thị thời gian còn lại
const timeRemainingText = computed(() => {
  if (props.license.licenseType.duration === "permanent") {
    return "Vĩnh viễn";
  }

  if (!isValid.value) {
    return "Đã hết hạn";
  }

  const days = props.license.daysRemaining;

  if (days <= 0) {
    return "Hết hạn hôm nay";
  } else if (days === 1) {
    return "Còn 1 ngày";
  } else {
    return `Còn ${days} ngày`;
  }
});

// Icon cho thời gian còn lại
const timeRemainingIcon = computed(() => {
  if (props.license.licenseType.duration === "permanent") {
    return "fas fa-infinity me-1";
  }

  if (!isValid.value) {
    return "fas fa-times-circle me-1";
  }

  if (isExpiringSoon.value) {
    return "fas fa-exclamation-circle me-1";
  }

  return "fas fa-clock me-1";
});
</script>

<style scoped>
.license-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
  background-color: #fff;
}

.license-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.license-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-cover {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.license-card:hover .cover-image {
  transform: scale(1.05);
}

.license-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.license-badge-active {
  background-color: #198754;
  color: white;
}

.license-badge-expired {
  background-color: #dc3545;
  color: white;
}

.license-badge-suspended {
  background-color: #ffc107;
  color: #212529;
}

.license-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
  color: #2c3e50;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.license-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.license-type {
  font-size: 0.85rem;
  color: #495057;
  display: flex;
  align-items: center;
}

.time-remaining {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.time-remaining i {
  margin-right: 0.25rem;
}

/* Placeholder for future styling */

.text-danger {
  color: #dc3545 !important;
  font-weight: 600;
}

/* Hiệu ứng nhấp nháy nếu sắp hết hạn */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.text-danger i {
  animation: pulse 1.5s infinite;
}

@media (max-width: 768px) {
  .license-card {
    border-radius: 8px;
  }
  .license-info {
    padding: 0.75rem;
  }

  .book-title {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
}
</style>
