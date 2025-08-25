<template>
  <div class="search-products-page">
    <div class="container">
      <!-- Search Header -->
      <div class="search-header mb-4">
        <h4 class="search-title">
          <i class="fas fa-search me-2"></i>
          Kết quả tìm kiếm cho: "<span class="search-keyword">{{
            keyword
          }}</span
          >"
        </h4>
      </div>

      <div class="row">
        <!-- Sidebar Filters -->
        <div class="col-lg-3 col-md-4">
          <SearchFilters
            :current-filters="filters"
            :keyword="keyword"
            :loading="loading"
            @filter-change="handleFilterChange"
          />
        </div>

        <!-- Main Content -->
        <div class="col-lg-9 col-md-8">
          <!-- Toolbar -->
          <ProductToolbar
            :current-sort="filters.sort"
            :current-book-type="filters.bookType"
            :total-books="totalBooks"
            :loading="loading"
            @sort-change="handleSortChange"
            @book-type-change="handleBookTypeChange"
          />

          <!-- Products Grid -->
          <ProductGrid :books="books" :loading="loading" :error="error" />

          <!-- Pagination -->
          <ProductPagination
            v-if="totalPages > 1"
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import bookService from "@/services/bookService";
import SearchFilters from "@/components/search/SearchFilters.vue";
import ProductToolbar from "@/components/category/ProductToolbar.vue";
import ProductGrid from "@/components/category/ProductGrid.vue";
import ProductPagination from "@/components/category/ProductPagination.vue";

const route = useRoute();
const router = useRouter();

// Trạng thái
const books = ref([]);
const keyword = ref(route.query.q || "");
const totalBooks = ref(0);
const totalPages = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const error = ref(null);

// Bộ lọc
const filters = reactive({
  q: keyword.value,
  bookType: route.query.bookType || "",
  documentType: route.query.documentType || "",
  category: route.query.category || "",
  author: route.query.author || "",
  sort: route.query.sort || "relevance",
  page: parseInt(route.query.page) || 1,
  limit: 6,
});

// Phương thức
const fetchBooks = async () => {
  if (!keyword.value || keyword.value.trim().length === 0) {
    books.value = [];
    totalBooks.value = 0;
    totalPages.value = 0;
    error.value = "Vui lòng nhập từ khóa tìm kiếm";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const params = {
      ...filters,
      q: keyword.value,
      page: currentPage.value,
    };

    // Loại bỏ các tham số rỗng
    Object.keys(params).forEach((key) => {
      if (!params[key] || params[key] === "") {
        delete params[key];
      }
    });

    const response = await bookService.searchBooks(params);

    if (response.success) {
      books.value = response.data;
      totalBooks.value = response.count;
      totalPages.value = response.totalPages;
      currentPage.value = response.currentPage;
    }
  } catch (err) {
    error.value = err.message || "Có lỗi xảy ra khi tìm kiếm sách";
    console.error("Error searching books:", err);
  } finally {
    loading.value = false;
  }
};

const updateURL = () => {
  const query = {
    ...filters,
    q: keyword.value,
    page: currentPage.value,
  };

  // Loại bỏ các tham số mặc định hoặc rỗng
  Object.keys(query).forEach((key) => {
    if (
      !query[key] ||
      query[key] === "" ||
      (key === "sort" && query[key] === "relevance") ||
      (key === "page" && query[key] === 1) ||
      key === "limit"
    ) {
      delete query[key];
    }
  });

  router.push({
    name: "search-products",
    query,
  });
};

// Xử lý sự kiện
const handleFilterChange = (newFilters) => {
  Object.assign(filters, newFilters);
  currentPage.value = 1;
  updateURL();
};

const handleSortChange = (sort) => {
  filters.sort = sort;
  currentPage.value = 1;
  updateURL();
};

const handleBookTypeChange = (bookType) => {
  filters.bookType = bookType;
  currentPage.value = 1;
  updateURL();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  updateURL();
  // Cuộn lên đầu trang
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Theo dõi thay đổi
watch(
  () => route.query,
  (newQuery) => {
    // Cập nhật keyword và filters khi URL thay đổi
    keyword.value = newQuery.q || "";
    filters.q = keyword.value;
    filters.bookType = newQuery.bookType || "";
    filters.documentType = newQuery.documentType || "";
    filters.category = newQuery.category || "";
    filters.author = newQuery.author || "";
    filters.sort = newQuery.sort || "relevance";
    currentPage.value = parseInt(newQuery.page) || 1;

    fetchBooks();
  },
  { deep: true }
);

// Vòng đời component
onMounted(() => {
  fetchBooks();
});
</script>

<style scoped>
.search-products-page {
  min-height: 100vh;
  padding: 2rem 0;
}

.search-header {
  padding: 0;
}

.search-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
}

.search-title i {
  color: #007bff;
  font-size: 1.1rem;
}

.search-keyword {
  color: #007bff;
  font-weight: 600;
}

@media (max-width: 768px) {
  .search-products-page {
    padding: 1rem 0;
  }

  .search-title {
    font-size: 1.1rem;
  }

  .search-title i {
    font-size: 1rem;
  }
}
</style>
