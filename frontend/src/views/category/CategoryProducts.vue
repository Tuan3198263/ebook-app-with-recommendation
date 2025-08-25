<!-- filepath: d:\LuanVan\frontend\src\views\category\CategoryProducts.vue -->
<template>
  <div class="category-products-page">
    <div class="container">
      <div class="row">
        <!-- Sidebar Filters -->
        <div class="col-lg-3 col-md-4">
          <CategoryFilters
            :current-filters="filters"
            :category-slug="slug"
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
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import bookService from "@/services/bookService";
import CategoryFilters from "@/components/category/CategoryFilters.vue";
import ProductToolbar from "@/components/category/ProductToolbar.vue";
import ProductGrid from "@/components/category/ProductGrid.vue";
import ProductPagination from "@/components/category/ProductPagination.vue";

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

// Trạng thái
const books = ref([]);
const categoryInfo = ref(null);
const totalBooks = ref(0);
const totalPages = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const error = ref(null);

// Bộ lọc
const filters = reactive({
  bookType: route.query.bookType || "",
  documentType: route.query.documentType || "",
  author: route.query.author || "",
  sort: route.query.sort || "relevance",
  page: parseInt(route.query.page) || 1,
  limit: 6,
});

// Phương thức
const fetchBooks = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      ...filters,
      page: currentPage.value,
    };

    // Loại bỏ các tham số rỗng
    Object.keys(params).forEach((key) => {
      if (!params[key] || params[key] === "") {
        delete params[key];
      }
    });

    // gọi hàm lấy danh sách theo slug danh mục
    const response = await bookService.getBooksByCategory(props.slug, params);

    if (response.success) {
      books.value = response.data;
      totalBooks.value = response.count;
      totalPages.value = response.totalPages;
      categoryInfo.value = response.category;
      currentPage.value = response.currentPage;
    }
  } catch (err) {
    error.value = err.message || "Có lỗi xảy ra khi tải danh sách sách";
    console.error("Error fetching books:", err);
  } finally {
    loading.value = false;
  }
};

const updateURL = () => {
  const query = { ...filters, page: currentPage.value };

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
    name: "category-products",
    params: { slug: props.slug },
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
    // Cập nhật filters khi URL thay đổi
    filters.bookType = newQuery.bookType || "";
    filters.documentType = newQuery.documentType || "";
    filters.author = newQuery.author || "";
    filters.sort = newQuery.sort || "relevance";
    currentPage.value = parseInt(newQuery.page) || 1;

    fetchBooks();
  },
  { deep: true }
);

watch(
  () => props.slug,
  () => {
    // Reset filters khi chuyển danh mục
    Object.assign(filters, {
      bookType: "",
      documentType: "",
      author: "",
      sort: "relevance",
    });
    currentPage.value = 1;
    fetchBooks();
  }
);

// Vòng đời component
onMounted(() => {
  fetchBooks();
});
</script>

<style scoped>
.category-products-page {
  min-height: 100vh;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .category-products-page {
    padding: 1rem 0;
  }
}
</style>
