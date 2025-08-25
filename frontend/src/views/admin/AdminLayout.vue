<template>
  <div :class="['admin-layout', { 'sidebar-collapsed': sidebarCollapsed }]">
    <!-- Admin Navbar -->
    <nav class="admin-navbar navbar navbar-dark">
      <div class="container-fluid px-3">
        <!-- Logo và tên -->
        <div class="navbar-brand">
          <router-link
            to="/admin"
            class="text-light text-decoration-none d-flex align-items-center"
          >
            <img
              src="/vite.svg"
              alt="Logo"
              width="24"
              height="24"
              class="me-2"
            />
            <span>Quản trị</span>
          </router-link>
        </div>

        <!-- Các nút bên phải -->
        <div class="d-flex align-items-center">
          <!-- Nút thu gọn sidebar -->
          <button
            class="btn btn-link text-light px-2 d-none d-lg-block"
            @click="toggleSidebar"
          >
            <i
              :class="sidebarCollapsed ? 'fas fa-indent' : 'fas fa-outdent'"
            ></i>
          </button>

          <!-- User dropdown - Sửa lại phần này -->
          <div class="dropdown">
            <a
              class="nav-link dropdown-toggle text-light d-flex align-items-center"
              href="#"
              role="button"
              @click.prevent="toggleUserDropdown"
              :aria-expanded="userDropdownOpen"
            >
              <img
                :src="userAvatar"
                alt="User"
                class="avatar-img rounded-circle"
                width="28"
                height="28"
              />
              <span class="ms-2 d-none d-md-inline">{{ userName }}</span>
            </a>
            <ul
              class="dropdown-menu dropdown-menu-end"
              :class="{ show: userDropdownOpen }"
            >
              <li>
                <router-link
                  to="/"
                  class="dropdown-item"
                  @click="userDropdownOpen = false"
                >
                  <i class="fas fa-home me-2"></i>Trang chủ
                </router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="handleLogout">
                  <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <div class="admin-main">
      <!-- Admin Sidebar -->
      <div class="admin-sidebar">
        <div class="sidebar-header">
          <h5 class="sidebar-title">Menu quản trị</h5>
          <button
            class="btn btn-link sidebar-close d-lg-none"
            @click="toggleSidebar"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="sidebar-content">
          <ul class="nav flex-column">
            <li class="nav-item">
              <router-link
                to="/admin"
                class="nav-link"
                :class="{ active: $route.name === 'admin-dashboard' }"
              >
                <i class="fas fa-tachometer-alt"></i>
                <span class="nav-text">Bảng điều khiển</span>
              </router-link>
            </li>
            <li class="nav-item">
              <router-link
                to="/admin/categories"
                class="nav-link"
                :class="{ active: $route.name === 'category-management' }"
              >
                <i class="fas fa-list"></i>
                <span class="nav-text">Danh mục</span>
              </router-link>
            </li>
            <li class="nav-item">
              <router-link
                to="/admin/authors"
                class="nav-link"
                :class="{ active: $route.name === 'author-management' }"
              >
                <i class="fas fa-user-edit"></i>
                <span class="nav-text">Tác giả</span>
              </router-link>
            </li>
            <!-- Sửa menu quản lý sách với submenu -->
            <li class="nav-item">
              <a
                href="#"
                @click.prevent="toggleBookMenu"
                class="nav-link"
                :class="{ active: isBookMenuActive }"
              >
                <i class="fas fa-book"></i>
                <span class="nav-text">Sách</span>
                <i
                  class="fas ms-auto submenu-icon"
                  :class="bookMenuOpen ? 'fa-chevron-down' : 'fa-chevron-right'"
                ></i>
              </a>
              <div
                class="collapse"
                :class="{ show: bookMenuOpen }"
                id="bookSubmenu"
              >
                <ul>
                  <li>
                    <router-link to="/admin/books" class="nav-link sub-link">
                      <i class="fas fa-list-ul"></i>
                      <span class="nav-text">Danh sách</span>
                    </router-link>
                  </li>
                  <li>
                    <router-link
                      to="/admin/books/add"
                      class="nav-link sub-link"
                    >
                      <i class="fas fa-plus"></i>
                      <span class="nav-text">Thêm sách mới</span>
                    </router-link>
                  </li>
                </ul>
              </div>
            </li>
            <li class="nav-item">
              <router-link
                to="/admin/orders"
                class="nav-link"
                :class="{ active: $route.name === 'order-management' }"
              >
                <i class="fas fa-shopping-cart"></i>
                <span class="nav-text">Đơn hàng</span>
              </router-link>
            </li>
            <router-link
              to="/admin/users"
              class="nav-link"
              :class="{ active: $route.name === 'user-management' }"
            >
              <i class="fas fa-user-tie"></i>
              <span class="nav-text">Người dùng</span>
            </router-link>
            <li class="nav-item">
              <router-link to="/admin/settings" class="nav-link">
                <i class="fas fa-cog"></i>
                <span class="nav-text">Cài đặt</span>
              </router-link>
            </li>
          </ul>
        </div>

        <div class="sidebar-footer">
          <button class="btn btn-link collapse-btn" @click="toggleSidebar">
            <i
              :class="
                sidebarCollapsed
                  ? 'fas fa-chevron-right'
                  : 'fas fa-chevron-left'
              "
            ></i>
          </button>
        </div>
      </div>

      <!-- Admin Content -->
      <div class="admin-content">
        <div class="container-fluid p-4">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import authService from "../../services/authService";

// Các biến trạng thái
const sidebarCollapsed = ref(false);
const isFullscreen = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

// Thêm các biến để quản lý trạng thái mở/đóng của menu
const bookMenuOpen = ref(false);
const userMenuOpen = ref(false);
// Thêm biến mới cho user dropdown
const userDropdownOpen = ref(false);

// Thông tin người dùng
const userName = ref("Quản trị viên");
const userAvatar = ref(
  "https://cdn-icons-png.flaticon.com/512/6596/6596121.png"
);

// Lấy thông tin người dùng khi trang được tải
onMounted(async () => {
  // Khôi phục trạng thái sidebar từ localStorage
  const savedState = localStorage.getItem("adminSidebarCollapsed");
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === "true";
  } else if (window.innerWidth < 992) {
    // Auto collapse trên thiết bị nhỏ
    sidebarCollapsed.value = true;
  }

  // Theo dõi sự kiện fullscreen
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  // Theo dõi sự kiện resize
  window.addEventListener("resize", handleResize);
  handleResize();

  // Lấy thông tin người dùng
  if (authStore.isLoggedIn) {
    try {
      const response = await authService.getProfile();
      if (response.success && response.user) {
        userName.value = response.user.name;
        userAvatar.value = response.user.avatar;
      }
    } catch (error) {
      console.error("Không thể lấy thông tin người dùng:", error);
    }
  }

  // Khởi tạo trạng thái mở của các menu dựa trên route hiện tại
  updateMenuState();
});

// Kiểm tra menu user có đang active không
const isUserMenuActive = computed(() => {
  return (
    route.path.includes("/admin/users") || route.path.includes("/admin/roles")
  );
});

// Kiểm tra menu book có đang active không
const isBookMenuActive = computed(() => {
  return route.path.includes("/admin/books");
});

// Cập nhật trạng thái menu dựa trên route hiện tại
const updateMenuState = () => {
  bookMenuOpen.value = isBookMenuActive.value;
  userMenuOpen.value = isUserMenuActive.value;
};

// Theo dõi thay đổi route để cập nhật trạng thái menu
watch(
  () => route.path,
  () => {
    updateMenuState();
  }
);

// Các hàm toggle menu
const toggleBookMenu = () => {
  bookMenuOpen.value = !bookMenuOpen.value;
  if (bookMenuOpen.value) {
    userMenuOpen.value = false;
  }
};

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
  if (userMenuOpen.value) {
    bookMenuOpen.value = false;
  }
};

// Toggle thu gọn sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  localStorage.setItem("adminSidebarCollapsed", sidebarCollapsed.value);
};

// Toggle chế độ toàn màn hình
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      toast.warning(`Lỗi khi chuyển sang chế độ toàn màn hình: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// Xử lý đăng xuất
const handleLogout = () => {
  authStore.logout();
  toast.success("Đăng xuất thành công");
  router.push("/login");
};

// Xử lý sự kiện thay đổi trạng thái toàn màn hình
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// Xử lý sự kiện thay đổi kích thước màn hình
const handleResize = () => {
  if (window.innerWidth < 992 && !sidebarCollapsed.value) {
    sidebarCollapsed.value = true;
  }
};

// Thêm hàm toggle user dropdown
const toggleUserDropdown = () => {
  userDropdownOpen.value = !userDropdownOpen.value;
};

// Thêm listener để đóng dropdown khi click ra ngoài
const closeDropdownOnClickOutside = (event) => {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown && !dropdown.contains(event.target) && userDropdownOpen.value) {
    userDropdownOpen.value = false;
  }
};

onMounted(() => {
  // ...existing code...

  // Thêm event listener cho click outside
  document.addEventListener("click", closeDropdownOnClickOutside);
});

onBeforeUnmount(() => {
  // ...existing code...

  // Xóa event listener khi component unmount
  document.removeEventListener("click", closeDropdownOnClickOutside);
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.admin-navbar {
  background-color: #3c4b64;
  padding: 0.5rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1040;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 56px; /* Chiều cao cố định */
}

.admin-navbar .navbar-brand {
  font-size: 1.1rem;
  padding: 0;
  margin: 0;
}

.admin-main {
  display: flex;
  flex: 1;
  padding-top: 56px; /* Tương ứng với chiều cao navbar */
}

/* Styles cho sidebar */
.admin-sidebar {
  width: 250px;
  background-color: #ffffff;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1030;
  overflow-y: auto;
  position: fixed;
  top: 56px; /* Vị trí ngay dưới navbar */
  left: 0;
  bottom: 0;
  height: calc(100vh - 56px);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.sidebar-content .nav-link {
  padding: 0.8rem 1rem;
  color: #4f5d73;
  display: flex;
  align-items: center;
  border-radius: 0.25rem;
  margin: 0.2rem 0.5rem;
}

.sidebar-content .nav-link i {
  margin-right: 0.5rem;
  width: 24px;
  text-align: center;
}

.sidebar-content .nav-link:hover,
.sidebar-content .nav-link.active {
  background-color: #ebedef;
  color: #3c4b64;
}

.sidebar-content .sub-link {
  padding-left: 3rem;
  font-size: 0.875rem;
}

.sidebar-content .collapse ul {
  list-style: none;
  padding-left: 0;
}

.submenu-icon {
  transition: transform 0.3s;
}

.nav-link[aria-expanded="true"] .submenu-icon {
  transform: rotate(180deg);
}

.sidebar-footer {
  border-top: 1px solid #e0e0e0;
  padding: 0.75rem;
  display: flex;
  justify-content: flex-end;
}

.collapse-btn {
  color: #4f5d73;
  padding: 0.25rem;
  background: none;
  border: none;
}

.admin-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  background-color: #f0f2f5;
  min-height: calc(100vh - 56px);
  width: calc(100% - 250px);
}

/* Khi sidebar thu gọn */
.sidebar-collapsed .admin-sidebar {
  width: 70px;
}

.sidebar-collapsed .admin-content {
  margin-left: 70px;
  width: calc(100% - 70px);
}

.sidebar-collapsed .sidebar-title,
.sidebar-collapsed .nav-text,
.sidebar-collapsed .submenu-icon {
  display: none;
}

.sidebar-collapsed .sidebar-content .nav-link {
  justify-content: center;
  padding: 0.8rem;
}

.sidebar-collapsed .sidebar-content .nav-link i {
  margin-right: 0;
  font-size: 1.25rem;
}

.sidebar-collapsed .sidebar-content .sub-link {
  padding-left: 0.75rem;
}

.sidebar-collapsed #userSubmenu {
  position: absolute;
  left: 70px;
  top: 0;
  width: 200px;
  background: white;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.sidebar-collapsed #userSubmenu .nav-text {
  display: inline-block;
}

/* Responsive - Đơn giản hóa */
@media (max-width: 991.98px) {
  .admin-navbar {
    padding: 0.4rem 0.5rem;
  }

  .admin-sidebar {
    width: 70px; /* Luôn thu gọn trên mobile */
  }

  .admin-content {
    margin-left: 70px;
    width: calc(100% - 70px);
  }

  .sidebar-title,
  .nav-text,
  .submenu-icon {
    display: none; /* Ẩn text trên sidebar */
  }

  .sidebar-content .nav-link {
    justify-content: center;
    padding: 0.8rem;
  }

  .sidebar-content .nav-link i {
    margin-right: 0;
    font-size: 1.25rem;
  }

  .sidebar-footer {
    display: none; /* Ẩn nút thu gọn */
  }
}

/* Màn hình cực nhỏ */
@media (max-width: 575.98px) {
  .admin-navbar .container-fluid {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}

/* Thêm CSS cho dropdown */
.dropdown-menu.show {
  display: block;
}
</style>
