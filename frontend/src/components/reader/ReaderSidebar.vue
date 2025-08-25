<template>
  <div class="reader-sidebar" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-overlay" @click="$emit('close')" v-if="isOpen"></div>

    <div class="sidebar-content">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="sidebar-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="sidebar-body">
        <!-- Table of Contents -->
        <div v-if="activeTab === 'toc'" class="tab-content">
          <div class="toc-container">
            <div class="search-box">
              <div class="search-input-container">
                <i class="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm trong mục lục..."
                  v-model="tocSearch"
                  class="search-input"
                />
                <button
                  v-if="tocSearch"
                  @click="tocSearch = ''"
                  class="clear-search-btn"
                  type="button"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div class="toc-list">
              <!-- Show "no results" message when search returns empty -->
              <div
                v-if="tocSearch && filteredToc.length === 0"
                class="empty-state"
              >
                <i class="fas fa-search"></i>
                <p>Không tìm thấy kết quả</p>
                <p class="empty-subtitle">Thử tìm kiếm với từ khóa khác</p>
              </div>

              <!-- Show TOC items -->
              <div
                v-for="item in filteredToc"
                :key="item.id"
                class="toc-item"
                :class="{
                  active: item.id === currentChapterId,
                  'level-1': item.level === 1,
                  'level-2': item.level === 2,
                  'level-3': item.level === 3,
                }"
                @click="$emit('chapter-select', item)"
              >
                <span class="toc-title">{{ item.label }}</span>
                <span class="toc-page" v-if="item.page">{{ item.page }}</span>

                <!-- Render subitems if they exist -->
                <div
                  v-if="item.subitems && item.subitems.length > 0"
                  class="toc-subitems"
                >
                  <div
                    v-for="subitem in item.subitems"
                    :key="subitem.id"
                    class="toc-item toc-subitem"
                    :class="{
                      active: subitem.id === currentChapterId,
                      'level-2': subitem.level === 2,
                      'level-3': subitem.level === 3,
                    }"
                    @click.stop="$emit('chapter-select', subitem)"
                  >
                    <span class="toc-title">{{ subitem.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bookmarks -->
        <div v-if="activeTab === 'bookmarks'" class="tab-content">
          <div class="bookmarks-container">
            <div class="bookmarks-header">
              <h3>Dấu trang ({{ bookmarks.length }})</h3>
              <button
                v-if="bookmarks.length > 0"
                @click="handleDeleteAllBookmarks"
                class="delete-all-btn"
                title="Xóa tất cả dấu trang"
              >
                <i class="fas fa-trash-alt"></i>
                Xóa tất cả
              </button>
            </div>

            <div class="bookmarks-list">
              <div
                v-for="bookmark in bookmarks"
                :key="bookmark.id"
                class="bookmark-item"
                @click="$emit('bookmark-select', bookmark)"
              >
                <div class="bookmark-content">
                  <div class="bookmark-icon">
                    <i class="fas fa-bookmark"></i>
                  </div>
                  <div class="bookmark-info">
                    <h4 class="bookmark-title">
                      {{ bookmark.title || "Dấu trang không có tiêu đề" }}
                    </h4>
                    <div class="bookmark-meta">
                      <span class="bookmark-date">{{
                        bookmark.displayDate || formatDate(bookmark.createdAt)
                      }}</span>
                    </div>
                  </div>
                </div>
                <div class="bookmark-actions">
                  <button
                    class="edit-bookmark-btn"
                    @click.stop="editBookmark(bookmark)"
                    title="Chỉnh sửa"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="delete-bookmark-btn"
                    @click.stop="deleteBookmark(bookmark)"
                    title="Xóa"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div v-if="bookmarks.length === 0" class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>Chưa có dấu trang nào</p>
                <p class="empty-subtitle">
                  Nhấn vào nút dấu trang trên toolbar để đánh dấu trang hiện tại
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="notes-container">
            <div class="notes-header">
              <h3>Ghi chú ({{ notes.length }})</h3>
            </div>

            <div class="notes-list">
              <div
                v-for="note in notes"
                :key="note.id"
                class="note-item"
                @click="$emit('note-select', note)"
              >
                <div class="note-content">
                  <div class="note-icon">
                    <i
                      class="fas fa-sticky-note"
                      v-if="note.content !== 'Highlight'"
                    ></i>
                    <i class="fas fa-highlighter" v-else></i>
                  </div>
                  <div class="note-info">
                    <h4 class="note-title">
                      {{
                        note.content === "Highlight" ? "Highlight" : "Ghi chú"
                      }}
                    </h4>
                    <div
                      class="note-preview"
                      v-if="note.content !== 'Highlight'"
                    >
                      {{ note.contentPreview }}
                    </div>
                    <div class="note-highlight" v-if="note.selectedText">
                      <em
                        >"{{ note.selectedText.substring(0, 80)
                        }}{{ note.selectedText.length > 80 ? "..." : "" }}"</em
                      >
                    </div>
                    <div class="note-meta">
                      <span class="note-date">{{
                        formatDate(note.createdAt)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="notes.length === 0" class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <p>Chưa có ghi chú nào</p>
                <p class="empty-subtitle">
                  Bôi đen text trong sách để tạo highlight và ghi chú
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  tableOfContents: {
    type: Array,
    default: () => [],
  },
  bookmarks: {
    type: Array,
    default: () => [],
  },
  notes: {
    type: Array,
    default: () => [],
  },
  currentChapterId: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "close",
  "chapter-select",
  "bookmark-select",
  "bookmark-edit",
  "bookmark-delete",
  "bookmark-delete-all",
  "note-select",
  "note-edit",
  "note-delete",
  "note-delete-all",
]);

const activeTab = ref("toc");
const tocSearch = ref("");

const tabs = [
  { key: "toc", label: "Mục lục", icon: "fas fa-list" },
  { key: "bookmarks", label: "Dấu trang", icon: "fas fa-bookmark" },
  { key: "notes", label: "Ghi chú", icon: "fas fa-sticky-note" },
];

const filteredToc = computed(() => {
  if (!tocSearch.value) return props.tableOfContents;

  const searchTerm = tocSearch.value.toLowerCase();

  const filterItems = (items) => {
    return items
      .filter((item) => {
        const matchesLabel = item.label.toLowerCase().includes(searchTerm);
        const hasMatchingSubitems =
          item.subitems &&
          item.subitems.some((subitem) =>
            subitem.label.toLowerCase().includes(searchTerm)
          );
        return matchesLabel || hasMatchingSubitems;
      })
      .map((item) => ({
        ...item,
        subitems: item.subitems ? filterItems(item.subitems) : [],
      }));
  };

  return filterItems(props.tableOfContents);
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Bookmark management functions
const editBookmark = async (bookmark) => {
  try {
    const { value: newTitle } = await Swal.fire({
      title: "Chỉnh sửa dấu trang",
      input: "text",
      inputLabel: "Tiêu đề dấu trang",
      inputValue: bookmark.title,
      inputPlaceholder: "Nhập tiêu đề cho dấu trang...",
      inputAttributes: {
        maxlength: 100,
        autocomplete: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Cập nhật",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Vui lòng nhập tiêu đề cho dấu trang";
        }
        if (value.trim().length > 100) {
          return "Tiêu đề không được vượt quá 100 ký tự";
        }
      },
    });

    if (newTitle && newTitle.trim() !== bookmark.title) {
      emit("bookmark-edit", bookmark.id, { title: newTitle.trim() });
    }
  } catch (error) {
    console.error("Error editing bookmark:", error);
  }
};

const deleteBookmark = (bookmark) => {
  emit("bookmark-delete", bookmark.id);
};

const handleDeleteAllBookmarks = () => {
  emit("bookmark-delete-all");
};
</script>

<style scoped src="./ReaderSidebar.css"></style>
