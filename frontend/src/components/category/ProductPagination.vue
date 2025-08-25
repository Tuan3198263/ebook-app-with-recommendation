<!-- filepath: d:\LuanVan\frontend\src\components\category\ProductPagination.vue -->
<template>
  <div class="product-pagination">
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <!-- Pagination Navigation -->
      <nav aria-label="Phân trang sách" class="pagination-nav">
        <ul class="pagination">
          <!-- First Page Button -->
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link page-link-icon"
              @click="changePage(1)"
              :disabled="currentPage === 1"
              aria-label="Trang đầu"
              title="Trang đầu"
            >
              <i class="fas fa-angle-double-left"></i>
            </button>
          </li>

          <!-- Previous Page Button -->
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link page-link-icon"
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              aria-label="Trang trước"
              title="Trang trước"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
          </li>

          <!-- Page Numbers -->
          <li
            v-for="page in visiblePages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <button
              class="page-link page-number"
              @click="changePage(page)"
              :aria-label="`Trang ${page}`"
              :aria-current="page === currentPage ? 'page' : undefined"
            >
              {{ page }}
            </button>
          </li>

          <!-- Next Page Button -->
          <li
            class="page-item"
            :class="{ disabled: currentPage === totalPages }"
          >
            <button
              class="page-link page-link-icon"
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              aria-label="Trang sau"
              title="Trang sau"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </li>

          <!-- Last Page Button -->
          <li
            class="page-item"
            :class="{ disabled: currentPage === totalPages }"
          >
            <button
              class="page-link page-link-icon"
              @click="changePage(totalPages)"
              :disabled="currentPage === totalPages"
              aria-label="Trang cuối"
              title="Trang cuối"
            >
              <i class="fas fa-angle-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Page Info -->
      <div class="pagination-info">
        <span class="page-info-text">
          Trang <strong>{{ currentPage }}</strong> trong tổng số
          <strong>{{ totalPages }}</strong> trang
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["page-change"]);

// Computed
const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;

  if (props.totalPages <= maxVisible) {
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > props.totalPages) {
      end = props.totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

// Methods
const changePage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit("page-change", page);
  }
};
</script>

<style scoped>
.product-pagination {
  margin: 3rem 0 2rem;
}

.pagination-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pagination-nav {
  display: flex;
  justify-content: center;
}

.pagination {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.page-item {
  display: flex;
}

.page-link {
  border: none;
  background: transparent;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 0.875rem;
  position: relative;
  overflow: hidden;
}

.page-link:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #374151;
  transform: translateY(-1px);
}

.page-link:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.page-link:disabled {
  color: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
}

.page-link-icon {
  width: 40px;
  font-size: 0.75rem;
}

.page-number {
  font-weight: 600;
  position: relative;
}

.page-item.active .page-link {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.page-item.active .page-link:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-2px);
}

.page-item.disabled .page-link {
  color: #d1d5db;
  background: transparent;
  cursor: not-allowed;
  opacity: 0.4;
}

.page-item.disabled .page-link:hover {
  background: transparent;
  transform: none;
}

.pagination-info {
  text-align: center;
  margin-top: 0.5rem;
}

.page-info-text {
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
}

.page-info-text strong {
  color: #374151;
  font-weight: 600;
}

/* Animation cho active page */
.page-item.active .page-link::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.2)
  );
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.page-item.active .page-link:hover::before {
  opacity: 1;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .product-pagination {
    margin: 2rem 0 1rem;
  }

  .pagination {
    padding: 0.375rem;
    gap: 0.125rem;
    border-radius: 10px;
  }

  .page-link {
    min-width: 36px;
    height: 36px;
    font-size: 0.8125rem;
    border-radius: 6px;
  }

  .page-link-icon {
    width: 36px;
    font-size: 0.6875rem;
  }

  .page-info-text {
    font-size: 0.8125rem;
    padding: 0.375rem 0.75rem;
  }

  .pagination-wrapper {
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .pagination {
    padding: 0.25rem;
    gap: 0.0625rem;
  }

  .page-link {
    min-width: 32px;
    height: 32px;
    font-size: 0.75rem;
    border-radius: 4px;
  }

  .page-link-icon {
    width: 32px;
    font-size: 0.625rem;
  }

  .page-info-text {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}

/* Loading animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pagination.loading .page-link {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Hover effects for better UX */
.page-link::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.1) 0%,
    transparent 70%
  );
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  pointer-events: none;
}

.page-link:hover::after:not(.page-item.active .page-link::after) {
  width: 40px;
  height: 40px;
}

/* Focus states for accessibility */
.page-link:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  .pagination {
    background: #1f2937;
    border-color: #374151;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .page-link {
    color: #d1d5db;
  }

  .page-link:hover:not(:disabled) {
    background-color: #374151;
    color: #f9fafb;
  }

  .page-info-text {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }

  .page-info-text strong {
    color: #f9fafb;
  }

  .page-item.disabled .page-link {
    color: #6b7280;
  }
}
</style>
