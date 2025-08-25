<script setup>
import TheNavbar from "./components/layout/TheNavbar.vue";
import TheFooter from "./components/layout/TheFooter.vue";
import HelloWorld from "./components/HelloWorld.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

// Kiểm tra xem có đang ở trang admin hay không
const route = useRoute();
const isAdminRoute = computed(() => {
  return route.path.startsWith("/admin");
});

// Kiểm tra xem có đang ở trang reader hay không
const isReaderRoute = computed(() => {
  return route.path.startsWith("/read") || route.meta?.layout === "reader";
});
</script>

<template>
  <div class="app-container">
    <!-- Chỉ hiển thị Navbar và Footer khi không phải trang admin hoặc reader -->
    <TheNavbar v-if="!isAdminRoute && !isReaderRoute" />

    <main
      class="main-content"
      :class="{
        'admin-content': isAdminRoute,
        'reader-content': isReaderRoute,
      }"
    >
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <TheFooter v-if="!isAdminRoute && !isReaderRoute" />
  </div>
</template>

<style>
/* Kiểu dáng toàn cục */
:root {
  --primary-color: #646cff;
  --primary-hover: #535bf2;
  --text-color: #213547;
  --background-color: #ffffff;
}

body {
  margin: 0;
  display: flex;
  min-width: 320px;
  min-height: 100vh;
  color: var(--text-color);
  background-color: var(--background-color);
}

#app {
  width: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-bottom: 2rem;
  padding-top: 70px; /* Thêm padding-top để tránh nội dung bị che bởi navbar */
}

/* Nội dung admin không cần padding bottom */
.admin-content {
  padding-bottom: 0;
  padding-top: 0; /* Admin content không cần padding-top vì được xử lý riêng */
}

/* Reader content full screen */
.reader-content {
  padding: 0;
  padding-top: 0;
  height: 100vh;
  overflow: hidden;
}

/* Hiệu ứng chuyển trang */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Xóa hiệu ứng viền xanh khi focus */
.form-check-input:focus {
  box-shadow: none !important;
  outline: none !important;
}

.form-control:focus,
select:focus {
  box-shadow: none !important;
  border-color: #ccc !important; /* Hoặc màu bạn muốn */
}

/* Tùy chỉnh màu nền cho từng loại toast */
.Vue-Toastification__toast--success {
  background: #fff !important;
  border-left: 8px solid #28a745 !important; /* Xanh lá */
  color: #575454 !important;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1) !important;
}

.Vue-Toastification__toast--error {
  background: #fff !important;
  border-left: 8px solid #e04f5d !important; /* Đỏ */
  color: #575454 !important;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1) !important;
}

.Vue-Toastification__toast--info {
  background: #fff !important;
  border-left: 8px solid #007bff !important; /* Xanh dương */
  color: #575454 !important;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1) !important;
}

.Vue-Toastification__toast--warning {
  background: #fff !important;
  border-left: 8px solid #f0ce67 !important; /* Vàng */
  color: #575454 !important;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1) !important;
}

/* Tùy chỉnh khoảng cách và bố cục */
.Vue-Toastification__toast {
  padding: 15px !important;
  display: flex !important;
  align-items: center !important;
  font-weight: 500 !important;
  font-size: 12px !important;
}

/* Nút đóng */
.Vue-Toastification__close-button {
  color: rgb(97, 97, 97) !important;
  font-size: 18px !important;
  opacity: 0.6 !important;
}

.Vue-Toastification__close-button:hover {
  opacity: 1 !important;
}

/* Tùy chỉnh màu icon cho từng loại toast */
.Vue-Toastification__toast--success .Vue-Toastification__icon {
  color: #28a745 !important; /* Xanh lá */
}

.Vue-Toastification__toast--error .Vue-Toastification__icon {
  color: #e04f5d !important; /* Đỏ */
}

.Vue-Toastification__toast--info .Vue-Toastification__icon {
  color: #007bff !important; /* Xanh dương */
}

.Vue-Toastification__toast--warning .Vue-Toastification__icon {
  color: #f0ce67 !important; /* Vàng */
}
/* Đảm bảo icon không bị lệch */
.Vue-Toastification__icon {
  margin-right: 10px !important;
}
</style>
