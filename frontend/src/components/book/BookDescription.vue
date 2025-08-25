<!-- filepath: d:\LuanVan\frontend\src\components\book\BookDescription.vue -->
<template>
  <div class="book-description">
    <div class="description-header">
      <h2>Mô tả sách</h2>
    </div>

    <div class="description-content">
      <div
        class="description-text"
        :class="{ expanded: isExpanded }"
        v-html="formattedDescription"
      ></div>

      <button
        v-if="shouldShowToggle"
        @click="toggleExpanded"
        class="toggle-btn"
      >
        {{ isExpanded ? "Thu gọn" : "Xem thêm" }}
        <i
          :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        ></i>
      </button>
    </div>

    <!-- Additional book info -->
    <div v-if="book.category" class="book-meta">
      <div class="meta-item">
        <span class="meta-label">Danh mục:</span>
        <router-link :to="`/category/${book.category.slug}`" class="meta-link">
          {{ book.category.name }}
        </router-link>
      </div>

      <div v-if="book.featured" class="featured-badge">
        <i class="fas fa-star"></i>
        Sách nổi bật
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";

export default {
  name: "BookDescription",
  props: {
    description: {
      type: String,
      default: "",
    },
    book: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const isExpanded = ref(false);
    const maxLength = 500;

    const formattedDescription = computed(() => {
      if (!props.description) return "<p>Chưa có mô tả cho sách này.</p>";

      // Convert line breaks to paragraphs
      let formatted = props.description
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => `<p>${line.trim()}</p>`)
        .join("");

      // If not expanded and text is too long, truncate it
      if (!isExpanded.value && formatted.length > maxLength) {
        const truncated = formatted.substring(0, maxLength);
        const lastPTag = truncated.lastIndexOf("</p>");
        if (lastPTag > 0) {
          formatted = truncated.substring(0, lastPTag + 4) + "...";
        } else {
          formatted = truncated + "...";
        }
      }

      return formatted;
    });

    const shouldShowToggle = computed(() => {
      return props.description && props.description.length > maxLength;
    });

    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value;
    };

    return {
      isExpanded,
      formattedDescription,
      shouldShowToggle,
      toggleExpanded,
    };
  },
};
</script>

<style scoped>
.book-description {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 40px;
}

.description-header h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.description-content {
  position: relative;
}

.description-text {
  color: #555;
  line-height: 1.7;
  font-size: 16px;
}

.description-text:deep(p) {
  margin-bottom: 15px;
}

.description-text:deep(p:last-child) {
  margin-bottom: 0;
}

.toggle-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 15px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.toggle-btn:hover {
  color: #0056b3;
}

.book-meta {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-weight: 600;
  color: #666;
}

.meta-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.meta-link:hover {
  text-decoration: underline;
}

.featured-badge {
  background: linear-gradient(135deg, #ffc107, #ff8c00);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

@media (max-width: 768px) {
  .book-description {
    padding: 20px;
  }

  .description-header h2 {
    font-size: 20px;
  }

  .description-text {
    font-size: 15px;
  }

  .book-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
