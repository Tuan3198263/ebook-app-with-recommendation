<template>
  <nav class="navbar navbar-expand-lg">
    <div class="container">
      <router-link to="/" class="navbar-brand">
        <img
          src="/logo.png"
          alt="Logo"
          width="30"
          height="30"
          class="d-inline-block align-text-top me-2"
        />
        CTU Ebook
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <!-- Main Navigation -->
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link to="/" class="nav-link" active-class="active"
              >Trang chủ</router-link
            >
          </li>
          <!-- Categories Dropdown -->
          <li class="nav-item dropdown categories-dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="categoriesDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @mouseenter="showCategoriesDropdown"
              @mouseleave="hideCategoriesDropdown"
            >
              Danh mục
            </a>
            <ul
              class="dropdown-menu categories-menu"
              aria-labelledby="categoriesDropdown"
              @mouseenter="showCategoriesDropdown"
              @mouseleave="hideCategoriesDropdown"
            >
              <li
                v-if="categoriesLoading"
                class="dropdown-item-text text-center"
              >
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
              </li>
              <template v-else>
                <li v-for="category in displayCategories" :key="category._id">
                  <router-link
                    :to="{
                      name: 'category-products',
                      params: { slug: category.slug },
                    }"
                    class="dropdown-item category-item"
                  >
                    <i class="fas fa-folder-open me-2 category-icon"></i>
                    {{ category.name }}
                  </router-link>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a
                    href="#"
                    class="dropdown-item view-all-item"
                    @click="viewAllCategories"
                  >
                    <strong>Xem tất cả</strong>
                  </a>
                </li>
              </template>
            </ul>
          </li>
          <li class="nav-item">
            <router-link to="/about" class="nav-link" active-class="active"
              >Giới thiệu</router-link
            >
          </li>
        </ul>

        <!-- Search Bar -->
        <div class="search-container mx-auto">
          <form @submit.prevent="performSearch" class="search-form">
            <div class="input-group">
              <input
                type="text"
                class="form-control search-input"
                placeholder="Tìm kiếm sách..."
                v-model="searchKeyword"
                maxlength="100"
                ref="searchInputRef"
              />
              <button
                class="btn btn-search"
                type="submit"
                :disabled="!searchKeyword.trim()"
                title="Tìm kiếm"
              >
                <i class="fas fa-search"></i>
              </button>
            </div>
          </form>
        </div>

        <!-- Right Side Actions -->
        <div class="navbar-actions">
          <!-- Cart Icon -->
          <button
            class="btn btn-link nav-icon-btn me-2"
            @click="openCart"
            title="Giỏ hàng"
          >
            <i class="fas fa-shopping-cart"></i>
          </button>

          <!-- User Section -->
          <div v-if="!authStore.isLoggedIn">
            <router-link to="/login" class="nav-link" active-class="active">
              <i class="fas fa-user me-1"></i> Đăng nhập
            </router-link>
          </div>
          <div v-else class="dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center"
              href="#"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                :src="userProfile?.avatar"
                alt="Avatar"
                class="rounded-circle me-2"
                width="30"
                height="30"
              />
            </a>
            <ul
              class="dropdown-menu dropdown-menu-end"
              aria-labelledby="userDropdown"
            >
              <li>
                <router-link class="dropdown-item" to="/profile">
                  <i class="fas fa-user me-2"></i> Tài khoản
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/profile/favorites">
                  <i class="fas fa-heart me-2"></i> Yêu thích
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/orders">
                  <i class="fas fa-shopping-bag me-2"></i> Đơn hàng
                </router-link>
              </li>
              <li>
                <hr class="dropdown-divider" />
              </li>
              <li>
                <button class="dropdown-item" @click="logout">
                  <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "vue-toastification";
import authService from "../../services/authService";
import categoryService from "../../services/categoryService";

// Hook các tiện ích
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Refs
const searchKeyword = ref("");
const searchInputRef = ref(null);
const categories = ref([]);
const categoriesLoading = ref(false);
const userProfile = ref(null);

// Computed
const displayCategories = computed(() => {
  return categories.value.slice(0, 6); // Hiển thị 6 danh mục đầu tiên
});

// Hàm tải thông tin người dùng (di chuyển lên trước watch)
const loadUserProfile = async () => {
  try {
    const response = await authService.getProfile();
    if (response.success && response.user) {
      userProfile.value = response.user;
    }
  } catch (error) {
    console.error("Không thể lấy thông tin người dùng:", error);
  }
};

// Theo dõi trạng thái đăng nhập để cập nhật thông tin người dùng
watch(
  () => authStore.isLoggedIn,
  async (newValue) => {
    if (newValue) {
      // Nếu đã đăng nhập, tải thông tin người dùng
      await loadUserProfile();
    } else {
      // Nếu đăng xuất, xóa thông tin người dùng
      userProfile.value = null;
    }
  },
  { immediate: true }
);

// Lifecycle Hooks
onMounted(async () => {
  await fetchCategories();
  if (authStore.isLoggedIn) {
    await loadUserProfile();
  }
});

// Lấy danh sách danh mục
const fetchCategories = async () => {
  categoriesLoading.value = true;
  try {
    const response = await categoryService.getProductCategories();
    if (response.success) {
      categories.value = response.data;
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
  } finally {
    categoriesLoading.value = false;
  }
};

// Xử lý hover dropdown danh mục
let categoriesDropdownTimeout;
const showCategoriesDropdown = () => {
  clearTimeout(categoriesDropdownTimeout);
  const dropdown = document.querySelector(
    ".categories-dropdown .dropdown-menu"
  );
  if (dropdown) {
    dropdown.classList.add("show");
  }
};

const hideCategoriesDropdown = () => {
  categoriesDropdownTimeout = setTimeout(() => {
    const dropdown = document.querySelector(
      ".categories-dropdown .dropdown-menu"
    );
    if (dropdown) {
      dropdown.classList.remove("show");
    }
  }, 300);
};

// Xem tất cả danh mục (chức năng sẽ làm sau)
const viewAllCategories = (e) => {
  e.preventDefault();
  toast.info("Chức năng xem tất cả danh mục đang được phát triển");
};

// Thực hiện tìm kiếm
const performSearch = () => {
  const keyword = searchKeyword.value.trim();

  if (!keyword) {
    toast.warning("Vui lòng nhập từ khóa tìm kiếm");
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
    return;
  }

  if (keyword.length > 100) {
    toast.warning("Từ khóa tìm kiếm không được vượt quá 100 ký tự");
    return;
  }

  try {
    router.push({
      name: "search-products",
      query: { q: keyword },
    });

    if (searchInputRef.value) {
      searchInputRef.value.blur();
    }
  } catch (error) {
    console.error("Lỗi khi thực hiện tìm kiếm:", error);
    toast.error("Có lỗi xảy ra khi tìm kiếm");
  }
};

// Mở giỏ hàng (chức năng sẽ làm sau)
const openCart = () => {
  router.push("/cart");
};

// Xử lý đăng xuất
const logout = () => {
  authStore.logout();
  toast.success("Đã đăng xuất thành công");
  router.push("/");
};
</script>

<style scoped>
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
}

.navbar-brand {
  font-weight: bold;
  color: #646cff;
  display: flex;
  align-items: center;
}

.nav-link {
  color: #213547;
  font-weight: 500;
  margin: 0 0.5rem;
  display: flex;
  align-items: center;
}

.nav-link.active {
  color: #646cff;
}

.nav-link:hover {
  color: #535bf2;
}

/* Search Container */
.search-container {
  flex: 0 0 350px;
  max-width: 350px;
}

.search-form {
  width: 100%;
}

.search-input {
  border: 1px solid #dee2e6;
  border-radius: 20px 0 0 20px;
  padding: 0.375rem 0.875rem;
  font-size: 0.85rem;
  height: 36px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #646cff;
  box-shadow: none;
}

.btn-search {
  background-color: #646cff;
  border: 1px solid #646cff;
  color: white;
  border-radius: 0 20px 20px 0;
  padding: 0.375rem 0.875rem;
  height: 36px;
  transition: background-color 0.2s;
}

.btn-search:hover:not(:disabled) {
  background-color: #535bf2;
  border-color: #535bf2;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Navbar Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.nav-icon-btn {
  border: none;
  background: none;
  color: #213547;
  font-size: 1.1rem;
  padding: 0.5rem;
  transition: color 0.2s;
}

.nav-icon-btn:hover {
  color: #646cff;
}

/* Categories Dropdown */
.categories-dropdown {
  position: relative;
}

.categories-menu {
  min-width: 220px;
  border: none;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  padding: 0.25rem 0;
  margin-top: 0.25rem;
}

.category-item {
  padding: 0.5rem 1rem;
  color: #333;
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.category-item:hover {
  background-color: #f8f9fa;
  color: #007bff;
}

.category-icon {
  color: #6c757d;
  font-size: 0.8rem;
}

.category-item:hover .category-icon {
  color: #007bff;
}

.view-all-item {
  padding: 0.5rem 1rem;
  color: #007bff;
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.view-all-item:hover {
  background-color: #e9ecef;
  color: #0056b3;
}

/* User Dropdown */
.user-dropdown {
  position: relative;
}

.user-toggle {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 25px;
  transition: background-color 0.2s;
}

.user-toggle:hover {
  background-color: #f8f9fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e9ecef;
}

.user-menu {
  min-width: 280px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 0;
  margin-top: 0.5rem;
}

.dropdown-header {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-details {
  margin-left: 1rem;
  flex: 1;
}

.user-menu-item {
  padding: 0.875rem 1.5rem;
  color: #333;
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.user-menu-item:hover {
  background-color: #f8f9fa;
  color: #007bff;
}

.user-menu-item i {
  width: 20px;
  font-size: 0.9rem;
  color: #6c757d;
}

.user-menu-item:hover i {
  color: #007bff;
}

.logout-item:hover {
  background-color: #fff5f5;
  color: #dc3545;
}

.logout-item:hover i {
  color: #dc3545;
}

.login-link {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
}

.login-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: white !important;
}

/* Responsive Design */
@media (max-width: 991px) {
  .navbar-collapse {
    margin-top: 1rem;
  }

  .search-container {
    flex: 1 1 100%;
    max-width: 100%;
    margin: 1rem 0;
    order: 3;
  }

  .navbar-actions {
    margin-left: 0;
    order: 2;
  }

  .navbar-nav {
    order: 1;
  }

  .categories-menu,
  .user-menu {
    position: static;
    width: 100%;
    box-shadow: none;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    margin-top: 0.5rem;
  }
}

@media (max-width: 768px) {
  .search-container {
    flex: 0 0 100%;
  }

  .search-input {
    font-size: 0.8rem;
    padding: 0.3rem 0.75rem;
    height: 34px;
  }

  .btn-search {
    padding: 0.3rem 0.75rem;
    height: 34px;
  }

  .nav-icon-btn {
    font-size: 1rem;
    padding: 0.375rem;
  }

  .dropdown-header {
    padding: 0.75rem 1rem;
  }

  .user-info-avatar {
    width: 40px;
    height: 40px;
  }

  .user-details-name {
    font-size: 1rem;
  }
}

@media (max-width: 576px) {
  .navbar {
    padding: 0.375rem 0.75rem;
  }

  .navbar-brand {
    font-size: 1rem;
  }

  .navbar-brand img {
    width: 25px;
    height: 25px;
  }

  .search-container {
    flex: 0 0 280px;
    max-width: 280px;
  }
}
</style>
