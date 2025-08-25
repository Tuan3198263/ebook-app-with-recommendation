<template>
  <div class="reader-toolbar" :class="{ hidden: !isVisible }">
    <div class="toolbar-container">
      <!-- Left section -->
      <div class="toolbar-left">
        <button
          class="toolbar-btn back-btn"
          @click="$emit('back')"
          title="Quay lại"
        >
          <i class="fas fa-arrow-left"></i>
          <span class="btn-text">Quay lại</span>
        </button>

        <div class="book-info">
          <h1 class="book-title">{{ bookTitle }}</h1>
          <span class="chapter-info" v-if="currentChapter">{{
            currentChapter
          }}</span>
        </div>
      </div>

      <!-- Center section -->
      <div class="toolbar-center">
        <!-- Search Section -->
        <div class="search-section" v-if="showSearch">
          <div class="search-input-container">
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="performSearch"
              @input="handleSearchInput"
              placeholder="Tìm kiếm trong trang..."
              class="search-input"
              ref="searchInput"
            />
            <button
              @click="performSearch"
              class="search-btn"
              title="Tìm kiếm"
              :disabled="!searchQuery.trim() || isSearching"
            >
              <i class="fas fa-search" v-if="!isSearching"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
            </button>
            <button
              v-if="searchQuery.trim()"
              @click="clearSearch"
              class="clear-search-btn"
              title="Xóa tìm kiếm"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Progress Section (when not searching) -->
        <div class="progress-section" v-else>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: readingProgress + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Right section -->
      <div class="toolbar-right">
        <!-- Action buttons -->
        <button
          class="toolbar-btn"
          @click="toggleSearch"
          title="Tìm kiếm"
          :class="{ active: showSearch }"
        >
          <i class="fas fa-search"></i>
        </button>

        <button
          class="toolbar-btn"
          @click="$emit('toggle-toc')"
          title="Mục lục"
        >
          <i class="fas fa-list"></i>
        </button>

        <button
          class="toolbar-btn"
          @click="$emit('toggle-bookmarks')"
          title="Bookmark"
        >
          <i class="fas fa-bookmark"></i>
        </button>

        <button
          class="toolbar-btn"
          @click="$emit('toggle-settings')"
          title="Cài đặt"
        >
          <i class="fas fa-cog"></i>
        </button>

        <button
          class="toolbar-btn"
          @click="$emit('download-pdf')"
          title="Tải xuống PDF"
        >
          <i class="fas fa-download"></i>
        </button>

        <button
          class="toolbar-btn"
          @click="$emit('toggle-fullscreen')"
          title="Toàn màn hình"
        >
          <i class="fas fa-expand"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: true,
  },
  bookTitle: {
    type: String,
    required: true,
  },
  currentChapter: {
    type: String,
    default: "",
  },
  readingProgress: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "back",
  "toggle-toc",
  "toggle-bookmarks",
  "toggle-settings",
  "download-pdf",
  "toggle-fullscreen",
  "search",
  "clear-search",
]);

// Search functionality
const showSearch = ref(false);
const searchQuery = ref("");
const isSearching = ref(false);
const searchInput = ref(null);

// Search methods
const toggleSearch = () => {
  showSearch.value = !showSearch.value;

  if (showSearch.value) {
    // Focus vào input khi mở search
    nextTick(() => {
      searchInput.value?.focus();
    });
  } else {
    // Clear search khi đóng
    clearSearch();
  }
};

const handleSearchInput = () => {
  // Debounce search - tìm kiếm sau 500ms không gõ
  clearTimeout(handleSearchInput.timeoutId);
  handleSearchInput.timeoutId = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      performSearch();
    }
  }, 500);
};

const performSearch = async () => {
  if (!searchQuery.value.trim() || isSearching.value) return;

  isSearching.value = true;
  try {
    // Emit search event to parent
    emit("search", searchQuery.value.trim());
  } finally {
    isSearching.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = "";
  isSearching.value = false;

  emit("clear-search");
};
</script>

<style scoped src="./ReaderToolbar.css"></style>
