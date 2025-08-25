<template>
  <nav
    aria-label="breadcrumb"
    class="breadcrumb-nav"
    v-if="breadcrumbItems.length > 1"
  >
    <div class="container">
      <ol class="breadcrumb mb-0">
        <li
          v-for="(item, index) in breadcrumbItems"
          :key="index"
          class="breadcrumb-item"
          :class="{ active: index === breadcrumbItems.length - 1 }"
        >
          <router-link
            v-if="item.to && index < breadcrumbItems.length - 1"
            :to="item.to"
            class="breadcrumb-link"
          >
            <i v-if="item.icon" :class="item.icon" class="me-1"></i>
            {{ item.text }}
          </router-link>
          <span v-else class="breadcrumb-current">
            <i v-if="item.icon" :class="item.icon" class="me-1"></i>
            {{ item.text }}
          </span>
        </li>
      </ol>
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const breadcrumbItems = computed(() => {
  const items = [
    {
      text: "Trang chủ",
      to: { name: "home" },
      icon: "fas fa-home",
    },
  ];

  // Xử lý breadcrumb theo route
  const routeName = route.name;
  const routeParams = route.params;
  const routeQuery = route.query;

  switch (routeName) {
    case "home":
      // Chỉ hiển thị "Trang chủ", không cần breadcrumb
      return [];

    case "books":
      items.push({
        text: "Danh sách sách",
        icon: "fas fa-book",
      });
      break;

    case "categories":
      items.push({
        text: "Danh mục",
        icon: "fas fa-list",
      });
      break;

    case "category-products":
      items.push({
        text: "Danh mục",
        to: { name: "categories" },
        icon: "fas fa-list",
      });
      items.push({
        text: getCategoryNameFromSlug(routeParams.slug) || "Sản phẩm",
        icon: "fas fa-folder-open",
      });
      break;

    case "book-detail":
      items.push({
        text: "Danh sách sách",
        to: { name: "books" },
        icon: "fas fa-book",
      });
      items.push({
        text: getBookTitleFromSlug(routeParams.slug) || "Chi tiết sách",
        icon: "fas fa-book-open",
      });
      break;

    case "about":
      items.push({
        text: "Giới thiệu",
        icon: "fas fa-info-circle",
      });
      break;

    case "login":
      items.push({
        text: "Đăng nhập",
        icon: "fas fa-sign-in-alt",
      });
      break;

    case "register":
      items.push({
        text: "Đăng ký",
        icon: "fas fa-user-plus",
      });
      break;

    case "profile":
      items.push({
        text: "Tài khoản",
        icon: "fas fa-user",
      });
      break;

    case "profile-address":
      items.push({
        text: "Tài khoản",
        to: { name: "profile" },
        icon: "fas fa-user",
      });
      items.push({
        text: "Địa chỉ",
        icon: "fas fa-map-marker-alt",
      });
      break;

    case "profile-favorites":
      items.push({
        text: "Tài khoản",
        to: { name: "profile" },
        icon: "fas fa-user",
      });
      items.push({
        text: "Yêu thích",
        icon: "fas fa-heart",
      });
      break;

    case "profile-viewed":
      items.push({
        text: "Tài khoản",
        to: { name: "profile" },
        icon: "fas fa-user",
      });
      items.push({
        text: "Đã xem",
        icon: "fas fa-history",
      });
      break;

    case "profile-reviews":
      items.push({
        text: "Tài khoản",
        to: { name: "profile" },
        icon: "fas fa-user",
      });
      items.push({
        text: "Đánh giá",
        icon: "fas fa-star",
      });
      break;

    case "search":
      items.push({
        text: "Kết quả tìm kiếm",
        icon: "fas fa-search",
      });
      if (routeQuery.q) {
        items[items.length - 1].text += `: "${routeQuery.q}"`;
      }
      break;

    default:
      // Route không xác định
      if (route.meta?.breadcrumb) {
        items.push({
          text: route.meta.breadcrumb,
          icon: "fas fa-file",
        });
      }
      break;
  }

  return items;
});

// Helper functions để lấy tên từ slug (có thể được cải thiện bằng cách gọi API)
const getCategoryNameFromSlug = (slug) => {
  // Tạm thời trả về slug được format
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
};

const getBookTitleFromSlug = (slug) => {
  // Tạm thời trả về slug được format
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
};
</script>

<style scoped>
.breadcrumb-nav {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 0;
  margin-top: 70px; /* Để tránh navbar */
}

.breadcrumb {
  background: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item {
  font-size: 0.9rem;
}

.breadcrumb-link {
  color: #6c757d;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #007bff;
  text-decoration: underline;
}

.breadcrumb-current {
  color: #495057;
  font-weight: 500;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: var(--bs-breadcrumb-divider, ">") !important;
  color: #6c757d;
  margin: 0 0.5rem;
}

.breadcrumb-item.active {
  color: #495057;
}

@media (max-width: 768px) {
  .breadcrumb-nav {
    padding: 0.5rem 0;
  }

  .breadcrumb-item {
    font-size: 0.8rem;
  }

  .breadcrumb-item .fas {
    display: none;
  }
}
</style>
