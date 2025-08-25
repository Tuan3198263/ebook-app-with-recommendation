<template>
  <div class="profile-page">
    <div class="container py-4">
      <div class="row">
        <!-- Sidebar di động -->
        <div class="d-block d-md-none mb-3">
          <button
            class="btn btn-primary w-100 d-flex justify-content-between align-items-center"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mobileSidebar"
            aria-expanded="false"
            aria-controls="mobileSidebar"
          >
            <span>Menu tài khoản</span>
            <i class="fas fa-bars"></i>
          </button>
          <div class="collapse mt-2" id="mobileSidebar">
            <ProfileSidebar />
          </div>
        </div>

        <!-- Sidebar desktop -->
        <div class="col-md-3 d-none d-md-block">
          <ProfileSidebar />
        </div>
        <!-- Nội dung chính - cải tiến để ngăn lỗi DOM trong quá trình chuyển trang -->
        <div class="col-md-9">
          <div class="card profile-content">
            <div class="router-view-wrapper">
              <router-view v-slot="{ Component }">
                <keep-alive>
                  <component :is="Component" :key="$route.fullPath" />
                </keep-alive>
              </router-view>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, onMounted } from "vue";
import ProfileSidebar from "../../components/profile/ProfileSidebar.vue";

// Thêm biến trạng thái để theo dõi sự sẵn sàng của component
const isReady = ref(false);

// Đảm bảo component đã sẵn sàng trước khi hiển thị router-view
onBeforeMount(() => {
  // Đánh dấu component đang chuẩn bị
  isReady.value = false;
});

onMounted(() => {
  // Sử dụng setTimeout để đảm bảo DOM đã được cập nhật
  setTimeout(() => {
    // Đánh dấu component đã sẵn sàng
    isReady.value = true;
  }, 10);
});
</script>

<style scoped>
.profile-page {
  min-height: 80vh;
  background-color: #f8f9fa;
}

.profile-content {
  border-radius: 10px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  background-color: #fff;
  min-height: 500px;
}

.router-view-wrapper {
  width: 100%;
  height: 100%;
}
</style>
