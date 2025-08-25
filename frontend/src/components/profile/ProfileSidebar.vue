<template>
  <div class="profile-sidebar mb-4">
    <!-- Thông tin người dùng -->
    <div class="user-info text-center mb-4">
      <div class="avatar-wrapper mb-3">
        <img :src="user.avatar" alt="Avatar" class="avatar-img" />
      </div>
      <h5 class="user-name mb-1">{{ user.name }}</h5>
      <p class="user-email text-muted small">{{ user.email }}</p>
    </div>

    <!-- Menu -->
    <div class="sidebar-menu">
      <router-link
        to="/profile"
        exact-active-class="active"
        class="sidebar-item"
        title="Thông tin cá nhân"
      >
        <i class="fas fa-user sidebar-icon"></i>
        <span class="sidebar-text">Thông tin cá nhân</span>
      </router-link>
      <router-link
        to="/profile/address"
        active-class="active"
        class="sidebar-item"
        title="Địa chỉ"
      >
        <i class="fas fa-map-marker-alt sidebar-icon"></i>
        <span class="sidebar-text">Địa chỉ</span>
      </router-link>

      <router-link
        to="/profile/orders"
        active-class="active"
        class="sidebar-item"
        title="Đơn hàng của tôi"
      >
        <i class="fas fa-shopping-bag sidebar-icon"></i>
        <span class="sidebar-text">Đơn hàng</span>
      </router-link>
      <router-link
        to="/profile/recently-viewed"
        active-class="active"
        class="sidebar-item"
        title="Đã xem gần đây"
      >
        <i class="fas fa-history sidebar-icon"></i>
        <span class="sidebar-text">Đã xem </span>
      </router-link>

      <router-link
        to="/profile/licenses"
        active-class="active"
        class="sidebar-item"
        title="Bản quyền sách"
      >
        <i class="fas fa-key sidebar-icon"></i>
        <span class="sidebar-text">Bản quyền</span>
      </router-link>

      <router-link
        to="/profile/favorites"
        active-class="active"
        class="sidebar-item"
        title="Sách yêu thích"
      >
        <i class="fas fa-heart sidebar-icon"></i>
        <span class="sidebar-text">Yêu thích</span>
      </router-link>

      <div class="divider my-3"></div>

      <a
        href="#"
        class="sidebar-item"
        @click.prevent="logout"
        title="Đăng xuất"
      >
        <i class="fas fa-sign-out-alt sidebar-icon"></i>
        <span class="sidebar-text">Đăng xuất</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import authService from "../../services/authService";
import mitt from "mitt"; // Thêm dòng này nếu chưa có

// Lấy emitter từ window hoặc tạo mới nếu chưa có
const emitter = window.emitter || (window.emitter = mitt());

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Thông tin người dùng
const user = ref({
  name: "",
  email: "",
  avatar: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png",
});

// Lấy thông tin người dùng từ API
const fetchUserProfile = async () => {
  try {
    const response = await authService.getProfile();
    if (response.success && response.user) {
      user.value = response.user;
    }
  } catch (error) {
    console.error("Không thể lấy thông tin người dùng:", error);
    toast.error("Không thể tải thông tin người dùng");
  }
};

// Đăng xuất
const logout = async () => {
  try {
    await authService.logout();
    authStore.logout();
    toast.info("Đã đăng xuất thành công");
    router.push("/login");
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    toast.error("Có lỗi xảy ra khi đăng xuất");
  }
};

// Đăng ký lắng nghe sự kiện cập nhật người dùng
const handleUserUpdated = () => {
  // Khi nhận được sự kiện user-updated, cập nhật lại thông tin
  fetchUserProfile();
};

// Khi component được tạo
onMounted(() => {
  fetchUserProfile();
  // Đăng ký lắng nghe sự kiện
  emitter.on("user-updated", handleUserUpdated);
});

// Khi component bị hủy
onUnmounted(() => {
  // Hủy đăng ký lắng nghe sự kiện
  emitter.off("user-updated", handleUserUpdated);
});
</script>

<style scoped>
.profile-sidebar {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  padding: 1.5rem;
}

.user-info {
  padding-bottom: 1rem;
  border-bottom: 1px solid #eaeaea;
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  border: 3px solid #f0f0f0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
  color: #333;
}

.sidebar-menu {
  margin-top: 1rem;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0.5rem;
  color: #495057;
  text-decoration: none;
  border-radius: 5px;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.sidebar-item:hover {
  background-color: #f8f9fa;
  color: #646cff;
}

.sidebar-item.active {
  background-color: #e9ecef;
  color: #646cff;
  font-weight: 500;
}

.sidebar-icon {
  width: 20px;
  margin-right: 10px;
  text-align: center;
}

.divider {
  height: 1px;
  background-color: #eaeaea;
}
</style>
