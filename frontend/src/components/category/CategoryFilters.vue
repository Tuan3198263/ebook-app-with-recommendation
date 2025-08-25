<!-- filepath: d:\LuanVan\frontend\src\components\category\CategoryFilters.vue 
bộ lọc sidebar 
-->
<template>
  <div class="category-filters">
    <!-- Header filters với nút toggle cho mobile -->
    <div class="filters-header">
      <h6 class="filters-title">Bộ lọc</h6>
      <button
        class="btn btn-outline-secondary btn-sm d-md-none"
        @click="toggleFilters"
        type="button"
      >
        <i
          class="fas"
          :class="showFilters ? 'fa-chevron-up' : 'fa-chevron-down'"
        ></i>
        {{ showFilters ? "Ẩn" : "Hiện" }}
      </button>
    </div>

    <!-- Content filters với animation collapse -->
    <div class="filters-content" :class="{ show: showFilters }">
      <div class="filters-header">
        <button
          v-if="hasActiveFilters"
          class="btn btn-link btn-sm p-0 text-decoration-none text-danger"
          @click="clearAllFilters"
        >
          Đặt lại
        </button>
      </div>

      <!-- Document Type Filter -->
      <div class="filter-section">
        <h6 class="filter-title">Loại tài liệu</h6>
        <div class="filter-options">
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="documentType"
              id="doc-all"
              :value="''"
              v-model="localFilters.documentType"
              @change="emitFilterChange"
            />
            <label class="form-check-label" for="doc-all"> Tất cả </label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="documentType"
              id="doc-textbook"
              value="textbook"
              v-model="localFilters.documentType"
              @change="emitFilterChange"
            />
            <label class="form-check-label" for="doc-textbook">
              Giáo trình
            </label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="documentType"
              id="doc-other"
              value="other"
              v-model="localFilters.documentType"
              @change="emitFilterChange"
            />
            <label class="form-check-label" for="doc-other"> Khác </label>
          </div>
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="filter-section">
        <h6 class="filter-title">Danh mục</h6>
        <div class="filter-options" v-if="!categoriesLoading">
          <router-link
            v-for="category in categories"
            :key="category._id"
            :to="{ name: 'category-products', params: { slug: category.slug } }"
            class="category-link"
            :class="{ active: category.slug === categorySlug }"
          >
            {{ category.name }}
          </router-link>
        </div>
        <div v-else class="text-center py-2">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>

      <!-- Authors Filter -->
      <div class="filter-section">
        <h6 class="filter-title">Tác giả</h6>
        <div class="filter-options" v-if="!authorsLoading">
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="author"
              id="author-all"
              :value="''"
              v-model="localFilters.author"
              @change="emitFilterChange"
            />
            <label class="form-check-label" for="author-all">
              Tất cả tác giả
            </label>
          </div>
          <div v-for="author in authors" :key="author._id" class="form-check">
            <input
              class="form-check-input"
              type="radio"
              name="author"
              :id="`author-${author._id}`"
              :value="author.slug"
              v-model="localFilters.author"
              @change="emitFilterChange"
            />
            <label class="form-check-label" :for="`author-${author._id}`">
              {{ author.name }}
            </label>
          </div>
        </div>
        <div v-else class="text-center py-2">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import categoryService from "@/services/categoryService";
import authorService from "@/services/authorService";

const props = defineProps({
  currentFilters: {
    type: Object,
    required: true,
  },
  categorySlug: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["filter-change"]);

// Trạng thái
const categories = ref([]);
const authors = ref([]);
const categoriesLoading = ref(false);
const authorsLoading = ref(false);

// Bộ lọc cục bộ
const localFilters = reactive({
  documentType: props.currentFilters.documentType || "",
  author: props.currentFilters.author || "",
});

// Computed
const hasActiveFilters = computed(() => {
  return localFilters.documentType || localFilters.author;
});

// Phương thức
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

const fetchAuthors = async () => {
  authorsLoading.value = true;
  try {
    const response = await authorService.getAuthorsByCategory(
      props.categorySlug
    );
    if (response.success) {
      authors.value = response.data;
    }
  } catch (error) {
    console.error("Lỗi khi lấy tác giả:", error);
  } finally {
    authorsLoading.value = false;
  }
};

const emitFilterChange = () => {
  emit("filter-change", { ...localFilters });
};

const clearAllFilters = () => {
  localFilters.documentType = "";
  localFilters.author = "";
  emitFilterChange();
};

// Theo dõi thay đổi
watch(
  () => props.currentFilters,
  (newFilters) => {
    localFilters.documentType = newFilters.documentType || "";
    localFilters.author = newFilters.author || "";
  },
  { deep: true }
);

watch(
  () => props.categorySlug,
  () => {
    localFilters.author = ""; // Reset bộ lọc tác giả khi chuyển danh mục
    fetchAuthors();
  }
);

// Vòng đời component
onMounted(() => {
  fetchCategories();
  fetchAuthors();
});

// Local reactive data
const showFilters = ref(false); // Mặc định ẩn trên mobile

// Methods
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};
</script>

<style scoped>
.category-filters {
  background: white;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 2rem;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-title {
  font-weight: 600;
  margin-bottom: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.filters-content {
  transition: all 0.3s ease;
}

.filters-header h5 {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.filter-options {
  max-height: 300px;
  overflow-y: auto;
}

.form-check {
  margin-bottom: 0.75rem;
}

.form-check:last-child {
  margin-bottom: 0;
}

.form-check-label {
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.form-check-input:checked + .form-check-label {
  color: #007bff;
  font-weight: 500;
}

.category-link {
  display: block;
  padding: 0.5rem 0;
  color: #555;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.category-link:hover {
  color: #007bff;
}

.category-link.active {
  color: #007bff;
  font-weight: 600;
}

/* Mobile responsive */
@media (max-width: 767.98px) {
  .filters-content {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    margin-bottom: 0;
  }

  .filters-content.show {
    max-height: 800px;
    opacity: 1;
    margin-bottom: 1rem;
  }

  .filters-header {
    margin-bottom: 0;
  }

  .filters-header.show {
    margin-bottom: 1rem;
  }

  .category-filters {
    padding: 0.75rem;
  }

  .row {
    margin: 0;
  }

  .row > [class*="col-"] {
    padding-left: 0;
    padding-right: 0;
  }
}

/* Desktop - luôn hiển thị */
@media (min-width: 768px) {
  .filters-content {
    opacity: 1 !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .filters-header .btn {
    display: none !important;
  }
}

/* Animation cho button toggle */
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

/* Icon animation */
.fas {
  transition: transform 0.3s ease;
}
</style>
