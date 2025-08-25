<template>
  <div
    class="book-reader"
    :class="{
      'reader-dark': settings.theme === 'dark',
      'reader-sepia': settings.theme === 'sepia',
    }"
  >
    <!-- Reader Toolbar -->
    <ReaderToolbar
      :book-title="bookData?.title || 'Đang tải...'"
      :current-chapter="currentChapter"
      :reading-progress="readingProgress"
      :is-visible="true"
      @back="handleBack"
      @toggle-toc="sidebarOpen = !sidebarOpen"
      @toggle-bookmarks="handleBookmark"
      @toggle-settings="settingsOpen = !settingsOpen"
      @download-pdf="handleDownloadPdf"
      @toggle-fullscreen="handleToggleFullscreen"
      @search="handleSearch"
      @clear-search="handleClearSearch"
      ref="readerToolbar"
    />

    <!-- Reader Sidebar -->
    <ReaderSidebar
      v-if="bookData"
      :is-open="sidebarOpen"
      :table-of-contents="tableOfContents"
      :bookmarks="userBookmarks"
      :notes="userNotes"
      :current-chapter-id="currentChapterId"
      @close="sidebarOpen = false"
      @chapter-select="handleChapterSelect"
      @bookmark-select="handleBookmarkSelect"
      @bookmark-edit="updateBookmark"
      @bookmark-delete="deleteBookmark"
      @bookmark-delete-all="deleteAllBookmarks"
      @note-select="handleNoteSelect"
    />

    <!-- Main Reader Content -->
    <ReaderContent
      v-if="bookData"
      :book-data="bookData"
      :file-url="currentFileUrl"
      :is-loading="contentLoading"
      :error="contentError"
      :font-size="settings.fontSize"
      :font-family="settings.fontFamily"
      :theme="settings.theme"
      :notes="userNotes"
      @progress-change="handleProgressChange"
      @retry="loadContent"
      @toc-extracted="handleTocExtracted"
      @text-selected="handleTextSelected"
      @note-clicked="handleNoteClick"
      ref="readerContent"
    />

    <!-- Navigation Buttons -->
    <div v-if="bookData && !contentLoading" class="page-navigation">
      <!-- Previous Page Button -->
      <button
        @click="previousPage"
        class="nav-btn nav-prev"
        title="Trang trước"
      >
        <i class="fas fa-chevron-left"></i>
      </button>

      <!-- Next Page Button -->
      <button @click="nextPage" class="nav-btn nav-next" title="Trang sau">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Reader Settings -->
    <ReaderSettings
      :is-open="settingsOpen"
      @close="settingsOpen = false"
      @settings-change="handleSettingsChange"
    />

    <!-- Loading Screen -->
    <div v-if="initialLoading" class="reader-loading">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="fas fa-book-open fa-spin"></i>
        </div>
        <h2>Đang chuẩn bị sách...</h2>
        <p>Vui lòng đợi trong giây lát</p>
        <div class="loading-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: loadingProgress + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(loadingProgress) }}%</span>
        </div>
      </div>
    </div>

    <!-- Error Screen -->
    <div v-if="readerError && !initialLoading" class="reader-error">
      <div class="error-content">
        <i class="fas fa-exclamation-circle"></i>
        <h2>Không thể mở sách</h2>
        <p class="error-message">{{ readerError }}</p>
        <div class="error-actions">
          <button @click="retryLoad" class="retry-btn">
            <i class="fas fa-redo"></i>
            Thử lại
          </button>
          <button @click="handleBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            Quay lại
          </button>
          <!-- Hiển thị nút tải PDF nếu có -->
          <button
            v-if="bookData?.availableFormats?.includes('pdf')"
            @click="handleDownloadPdf"
            class="download-btn"
          >
            <i class="fas fa-download"></i>
            Tải PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ref,
  reactive,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";

// Import components
import ReaderToolbar from "../../components/reader/ReaderToolbar.vue";
import ReaderSidebar from "../../components/reader/ReaderSidebar.vue";
import ReaderContent from "../../components/reader/ReaderContent.vue";
import ReaderSettings from "../../components/reader/ReaderSettings.vue";

// Import services
import readerService from "../../services/readerService.js";
import licenseService from "../../services/licenseService.js";
import bookService from "../../services/bookService.js";
import bookmarkService from "../../services/bookmarkService.js";
import noteService from "../../services/noteService.js";

export default {
  name: "BookReader",
  components: {
    ReaderToolbar,
    ReaderSidebar,
    ReaderContent,
    ReaderSettings,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    // Reactive data
    const bookData = ref(null);
    const licenseData = ref(null);
    const initialLoading = ref(true);
    const contentLoading = ref(false);
    const loadingProgress = ref(0);
    const readerError = ref(null);
    const contentError = ref(null);

    // UI state
    const sidebarOpen = ref(false);
    const settingsOpen = ref(false);

    // Reading state
    const currentFileUrl = ref(null);
    const pdfDownloadUrl = ref(null);
    const readingProgress = ref(0);
    const currentLocation = ref(null);
    const currentChapter = ref(null);
    const currentChapterId = ref(null);
    const currentPage = ref(1);
    const totalPages = ref(1);

    // Settings
    const settings = reactive({
      theme: "light",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      lineHeight: 1.6,
      textAlign: "justify",
      pageWidth: 80,
      autoNightMode: false,
      smoothScrolling: true,
    });

    // Content data
    const tableOfContents = ref([]);
    const userBookmarks = ref([]);
    const userNotes = ref([]);

    // Component refs
    const readerContent = ref(null);
    const searchInput = ref(null);
    const readerToolbar = ref(null);

    // Methods
    const loadBookData = async () => {
      try {
        await setLoadingProgress(20);
        console.log("📚 Loading book data for slug:", route.params.slug);

        // First get book by slug
        const bookResponse = await bookService.getBookDetail(route.params.slug);
        console.log("📚 Book response:", bookResponse);

        if (!bookResponse.success) {
          throw new Error("Không tìm thấy sách");
        }

        const book = bookResponse.data;
        console.log("📚 Book data:", book);
        await setLoadingProgress(40);

        // Check license access
        console.log("🔐 Checking license access for book:", book._id);
        const accessResponse = await licenseService.checkEbookAccess(book._id);
        console.log("🔐 Access response:", accessResponse);

        // Kiểm tra quyền truy cập
        if (!accessResponse.success) {
          const errorMessage =
            accessResponse.message || "Bạn không có quyền đọc sách này";
          throw new Error(errorMessage);
        }

        if (!accessResponse.hasAccess) {
          const errorMessage =
            accessResponse.message || "Bạn không có quyền đọc sách này";
          throw new Error(errorMessage);
        }

        await setLoadingProgress(60);

        // Get reader data
        console.log("📖 Getting reader data for book:", book._id);
        const readerResponse = await readerService.getReaderData(book._id);
        console.log("📖 Reader response:", readerResponse);

        if (!readerResponse.success) {
          throw new Error("Không thể tải dữ liệu đọc sách");
        }

        // Use nextTick for reactive assignments to avoid update conflicts
        await nextTick();
        bookData.value = readerResponse.data.book;

        await nextTick();
        licenseData.value = readerResponse.data.license;

        console.log("📖 Final book data:", bookData.value);
        console.log("📖 Final license data:", licenseData.value);

        await nextTick();
        await setLoadingProgress(80);

        // Load content and bookmarks with proper timing
        await loadContent();

        // Add delay before loading bookmarks to avoid conflicts
        setTimeout(async () => {
          try {
            await loadBookmarks();
            await loadNotes();
          } catch (error) {
            console.error("❌ Bookmark/Notes loading error:", error);
          }
        }, 500);

        await nextTick();
        await setLoadingProgress(100);

        setTimeout(async () => {
          await nextTick();
          initialLoading.value = false;
        }, 500);
      } catch (error) {
        console.error("Error loading book data:", error);
        readerError.value = error.message;
        initialLoading.value = false;
      }
    };

    const loadContent = async () => {
      // Sử dụng id hoặc _id tùy thuộc vào backend trả về
      const bookId = bookData.value?.id || bookData.value?._id;

      if (!bookId) {
        console.log("⚠️ Missing book ID for loadContent:", bookId);
        return;
      }

      try {
        console.log("📥 Loading content in BookReader...");
        console.log("📚 Book ID:", bookId);

        contentLoading.value = true;
        contentError.value = null;

        // Kiểm tra xem sách có hỗ trợ định dạng EPUB không
        const availableFormats = bookData.value?.availableFormats || [];
        console.log("📋 Available formats:", availableFormats);

        if (!availableFormats.includes("epub")) {
          // Sách không có file EPUB - không thể đọc online
          throw new Error(
            "Sách này chưa hỗ trợ đọc trực tuyến. Vui lòng tải sách về để đọc offline."
          );
        }

        // Only use EPUB proxy URL for reading
        const proxyUrl = readerService.getEbookProxyUrl(bookId, "epub");
        console.log("🔗 Using EPUB proxy URL:", proxyUrl);
        currentFileUrl.value = proxyUrl;

        // Get PDF download URL for download button
        try {
          const pdfResponse = await readerService.getPdfDownloadUrl(bookId);
          if (pdfResponse.success) {
            pdfDownloadUrl.value = pdfResponse.data.downloadUrl;
            console.log("📄 PDF download URL available:", pdfDownloadUrl.value);
          }
        } catch (pdfError) {
          console.warn("⚠️ PDF download URL not available:", pdfError.message);
          // Nếu không có PDF, set pdfDownloadUrl = null để disable download button
          pdfDownloadUrl.value = null;
        }

        console.log("✅ File URL set:", currentFileUrl.value);
      } catch (error) {
        console.error("❌ Error loading content:", error);
        contentError.value = error.message || "Lỗi không xác định";
      } finally {
        contentLoading.value = false;
      }
    };

    const setLoadingProgress = async (progress) => {
      try {
        // Use nextTick to avoid component update conflicts
        await nextTick();
        loadingProgress.value = Math.min(Math.max(progress, 0), 100);
      } catch (error) {
        console.error("❌ Loading progress error:", error);
      }
    };

    // Bookmark functions
    const loadBookmarks = async () => {
      try {
        const bookId = bookData.value?.id || bookData.value?._id;
        if (!bookId) return;

        console.log("📖 Loading bookmarks for book:", bookId);
        const response = await bookmarkService.getBookmarks(bookId);

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          userBookmarks.value = response.data.map((bookmark) =>
            bookmarkService.formatBookmark(bookmark)
          );
          console.log("📖 Bookmarks loaded:", userBookmarks.value);
        }
      } catch (error) {
        console.error("❌ Error loading bookmarks:", error);
        // Don't show error toast for bookmarks as it's not critical
      }
    };

    const createBookmark = async (bookmarkData) => {
      try {
        const bookId = bookData.value?.id || bookData.value?._id;
        if (!bookId) {
          throw new Error("Không tìm thấy thông tin sách");
        }

        // Validate bookmark data
        const validation = bookmarkService.validateBookmarkData(bookmarkData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "));
        }

        console.log("📝 Creating bookmark:", bookmarkData);
        const response = await bookmarkService.createBookmark(
          bookId,
          bookmarkData
        );

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          const newBookmark = bookmarkService.formatBookmark(response.data);
          userBookmarks.value.unshift(newBookmark);
          toast.success("Đã tạo dấu trang thành công");
          return newBookmark;
        }
      } catch (error) {
        console.error("❌ Error creating bookmark:", error);
        toast.error(`Không thể tạo dấu trang: ${error.message}`);
        throw error;
      }
    };

    const updateBookmark = async (bookmarkId, updateData) => {
      try {
        console.log("✏️ Updating bookmark:", { bookmarkId, updateData });
        const response = await bookmarkService.updateBookmark(
          bookmarkId,
          updateData
        );

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          const updatedBookmark = bookmarkService.formatBookmark(response.data);
          const index = userBookmarks.value.findIndex(
            (b) => b.id === bookmarkId
          );
          if (index !== -1) {
            userBookmarks.value[index] = updatedBookmark;
          }
          toast.success("Đã cập nhật dấu trang");
          return updatedBookmark;
        }
      } catch (error) {
        console.error("❌ Error updating bookmark:", error);
        toast.error(`Không thể cập nhật dấu trang: ${error.message}`);
        throw error;
      }
    };

    const deleteBookmark = async (bookmarkId) => {
      try {
        // Hiển thị SweetAlert2 confirmation
        const result = await Swal.fire({
          title: "Xóa dấu trang?",
          text: "Bạn có chắc chắn muốn xóa dấu trang này không?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Xóa",
          cancelButtonText: "Hủy",
          reverseButtons: false, // Nút xóa ở bên trái
          focusCancel: true, // Focus vào nút hủy để an toàn
        });

        if (!result.isConfirmed) {
          return false;
        }

        console.log("🗑️ Deleting bookmark:", bookmarkId);
        const response = await bookmarkService.deleteBookmark(bookmarkId);

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          userBookmarks.value = userBookmarks.value.filter(
            (b) => b.id !== bookmarkId
          );
          toast.success("Đã xóa dấu trang");
          return true;
        }
      } catch (error) {
        console.error("❌ Error deleting bookmark:", error);
        toast.error(`Không thể xóa dấu trang: ${error.message}`);
        throw error;
      }
    };

    const deleteAllBookmarks = async () => {
      try {
        const bookId = bookData.value?.id || bookData.value?._id;
        if (!bookId) {
          throw new Error("Không tìm thấy thông tin sách");
        }

        // Kiểm tra xem có bookmark nào không
        if (!userBookmarks.value || userBookmarks.value.length === 0) {
          toast.info("Không có dấu trang nào để xóa");
          return false;
        }

        // Hiển thị SweetAlert2 confirmation
        const result = await Swal.fire({
          title: "Xóa tất cả dấu trang?",
          text: `Bạn có chắc chắn muốn xóa tất cả ${userBookmarks.value.length} dấu trang trong cuốn sách này không?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Xóa tất cả",
          cancelButtonText: "Hủy",
          reverseButtons: false, // Nút xóa ở bên trái
          focusCancel: true, // Focus vào nút hủy để an toàn
        });

        if (!result.isConfirmed) {
          return false;
        }

        console.log("🗑️ Deleting all bookmarks for book:", bookId);
        const response = await bookmarkService.deleteAllBookmarks(bookId);

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          userBookmarks.value = [];
          toast.success(`Đã xóa ${response.data.deletedCount} dấu trang`);
          return true;
        }
      } catch (error) {
        console.error("❌ Error deleting all bookmarks:", error);
        toast.error(`Không thể xóa dấu trang: ${error.message}`);
        throw error;
      }
    };

    // Note functions
    const loadNotes = async () => {
      try {
        const bookId = bookData.value?.id || bookData.value?._id;
        if (!bookId) return;

        console.log("📝 Loading notes for book:", bookId);
        const response = await noteService.getNotes(bookId);

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          userNotes.value = response.data.map((note) =>
            noteService.formatNote(note)
          );
          console.log("📝 Notes loaded:", userNotes.value);
        }
      } catch (error) {
        console.error("❌ Error loading notes:", error);
        // Don't show error toast for notes as it's not critical
      }
    };

    const createNote = async (noteData) => {
      try {
        const bookId = bookData.value?.id || bookData.value?._id;
        if (!bookId) {
          throw new Error("Không tìm thấy thông tin sách");
        }

        // Validate note data
        const validation = noteService.validateNoteData(noteData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "));
        }

        console.log("📝 Creating note:", noteData);
        const response = await noteService.createNote(bookId, noteData);

        if (response.success) {
          // Use nextTick to avoid update conflicts
          await nextTick();
          const newNote = noteService.formatNote(response.data);
          userNotes.value.unshift(newNote);

          // Bỏ toast notification - không hiển thị thông báo nữa
          return newNote;
        }
      } catch (error) {
        console.error("❌ Error creating note:", error);
        toast.error(`Không thể tạo ghi chú: ${error.message}`);
        throw error;
      }
    };

    const updateNote = async (noteId, updateData) => {
      try {
        const response = await noteService.updateNote(noteId, updateData);

        if (response.success) {
          const updatedNote = noteService.formatNote(response.data);
          const index = userNotes.value.findIndex((n) => n.id === noteId);
          if (index !== -1) {
            userNotes.value[index] = updatedNote;
          }

          // Refresh highlights
          if (readerContent.value && readerContent.value.refreshHighlights) {
            await readerContent.value.refreshHighlights();
          }

          toast.success("Ghi chú đã được cập nhật");
          return updatedNote;
        }
      } catch (error) {
        console.error("❌ Error updating note:", error);
        toast.error(`Không thể cập nhật ghi chú: ${error.message}`);
        throw error;
      }
    };

    // Helper function to show edit note dialog
    const showEditNoteDialog = async (note) => {
      try {
        const { value: newContent } = await Swal.fire({
          title: "Chỉnh sửa nội dung ghi chú",
          html: `
            <div style="text-align: left;">
              <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                <strong style="color: #666;">Text được chọn:</strong><br>
                <em style="color: #888; font-size: 14px;">"${
                  note.selectedText?.substring(0, 100) || "Không có"
                }${(note.selectedText?.length || 0) > 100 ? "..." : ""}"</em>
              </div>
              <label for="noteContent" style="display: block; margin-bottom: 5px; font-weight: bold;">Nội dung ghi chú:</label>
              <textarea 
                id="noteContent" 
                class="swal2-textarea" 
                placeholder="Nhập nội dung ghi chú..."
                style="width: 100%; height: 120px; resize: vertical;"
              >${note.content || ""}</textarea>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Cập nhật",
          cancelButtonText: "Hủy",
          confirmButtonColor: "#3085d6",
          preConfirm: () => {
            const content = document.getElementById("noteContent").value;
            if (!content.trim()) {
              Swal.showValidationMessage("Vui lòng nhập nội dung ghi chú");
              return false;
            }
            return content.trim();
          },
        });

        if (newContent) {
          await updateNote(note.id, { content: newContent });
        }
      } catch (error) {
        console.error("❌ Error in edit dialog:", error);
        toast.error("Có lỗi xảy ra khi chỉnh sửa ghi chú");
      }
    };

    // Helper function to delete a single note
    const handleDeleteSingleNote = async (noteId) => {
      try {
        // Xóa trực tiếp không cần confirm
        await deleteNote(noteId);
      } catch (error) {
        console.error("❌ Error deleting single note:", error);
        toast.error("Có lỗi xảy ra khi xóa ghi chú");
      }
    };

    // Helper function to delete all notes
    const handleDeleteAllNotes = async () => {
      try {
        if (userNotes.value.length === 0) {
          toast.info("Không có ghi chú nào để xóa");
          return;
        }

        const result = await Swal.fire({
          title: "Xóa tất cả ghi chú?",
          text: `Bạn có chắc chắn muốn xóa tất cả ${userNotes.value.length} ghi chú trong cuốn sách này không? Hành động này không thể hoàn tác.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Xóa tất cả",
          cancelButtonText: "Hủy",
        });

        if (result.isConfirmed) {
          // Gọi API để xóa tất cả ghi chú của cuốn sách
          await deleteAllNotes();
        }
      } catch (error) {
        console.error("❌ Error deleting all notes:", error);
        toast.error("Có lỗi xảy ra khi xóa tất cả ghi chú");
      }
    };

    const deleteNote = async (noteId) => {
      try {
        const response = await noteService.deleteNote(noteId);

        if (response.success) {
          // Cập nhật dữ liệu
          userNotes.value = userNotes.value.filter((n) => n.id !== noteId);

          // Refresh highlights
          if (readerContent.value && readerContent.value.refreshHighlights) {
            await readerContent.value.refreshHighlights();
          }

          // Không hiển thị toast cho xóa ghi chú đơn lẻ
          return true;
        }
      } catch (error) {
        console.error("❌ Error deleting note:", error);
        toast.error(`Không thể xóa ghi chú: ${error.message}`);
        throw error;
      }
    };

    const deleteAllNotes = async () => {
      try {
        const bookId = bookData.value?.id || bookData.value?._id;
        if (!bookId) {
          throw new Error("Không tìm thấy thông tin sách");
        }

        // Kiểm tra xem có note nào không
        if (!userNotes.value || userNotes.value.length === 0) {
          toast.info("Không có ghi chú nào để xóa");
          return false;
        }

        // Hiển thị SweetAlert2 confirmation
        const result = await Swal.fire({
          title: "Xóa tất cả ghi chú?",
          text: `Bạn có chắc chắn muốn xóa tất cả ${userNotes.value.length} ghi chú trong cuốn sách này không?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Xóa tất cả",
          cancelButtonText: "Hủy",
          reverseButtons: false,
          focusCancel: true,
        });

        if (!result.isConfirmed) {
          return false;
        }

        const response = await noteService.deleteAllNotes(bookId);

        if (response.success) {
          // Cập nhật dữ liệu
          userNotes.value = [];

          // Refresh highlights
          if (readerContent.value && readerContent.value.refreshHighlights) {
            await readerContent.value.refreshHighlights();
          }

          toast.success(`Đã xóa ${response.data.deletedCount} ghi chú`);
          return true;
        }
      } catch (error) {
        console.error("❌ Error deleting all notes:", error);
        toast.error(`Không thể xóa ghi chú: ${error.message}`);
        throw error;
      }
    };

    // Event handlers
    const handleBack = () => {
      router.push(`/book/${route.params.slug}`);
    };

    const handleProgressChange = (progressData) => {
      console.log("📄 Progress change:", progressData);
      currentPage.value = progressData.currentPage;
      totalPages.value = progressData.totalPages;
      readingProgress.value = progressData.percentage;
    };

    const handleChapterSelect = (chapter) => {
      console.log("📖 Chapter selected:", chapter);
      sidebarOpen.value = false;
      if (readerContent.value) {
        // Use navigateToTocItem for better TOC navigation
        if (chapter.href) {
          readerContent.value.navigateToTocItem(chapter);
        } else {
          readerContent.value.goToChapter(chapter.href);
        }
      }
    };

    const handleBookmarkSelect = (bookmark) => {
      console.log("📖 Bookmark selected:", bookmark);
      sidebarOpen.value = false;
      if (readerContent.value && bookmark.cfi) {
        readerContent.value.goToLocation(bookmark.cfi);
      }
    };

    const handleNoteSelect = (note) => {
      sidebarOpen.value = false;
      if (readerContent.value && note.cfi) {
        readerContent.value.goToLocation(note.cfi);
      }
    };

    const handleNoteClick = (note) => {
      console.log("📝 Note clicked from highlight:", note);
      // Show note details with edit, delete, and delete all options
      Swal.fire({
        title: "Ghi chú",
        html: `
          <div style="text-align: left;">
            <div style="margin-bottom: 10px;">
              <strong>Nội dung:</strong><br>
              <p style="margin: 5px 0;">${note.content}</p>
            </div>
            ${
              note.selectedText
                ? `
              <div style="margin-bottom: 10px;">
                <strong>Text đã chọn:</strong><br>
                <em style="color: #666; font-size: 14px;">"${note.selectedText.substring(
                  0,
                  100
                )}${note.selectedText.length > 100 ? "..." : ""}"</em>
              </div>
            `
                : ""
            }
            <div style="font-size: 12px; color: #999;">
              <i class="fas fa-clock"></i> ${formatNoteDate(note.createdAt)}
            </div>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-edit"></i> Chỉnh sửa',
        denyButtonText: '<i class="fas fa-trash"></i> Xóa ghi chú',
        cancelButtonText: '<i class="fas fa-times"></i> Đóng',
        confirmButtonColor: "#3085d6",
        denyButtonColor: "#dc2626",
        footer: `
          <button id="deleteAllNotesBtn" style="
            background: #dc2626; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
          ">
            <i class="fas fa-trash-alt"></i> Xóa tất cả ghi chú
          </button>
        `,
        customClass: {
          popup: "note-details-popup",
          htmlContainer: "note-details-content",
        },
        didOpen: () => {
          // Add event listener for delete all button
          const deleteAllBtn = document.getElementById("deleteAllNotesBtn");
          if (deleteAllBtn) {
            deleteAllBtn.addEventListener("click", async () => {
              Swal.close();
              await handleDeleteAllNotes();
            });
          }
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Open edit dialog
          await showEditNoteDialog(note);
        } else if (result.isDenied) {
          // Delete this note
          await handleDeleteSingleNote(note.id);
        }
      });
    };

    const formatNoteDate = (dateString) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return "Không rõ";
      }
    };

    const handleTextSelected = async (selectionData) => {
      try {
        console.log("🎯 BookReader received text selection event!");
        console.log("📝 Selection data:", selectionData);
        console.log("📄 Selected text:", selectionData.selectedText);
        console.log("📍 CFI:", selectionData.cfi);

        // Show context menu with note options
        const result = await Swal.fire({
          title: "Tạo ghi chú",
          html: `
            <div style="text-align: left; margin-bottom: 15px;">
              <strong>Text đã chọn:</strong><br>
              <em style="color: #666; font-size: 14px;">"${selectionData.selectedText.substring(
                0,
                100
              )}${selectionData.selectedText.length > 100 ? "..." : ""}"</em>
            </div>
          `,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "📝 Thêm ghi chú",
          denyButtonText: "💛 Chỉ highlight",
          cancelButtonText: "Hủy",
          confirmButtonColor: "#3b82f6",
          denyButtonColor: "#f59e0b",
          cancelButtonColor: "#6b7280",
          focusCancel: true,
        });

        if (result.isConfirmed) {
          // User wants to add note with highlight
          const noteInput = await Swal.fire({
            title: "Nhập nội dung ghi chú",
            html: `
              <div style="text-align: left; margin-bottom: 15px;">
                <strong>Text highlight:</strong><br>
                <em style="color: #666; font-size: 12px;">"${selectionData.selectedText.substring(
                  0,
                  80
                )}${selectionData.selectedText.length > 80 ? "..." : ""}"</em>
              </div>
              <textarea id="note-content" class="swal2-textarea" placeholder="Nhập nội dung ghi chú..." style="height: 120px;"></textarea>
            `,
            showCancelButton: true,
            confirmButtonText: "Tạo ghi chú",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#3b82f6",
            cancelButtonColor: "#6b7280",
            preConfirm: () => {
              const content = document
                .getElementById("note-content")
                .value.trim();

              if (!content) {
                Swal.showValidationMessage("Vui lòng nhập nội dung ghi chú");
                return false;
              }

              return { content };
            },
          });

          if (noteInput.isConfirmed) {
            const noteData = {
              cfi: selectionData.cfi,
              content: noteInput.value.content,
              selectedText: selectionData.selectedText,
            };

            await createNote(noteData);
          }
        } else if (result.isDenied) {
          // User wants only highlight (no additional content)
          const noteData = {
            cfi: selectionData.cfi,
            content: "Highlight", // Minimal content for highlight-only
            selectedText: selectionData.selectedText,
          };

          await createNote(noteData);
        }
        // If cancelled, do nothing
      } catch (error) {
        console.error("❌ Error handling text selection:", error);
        toast.error("Không thể tạo ghi chú");
      }
    };

    const handleBookmark = async () => {
      try {
        if (!readerContent.value) {
          toast.warning("Reader chưa sẵn sàng");
          return;
        }

        // Get current location from reader
        const currentLocation = readerContent.value.getCurrentLocation();
        if (!currentLocation || !currentLocation.cfi) {
          toast.warning("Không thể xác định vị trí hiện tại");
          return;
        }

        // Check if bookmark already exists at this location
        const existingBookmark = bookmarkService.findBookmarkByCfi(
          userBookmarks.value,
          currentLocation.cfi
        );

        if (existingBookmark) {
          toast.info("Dấu trang đã tồn tại tại vị trí này");
          return;
        }

        // Get chapter title for bookmark
        const chapterTitle =
          currentLocation.chapter || currentChapter.value || "Không xác định";

        // Create bookmark with default title
        const bookmarkData = {
          cfi: currentLocation.cfi,
          title: `Dấu trang - ${chapterTitle}`,
        };

        await createBookmark(bookmarkData);
      } catch (error) {
        console.error("❌ Error creating bookmark:", error);
        toast.error("Không thể tạo dấu trang");
      }
    };

    const handleClearSearch = () => {
      if (readerContent.value) {
        readerContent.value.clearSearch();
      }
      console.log("🧹 Search cleared");
    };

    const handleSearch = async (query) => {
      if (readerContent.value) {
        try {
          console.log("🔍 BookReader performing search:", query);
          const results = await readerContent.value.searchInBook(query);
          console.log("🔍 Search results:", results);
        } catch (error) {
          console.error("❌ Search error:", error);
          toast.error("Lỗi tìm kiếm");
        }
      }
    };

    const handleTocExtracted = (toc) => {
      console.log("📋 TOC extracted:", toc);
      tableOfContents.value = toc;
    };

    const handleSettingsChange = (newSettings) => {
      Object.assign(settings, newSettings);
      applyReaderSettings();
    };

    const applyReaderSettings = () => {
      // Apply settings to the reading environment
      const readerEl = document.querySelector(".book-reader");
      if (readerEl) {
        readerEl.style.setProperty(
          "--reader-font-size",
          settings.fontSize + "px"
        );
        readerEl.style.setProperty("--reader-font-family", settings.fontFamily);
        // readerEl.style.setProperty("--reader-line-height", settings.lineHeight);
        // readerEl.style.setProperty("--reader-text-align", settings.textAlign);
        // readerEl.style.setProperty(
        //   "--reader-page-width",
        //   settings.pageWidth + "%"
        // );
      }
    };

    const handleToggleFullscreen = () => {
      if (readerContent.value) {
        readerContent.value.toggleFullscreen();
      }
    };

    const retryLoad = () => {
      readerError.value = null;
      initialLoading.value = true;
      loadBookData();
    };

    const nextPage = () => {
      if (readerContent.value) {
        readerContent.value.nextPage();
      }
    };

    const previousPage = () => {
      if (readerContent.value) {
        readerContent.value.previousPage();
      }
    };

    const handleDownloadPdf = async () => {
      // Kiểm tra xem sách có hỗ trợ định dạng PDF không
      const availableFormats = bookData.value?.availableFormats || [];

      if (!availableFormats.includes("pdf")) {
        console.warn("⚠️ PDF format not available for this book");
        toast.warning(
          "Sách này chưa hỗ trợ tải xuống định dạng PDF. Vui lòng liên hệ quản trị viên để được hỗ trợ."
        );
        return;
      }

      if (!pdfDownloadUrl.value) {
        console.warn("⚠️ No PDF download URL available");
        toast.warning("Đường dẫn tải PDF không có sẵn. Vui lòng thử lại sau.");
        return;
      }

      try {
        console.log("📥 Opening PDF in new tab...");
        // Mở PDF trong tab mới để browser tự handle
        window.open(pdfDownloadUrl.value, "_blank");
        console.log("✅ PDF opened in new tab");
        toast.success("Đã mở file PDF trong tab mới");
      } catch (error) {
        console.error("❌ Error opening PDF:", error);
        toast.error(`Không thể mở file PDF: ${error.message}`);
      }
    };

    // Keyboard shortcuts
    const handleKeydown = (event) => {
      switch (event.key) {
        case "Escape":
          if (settingsOpen.value) {
            settingsOpen.value = false;
          } else if (sidebarOpen.value) {
            sidebarOpen.value = false;
          } else if (document.fullscreenElement) {
            // Exit fullscreen if in fullscreen mode
            document.exitFullscreen();
          }
          break;
        case "F11":
          event.preventDefault();
          handleToggleFullscreen();
          break;
        case "f":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Toggle search in toolbar
            if (readerToolbar.value) {
              // Focus search or toggle search UI
              toast.info("Nhấn biểu tượng tìm kiếm trên toolbar");
            }
          }
          break;
        case "s":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Removed save progress functionality
            toast.info("Chức năng lưu tiến độ đã được tắt");
          }
          break;
      }
    };

    // Lifecycle
    onMounted(() => {
      loadBookData();
      document.addEventListener("keydown", handleKeydown);

      // Load settings from localStorage
      const savedSettings = localStorage.getItem("readerSettings");
      if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings));
      }
      applyReaderSettings();
    });

    onBeforeUnmount(() => {
      document.removeEventListener("keydown", handleKeydown);
    });

    return {
      // Data
      bookData,
      licenseData,
      initialLoading,
      contentLoading,
      loadingProgress,
      readerError,
      contentError,

      // UI State
      sidebarOpen,
      settingsOpen,

      // Reading State
      currentFileUrl,
      pdfDownloadUrl,
      readingProgress,
      currentLocation,
      currentChapter,
      currentChapterId,
      currentPage,
      totalPages,

      // Settings
      settings,

      // Content
      tableOfContents,
      userBookmarks,
      userNotes,

      // Refs
      readerContent,
      searchInput,
      readerToolbar,

      // Methods
      handleBack,
      handleDownloadPdf,
      handleTocExtracted,
      handleProgressChange,
      handleChapterSelect,
      handleBookmarkSelect,
      handleNoteSelect,
      handleNoteClick,
      handleBookmark,
      handleClearSearch,
      handleSearch,
      handleSettingsChange,
      handleToggleFullscreen,
      retryLoad,
      loadContent,
      loadBookmarks,
      loadNotes,
      createBookmark,
      updateBookmark,
      deleteBookmark,
      deleteAllBookmarks,
      createNote,
      updateNote,
      deleteNote,
      deleteAllNotes,
      showEditNoteDialog,
      handleDeleteSingleNote,
      handleDeleteAllNotes,
      handleTextSelected,
      nextPage,
      previousPage,
    };
  },
};
</script>

<style scoped src="./BookReader.css"></style>
