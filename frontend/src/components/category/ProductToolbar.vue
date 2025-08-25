<!-- filepath: d:\LuanVan\frontend\src\components\category\ProductToolbar.vue -->
<template>
  <div class="product-toolbar">
    <div class="container-fluid">
      <div class="row align-items-center">
        <div class="col-12">
          <div class="d-flex align-items-center justify-content-end">
            <!-- Sắp xếp -->
            <div class="sort-group">
              <label class="sort-label">Sắp xếp:</label>
              <select
                class="form-select form-select-sm"
                v-model="localSort"
                @change="emitSortChange"
              >
                <option value="relevance">Liên quan nhất</option>
                <option value="title_asc">Tên A-Z</option>
                <option value="title_desc">Tên Z-A</option>
                <option value="price_asc">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  sort: {
    type: String,
    default: "relevance",
  },
});

const emit = defineEmits(["sort-change"]);

// Local reactive data
const localSort = ref(props.sort);

// Methods
const emitSortChange = () => {
  emit("sort-change", localSort.value);
};

// Watch for prop changes
watch(
  () => props.sort,
  (newSort) => {
    localSort.value = newSort;
  }
);
</script>

<style scoped>
.product-toolbar {
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 0;
  margin-bottom: 1.5rem;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0;
  white-space: nowrap;
}

.form-select-sm {
  font-size: 0.875rem;
  min-width: 140px;
}

@media (max-width: 768px) {
  .sort-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
  }

  .form-select-sm {
    min-width: unset;
  }
}
</style>
