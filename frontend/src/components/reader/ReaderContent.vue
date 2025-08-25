<template>
  <div class="reader-content">
    <!-- No File URL State -->
    <div v-if="!fileUrl && !isLoading && !error" class="no-file-overlay">
      <div class="no-file-content">
        <i class="fas fa-file-times"></i>
        <h3>Không có file để hiển thị</h3>
        <p>Vui lòng chọn định dạng sách hoặc thử lại</p>
        <button @click="$emit('retry')" class="retry-btn">
          <i class="fas fa-redo"></i>
          Thử lại
        </button>
      </div>
    </div>

    <!-- EPUB Reader -->
    <div
      v-if="fileUrl"
      id="epub-viewer"
      class="epub-viewer spread-view"
      ref="epubViewer"
    >
      <!-- EPUB content will be rendered here -->
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <i class="fas fa-book-open fa-spin"></i>
        <h3>Đang tải sách...</h3>
        <p>Vui lòng đợi trong giây lát</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Không thể tải sách</h3>
        <p>{{ error }}</p>
        <button @click="$emit('retry')" class="retry-btn">
          <i class="fas fa-redo"></i>
          Thử lại
        </button>
      </div>
    </div>

    <!-- Fullscreen Notification -->
    <div
      v-if="showFullscreenNotification"
      class="fullscreen-notification"
      @click="hideFullscreenNotification"
    >
      <div class="notification-content">
        <i class="fas fa-expand-arrows-alt"></i>
        <span>Chế độ toàn màn hình</span>
        <div class="exit-hint">
          Nhấn <kbd>F11</kbd> hoặc <kbd>ESC</kbd> để thoát
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useAuthStore } from "../../store/authStore.js";
import readerService from "../../services/readerService.js";

// Props
const props = defineProps({
  bookData: {
    type: Object,
    required: true,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  fontSize: {
    type: Number,
    default: 16,
  },
  fontFamily: {
    type: String,
    default: "Arial, sans-serif",
  },
  theme: {
    type: String,
    default: "light",
  },
  notes: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits([
  "error",
  "retry",
  "toc-extracted",
  "progress-change",
  "theme-change",
  "text-selected",
  "note-clicked",
]);

// Reactive data
const epubBook = ref(null);
const epubRendition = ref(null);
const readingProgress = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const isInitializing = ref(false); // Flag để ngăn chặn khởi tạo duplicate
const tableOfContents = ref([]);

// Search state
const searchQuery = ref("");
const searchResults = ref([]);

// Fullscreen notification
const showFullscreenNotification = ref(false);

// Refs
const epubViewer = ref(null);

// Auth store
const authStore = useAuthStore();

// Methods
const initializeReader = async () => {
  console.log("🚀 Khởi tạo trình đọc EPUB");
  console.log("📁 URL File:", props.fileUrl);

  // Ngăn chặn khởi tạo duplicate
  if (isInitializing.value) {
    console.log("⏸️ Đang khởi tạo, bỏ qua...");
    return;
  }

  isInitializing.value = true;

  try {
    cleanup();

    // Wait for next tick to ensure DOM is ready
    await nextTick();

    // Add a small delay to ensure DOM is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    await initEpubReader();
  } finally {
    isInitializing.value = false;
  }
};

const initEpubReader = async () => {
  console.log("🔄 Đang khởi tạo trình đọc EPUB...");
  console.log("📁 URL File:", props.fileUrl);
  console.log(
    "🌐 ePub có sẵn:",
    typeof window !== "undefined" && !!window.ePub
  );
  console.log(
    "📦 JSZip có sẵn:",
    typeof window !== "undefined" && !!window.JSZip
  );

  if (typeof window === "undefined" || !window.ePub) {
    console.error("❌ ePub.js chưa được tải");
    emit("error", "Thư viện đọc EPUB chưa được tải");
    return;
  }

  if (typeof window === "undefined" || !window.JSZip) {
    console.error("❌ JSZip chưa được tải");
    emit("error", "Thư viện JSZip chưa được tải");
    return;
  }

  if (!props.fileUrl) {
    console.warn("⚠️ Không có URL file được cung cấp cho trình đọc EPUB");
    return; // Don't emit error, just wait for URL
  }

  // Check DOM element is ready
  if (!epubViewer.value) {
    console.warn("⚠️ Phần tử DOM chưa sẵn sàng, đang chờ...");
    await nextTick();

    // Wait a bit more for DOM to be fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!epubViewer.value) {
      console.error("❌ Phần tử DOM vẫn không có sẵn");
      emit("error", "Không thể khởi tạo container đọc sách");
      return;
    }
  }

  try {
    console.log("📖 Đang tạo sách EPUB...");
    console.log("📍 Phần tử DOM:", epubViewer.value);

    // Check DOM element dimensions
    if (epubViewer.value) {
      const rect = epubViewer.value.getBoundingClientRect();
      console.log("📐 Kích thước phần tử:", {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
      });

      // Ensure element has proper dimensions
      if (rect.width === 0 || rect.height === 0) {
        console.warn(
          "⚠️ Phần tử có kích thước bằng 0, đặt kích thước mặc định"
        );
        epubViewer.value.style.width = "100%";
        epubViewer.value.style.height = "600px";
        epubViewer.value.style.minHeight = "400px";
      }
    }

    // Fetch the EPUB file as ArrayBuffer from the proxy endpoint
    console.log("📥 Đang tải file EPUB từ proxy...");
    try {
      const headers = {};
      if (authStore.token) {
        headers["Authorization"] = `Bearer ${authStore.token}`;
      }

      const response = await fetch(props.fileUrl, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP! trạng thái: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(
        "✅ File EPUB được tải thành công:",
        arrayBuffer.byteLength,
        "bytes"
      );

      // Configure JSZip for EPUB.js if needed
      if (window.JSZip && window.ePub) {
        // Set JSZip for EPUB.js
        window.ePub.JSZip = window.JSZip;
      }

      // Create EPUB book from ArrayBuffer instead of URL
      epubBook.value = window.ePub(arrayBuffer);
      console.log("📚 Sách EPUB được tạo từ ArrayBuffer:", epubBook.value);
    } catch (fetchError) {
      console.error("❌ Lỗi khi tải file EPUB:", fetchError);
      emit("error", `Không thể tải file EPUB: ${fetchError.message}`);
      return;
    }

    // Wait for book to be ready
    await epubBook.value.ready;
    console.log("📚 Sách EPUB đã sẵn sàng");

    console.log("🎨 Đang tạo rendition...");
    epubRendition.value = epubBook.value.renderTo(epubViewer.value, {
      width: "100%",
      height: "100%",
      spread: "always", // Luôn hiển thị 2 trang cạnh nhau
      flow: "paginated",
      allowScriptedContent: false,
      manager: "default",
      // Tắt sandbox để tránh lỗi script execution
      sandbox: false,
    });
    console.log("🎨 Rendition đã được tạo:", epubRendition.value);

    console.log("🚀 Đang hiển thị EPUB...");
    const displayed = await epubRendition.value.display();
    console.log("✅ Kết quả hiển thị EPUB:", displayed);

    console.log("⚡ Đang thiết lập sự kiện...");
    setupEpubEvents();

    console.log("✅ Trình đọc EPUB đã được khởi tạo thành công");
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo trình đọc EPUB:", error);
    console.error("❌ Chi tiết lỗi:", error.stack);
    emit("error", `Không thể khởi tạo trình đọc EPUB: ${error.message}`);
  }
};

const setupEpubEvents = () => {
  if (!epubRendition.value) return;

  // Listen for errors
  epubBook.value.on("error", (error) => {
    console.error("📚 EPUB Book Error:", error);
  });

  epubRendition.value.on("error", (error) => {
    console.error("🎨 EPUB Rendition Error:", error);
  });

  // Listen for location changes
  epubRendition.value.on("relocated", (location) => {
    console.log("📍 Location changed:", location);
    updateProgress();
  });

  // Listen for book ready
  epubBook.value.ready
    .then(() => {
      console.log("📚 Book ready, generating locations...");

      // Generate locations for accurate page tracking
      return epubBook.value.locations.generate(1600); // 1600 chars per location
    })
    .then(() => {
      console.log("📍 Locations generated:", epubBook.value.locations.length);

      // Extract table of contents after book is ready
      extractTableOfContents();

      // Apply initial settings
      applySettings();

      // Highlight notes after book is ready
      highlightNotes();
    })
    .catch((error) => {
      console.error("❌ Book ready error:", error);
    });

  // Navigation events
  epubRendition.value.on("keyup", (event) => {
    if (event.key === "ArrowLeft") {
      previousPage();
    } else if (event.key === "ArrowRight") {
      nextPage();
    } else if (event.key === "Escape") {
      // Exit fullscreen mode with ESC
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  });

  // Listen for rendered event
  epubRendition.value.on("rendered", (section) => {
    console.log("✅ Section rendered:", section);
    setupTextSelectionHandler(section);
  });

  // Setup initial text selection handler
  setupTextSelectionHandler();

  // Alternative: Setup global text selection handler on the main viewer
  setupGlobalTextSelection();

  // Also try EPUB.js built-in selection event
  if (epubRendition.value) {
    epubRendition.value.on("selected", (cfiRange, contents) => {
      console.log("📚 EPUB.js selected event fired:");
      console.log("- CFI Range:", cfiRange);
      console.log("- Contents:", contents);

      try {
        const selection = contents.window.getSelection();
        const selectedText = selection ? selection.toString().trim() : "";

        console.log("- Selected text:", selectedText.substring(0, 50));

        if (selectedText && selectedText.length > 0) {
          console.log("✅ Emitting text-selected event from EPUB.js");
          emit("text-selected", {
            selectedText,
            cfi: cfiRange,
            range: selection ? selection.getRangeAt(0) : null,
          });
        }
      } catch (error) {
        console.error("❌ Error processing EPUB.js selection:", error);
      }
    });
  }
};

// Text selection handler
const setupTextSelectionHandler = (section = null) => {
  if (!epubRendition.value) return;

  console.log(
    "🎯 Setting up text selection handler",
    section ? "for section" : "for all contents"
  );

  if (section) {
    // Setup for specific section
    addTextSelectionToSection(section);
  } else {
    // Setup for all current contents
    try {
      const contents = epubRendition.value.getContents();
      contents.forEach(addTextSelectionToSection);
    } catch (error) {
      console.warn(
        "⚠️ Could not setup text selection for all contents:",
        error
      );
    }
  }
};

const addTextSelectionToSection = (section) => {
  try {
    const iframe = section.iframe;
    if (!iframe) {
      console.warn("⚠️ No iframe found in section");
      return;
    }

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) {
      console.warn("⚠️ No document found in iframe");
      return;
    }

    console.log("✅ Adding text selection listener to section");

    // Remove existing listener to avoid duplicates
    doc.removeEventListener("mouseup", handleTextSelection);

    // Add mouseup event listener to detect text selection
    doc.addEventListener("mouseup", handleTextSelection);

    // Also add to document body for better coverage
    if (doc.body) {
      doc.body.removeEventListener("mouseup", handleTextSelection);
      doc.body.addEventListener("mouseup", handleTextSelection);
    }
  } catch (error) {
    console.error("❌ Error adding text selection to section:", error);
  }
};

const handleTextSelection = (event) => {
  try {
    console.log("🖱️ Phát hiện sự kiện nhấp chuột");

    const doc = event.target.ownerDocument || document;
    const selection = doc.getSelection();

    console.log("📝 Chi tiết lựa chọn:", {
      hasSelection: !!selection,
      isCollapsed: selection?.isCollapsed,
      text: selection?.toString(),
      rangeCount: selection?.rangeCount,
    });

    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      console.log("❌ Không có text hợp lệ được chọn");
      return; // No text selected
    }

    const selectedText = selection.toString().trim();
    console.log(
      "✅ Text hợp lệ được chọn:",
      selectedText.substring(0, 50) + "..."
    );

    // Get CFI range for the selection
    if (epubRendition.value && selectedText.length > 0) {
      try {
        const range = selection.getRangeAt(0);

        // Try to get CFI using EPUB.js method
        let cfi = "";
        try {
          cfi = epubRendition.value.getRange(range);
          if (cfi) {
            cfi = cfi.toString();
          }
        } catch (cfiError) {
          console.warn("⚠️ Could not get CFI from getRange:", cfiError);

          // Fallback: try to generate CFI manually
          try {
            cfi = getCurrentLocation()?.cfi || "";
          } catch (fallbackError) {
            console.warn("⚠️ Could not get fallback CFI:", fallbackError);
            cfi = `epubcfi(/6/2[id]!/4/2/2[id]/1:${Math.random()})`;
          }
        }

        console.log("📝 Text selection complete:", {
          selectedText: selectedText.substring(0, 100),
          cfi: cfi,
          length: selectedText.length,
        });

        // Emit text selection event to parent
        emit("text-selected", {
          selectedText: selectedText,
          cfi: cfi,
          range: range,
        });

        console.log("✅ Text selection event emitted");
      } catch (rangeError) {
        console.error("❌ Error processing selection range:", rangeError);

        // Emit without CFI as last resort
        emit("text-selected", {
          selectedText: selectedText,
          cfi: `fallback-${Date.now()}`,
          range: null,
        });
      }
    }
  } catch (error) {
    console.error("❌ Error handling text selection:", error);
  }
};

// Alternative global text selection handler
const setupGlobalTextSelection = () => {
  if (!epubViewer.value) return;

  console.log("🌐 Setting up global text selection handler");

  // Remove existing listener
  epubViewer.value.removeEventListener("mouseup", handleGlobalTextSelection);

  // Add global mouseup listener to the main viewer
  epubViewer.value.addEventListener("mouseup", handleGlobalTextSelection);
};

const handleGlobalTextSelection = (event) => {
  try {
    console.log("🌐 Global mouse up detected");

    // Try to get selection from all possible documents
    let selection = null;
    let selectedText = "";

    // Check main document
    selection = document.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      selectedText = selection.toString().trim();
      console.log("📝 Selection from main document:", selectedText);
    }

    // Check iframe documents if no selection in main
    if (!selectedText && epubRendition.value) {
      try {
        const contents = epubRendition.value.getContents();
        for (let content of contents) {
          if (content.document) {
            const iframeSelection = content.document.getSelection();
            if (
              iframeSelection &&
              !iframeSelection.isCollapsed &&
              iframeSelection.toString().trim()
            ) {
              selectedText = iframeSelection.toString().trim();
              selection = iframeSelection;
              console.log("📝 Selection from iframe:", selectedText);
              break;
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Error checking iframe selections:", error);
      }
    }

    if (selectedText && selectedText.length > 0) {
      console.log("✅ Global selection found:", selectedText.substring(0, 50));

      // Emit the selection
      emit("text-selected", {
        selectedText: selectedText,
        cfi: getCurrentLocation()?.cfi || `fallback-${Date.now()}`,
        range: selection ? selection.getRangeAt(0) : null,
      });
    }
  } catch (error) {
    console.error("❌ Error in global text selection:", error);
  }
};

// Notes highlighting functionality
const highlightNotes = () => {
  if (!epubRendition.value || !props.notes || props.notes.length === 0) {
    console.log("📝 No notes to highlight");
    return;
  }

  console.log("🟡 Adding highlights for", props.notes.length, "notes");

  try {
    // Sort notes by CFI to ensure consistent ordering and avoid overlaps
    const sortedNotes = [...props.notes].sort((a, b) => {
      if (a.cfi && b.cfi) {
        return a.cfi.localeCompare(b.cfi);
      }
      return 0;
    });

    // Add highlights for each note with unique styling
    sortedNotes.forEach((note, index) => {
      if (note.cfi && note.id) {
        try {
          // Determine highlight color and style
          let highlightColor, highlightClass;

          if (
            note.content === "Highlight" ||
            !note.content ||
            note.content.trim() === ""
          ) {
            // Pure highlight - yellow
            highlightColor = "#ffeb3b";
            highlightClass = `pure-highlight-${note.id}`;
          } else {
            // Note with content - green
            highlightColor = "#4caf50";
            highlightClass = `note-highlight-${note.id}`;
          }

          // Create unique click handler for this specific note
          const clickHandler = (e) => {
            console.log("📝 Note clicked:", note.id);

            // Verify note still exists (hasn't been deleted)
            const stillExists = props.notes.find((n) => n.id === note.id);
            if (stillExists) {
              emit("note-clicked", note);
            } else {
              console.warn("⚠️ Clicked note no longer exists:", note.id);
            }
          };

          // Add highlight with consistent styling to prevent opacity stacking
          epubRendition.value.annotations.add(
            "highlight",
            note.cfi,
            {},
            clickHandler,
            highlightClass,
            {
              fill: highlightColor,
              "fill-opacity": "0.35", // Slightly lower opacity to prevent stacking issues
              "mix-blend-mode": "normal", // Use normal blend mode to avoid darkening on overlap
              stroke: "none",
              "stroke-width": "0",
              // Add specific z-index to prevent stacking
              "z-index": index + 1,
            }
          );

          console.log(`✅ Highlighted note ${index + 1}: ${highlightClass}`);
        } catch (error) {
          console.warn(`⚠️ Failed to highlight note ${note.id}:`, error);
        }
      } else {
        console.warn(`⚠️ Note missing CFI or ID:`, note);
      }
    });

    console.log("✅ All notes highlighted successfully");
  } catch (error) {
    console.error("❌ Error highlighting notes:", error);
  }
};

const clearNoteHighlights = () => {
  if (!epubRendition.value) return;
  try {
    console.log("🧹 Đang xóa highlight ghi chú (legacy method)");
    clearNoteHighlightsCompletely();
  } catch (error) {
    console.warn("⚠️ Lỗi khi xóa highlight ghi chú:", error);
  }
};

// Enhanced clear method - xóa hoàn toàn tất cả highlights và events
const clearNoteHighlightsCompletely = async () => {
  if (!epubRendition.value) return;

  try {
    console.log("🧹 Clearing all highlights completely");

    // Method 1: Use EPUB.js API to remove annotations
    if (epubRendition.value.annotations) {
      props.notes.forEach((note) => {
        if (note.cfi) {
          try {
            epubRendition.value.annotations.remove(note.cfi, "highlight");
          } catch (e) {
            // console.warn(`Could not remove annotation via API for cfi: ${note.cfi}`, e);
          }
        }
      });
    }

    // Method 2: Direct DOM manipulation for cleanup
    // This is a more robust way to ensure all visual highlights are gone.
    if (
      epubRendition.value &&
      epubRendition.value.manager &&
      epubRendition.value.manager.views
    ) {
      epubRendition.value.manager.views.forEach((view) => {
        if (view.document && view.document.body) {
          const highlights = view.document.body.querySelectorAll(
            'span[class*="pure-highlight-"], span[class*="note-highlight-"]'
          );
          if (highlights.length > 0) {
            console.log(
              `[DOM Cleanup] Found and removed ${highlights.length} highlight spans.`
            );
            highlights.forEach((span) => {
              // Replace the span with its text content
              if (span.parentNode) {
                const textNode = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(textNode, span);
              }
            });
            // Merge adjacent text nodes
            view.document.body.normalize();
          }
        }
      });
    }

    console.log("✅ All highlights cleared.");
  } catch (error) {
    console.warn("⚠️ Error clearing annotations:", error);
  }
};

// Public method to refresh highlights - called when notes are updated
const refreshHighlights = async () => {
  if (!epubRendition.value) {
    return;
  }

  try {
    console.log(
      "🔄 Refreshing highlights - notes count:",
      props.notes?.length || 0
    );

    // Step 1: Clear all existing highlights completely
    await clearNoteHighlightsCompletely();

    // Step 2: Wait for clear to complete fully
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Step 3: Re-add highlights if we have notes
    if (props.notes && props.notes.length > 0) {
      console.log("✨ Re-adding highlights for", props.notes.length, "notes");
      highlightNotes();
    } else {
      console.log("✅ No notes to highlight");
    }

    console.log("✅ Highlight refresh completed");
  } catch (error) {
    console.error("❌ Refresh error:", error);
  }
};

const loadContent = async () => {
  console.log("📥 Loading EPUB content...");
  console.log("📁 File URL:", props.fileUrl);

  if (!props.fileUrl) {
    console.log("⚠️ No file URL, skipping load");
    return;
  }

  if (!epubRendition.value) {
    console.log("🔄 No EPUB rendition, initializing...");
    await initEpubReader();
  } else {
    console.log("🔄 EPUB rendition exists, displaying...");
    await epubRendition.value.display();
  }
};

const updateProgress = () => {
  if (epubBook.value && epubRendition.value) {
    const location = epubRendition.value.currentLocation();
    if (location && location.start) {
      // Calculate percentage progress
      if (epubBook.value.locations && epubBook.value.locations.length > 0) {
        const progress = epubBook.value.locations.percentageFromCfi(
          location.start.cfi
        );
        readingProgress.value = Math.round(progress * 100);

        // Calculate page information using locations
        const totalLocs = epubBook.value.locations.length;
        const currentLoc = epubBook.value.locations.locationFromCfi(
          location.start.cfi
        );

        // Calculate current page based on location index (1-based)
        currentPage.value = Math.max(1, Math.min(currentLoc + 1, totalLocs));
        totalPages.value = totalLocs;

        console.log(
          `📄 Page info: ${currentPage.value}/${totalPages.value} (${readingProgress.value}%)`
        );
      } else {
        // Fallback: estimate progress and pages without locations
        console.log("⚠️ Locations not ready, using spine estimation");
        const spineIndex = location.start.index || 0;
        const totalSpine = epubBook.value.spine.length || 1;
        const estimatedProgress = Math.round((spineIndex / totalSpine) * 100);

        readingProgress.value = estimatedProgress;
        currentPage.value = spineIndex + 1;
        totalPages.value = totalSpine;

        console.log(
          `📄 Estimated page info: ${currentPage.value}/${totalPages.value} (${readingProgress.value}%)`
        );
      }

      // Emit page change event
      emit("progress-change", {
        currentPage: currentPage.value,
        totalPages: totalPages.value,
        percentage: readingProgress.value,
      });
    }
  }
};

const nextPage = () => {
  if (epubRendition.value) {
    epubRendition.value.next();
  }
};

const previousPage = () => {
  if (epubRendition.value) {
    epubRendition.value.prev();
  }
};

const hideFullscreenNotification = () => {
  showFullscreenNotification.value = false;
};

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      await document.documentElement.requestFullscreen();
      showFullscreenNotification.value = true;

      // Auto hide notification after 4 seconds
      setTimeout(() => {
        showFullscreenNotification.value = false;
      }, 4000);
    } else {
      // Exit fullscreen
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error("❌ Fullscreen error:", error);
  }
};

const cleanup = () => {
  console.log("🧹 Cleaning up reader...");

  // Set flag to prevent new initialization during cleanup
  isInitializing.value = true;

  // Cleanup EPUB
  if (epubRendition.value) {
    try {
      epubRendition.value.destroy();
    } catch (error) {
      console.warn("Warning during rendition cleanup:", error);
    }
    epubRendition.value = null;
  }

  if (epubBook.value) {
    try {
      epubBook.value.destroy();
    } catch (error) {
      console.warn("Warning during book cleanup:", error);
    }
    epubBook.value = null;
  }

  // Reset flag after cleanup
  setTimeout(() => {
    isInitializing.value = false;
  }, 100);
};

// Public methods for parent component
const getCurrentLocation = () => {
  if (!epubRendition.value) {
    console.warn("⚠️ EPUB rendition not available");
    return null;
  }

  try {
    // Get current CFI location
    const currentLocation = epubRendition.value.currentLocation();
    if (!currentLocation || !currentLocation.start) {
      console.warn("⚠️ Current location not available");
      return null;
    }

    // Get current chapter info
    const currentChapter = getCurrentChapter();

    console.log("📍 Current location:", {
      cfi: currentLocation.start.cfi,
      chapter: currentChapter,
      location: currentLocation,
    });

    return {
      cfi: currentLocation.start.cfi,
      chapter: currentChapter,
      percentage: currentLocation.start.percentage || 0,
      location: currentLocation,
    };
  } catch (error) {
    console.error("❌ Error getting current location:", error);
    return null;
  }
};

const getCurrentChapter = () => {
  if (!epubRendition.value) return null;

  try {
    const location = epubRendition.value.currentLocation();
    if (!location || !location.start) return null;

    // Try to get chapter from navigation
    if (epubBook.value && epubBook.value.navigation) {
      const navigation = epubBook.value.navigation;
      const currentHref = location.start.href;

      // Find matching chapter in TOC
      const findChapter = (items) => {
        for (const item of items) {
          if (item.href === currentHref || currentHref.includes(item.href)) {
            return item.label || item.title || "Chương hiện tại";
          }
          if (item.subitems) {
            const found = findChapter(item.subitems);
            if (found) return found;
          }
        }
        return null;
      };

      const chapterTitle = findChapter(navigation.toc);
      if (chapterTitle) return chapterTitle;
    }

    return "Chương hiện tại";
  } catch (error) {
    console.error("❌ Error getting current chapter:", error);
    return null;
  }
};

const goToLocation = (location) => {
  if (epubRendition.value) {
    epubRendition.value.display(location);
  }
};

const goToChapter = (href) => {
  if (epubRendition.value && href) {
    console.log("📖 Navigating to chapter:", href);
    epubRendition.value.display(href);
  }
};

const initializeReaderIfNeeded = () => {
  if (!isInitializing.value && !epubRendition.value) {
    initializeReader();
  }
};

// Method to navigate to TOC item
const navigateToTocItem = (tocItem) => {
  if (tocItem && tocItem.href) {
    console.log("📋 Navigating to TOC item:", tocItem);
    goToChapter(tocItem.href);
  }
};

// Search functionality - Simplified to search only in current view
const searchInBook = async (query) => {
  if (!epubRendition.value || !query.trim()) {
    clearSearch();
    return [];
  }

  try {
    console.log("🔍 Searching in current view for:", query);

    // ALWAYS clear previous highlights and results first
    clearHighlights();
    searchResults.value = [];

    searchQuery.value = query;

    // Search only in current view (2 pages)
    const results = searchInCurrentView(query);

    console.log("🔍 Found", results.length, "results in current view");

    if (results.length > 0) {
      // Highlight all found text immediately
      highlightTextInCurrentView(query);
    }

    searchResults.value = results;

    return results;
  } catch (error) {
    console.error("❌ Search error:", error);
    clearSearch();
    return [];
  }
};

// Simple search in current view only
const searchInCurrentView = (query) => {
  const results = [];
  const searchTerm = query.toLowerCase();

  try {
    if (!epubRendition.value || !epubRendition.value.getContents) {
      return results;
    }

    const contents = epubRendition.value.getContents();
    console.log("📄 Searching in current contents (2 pages)");

    for (let content of contents) {
      if (content.document && content.document.body) {
        const textContent = content.document.body.textContent || "";
        const lowerText = textContent.toLowerCase();
        let index = lowerText.indexOf(searchTerm);

        while (index !== -1) {
          const start = Math.max(0, index - 30);
          const end = Math.min(
            textContent.length,
            index + searchTerm.length + 30
          );
          const excerpt = textContent.substring(start, end).trim();

          results.push({
            id: results.length,
            excerpt: excerpt,
            position: index,
            page: content,
          });

          index = lowerText.indexOf(searchTerm, index + 1);
        }
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Search in current view error:", error);
    return results;
  }
};

// Simplified highlighting - no focus system needed
const highlightTextInCurrentView = (searchTerm) => {
  try {
    if (!epubRendition.value || !searchTerm) return;

    console.log("🟡 Highlighting text:", searchTerm);

    const contents = epubRendition.value.getContents();

    for (let content of contents) {
      if (content.document && content.document.body) {
        highlightInElement(content.document.body, searchTerm.toLowerCase());
      }
    }
  } catch (error) {
    console.warn("⚠️ Highlighting error:", error);
  }
};

// Simple highlighting - all results same style
const highlightInElement = (element, searchTerm) => {
  if (!element || !searchTerm) return;

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.toLowerCase().includes(searchTerm)) {
      textNodes.push(node);
    }
  }

  // Highlight all text nodes containing search term
  textNodes.forEach((textNode) => {
    const text = textNode.textContent;
    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (lowerText.includes(lowerSearchTerm)) {
      const matches = [];
      let index = lowerText.indexOf(lowerSearchTerm);

      while (index !== -1) {
        matches.push({
          start: index,
          end: index + searchTerm.length,
        });
        index = lowerText.indexOf(lowerSearchTerm, index + 1);
      }

      if (matches.length > 0) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach((match) => {
          // Add text before match
          if (match.start > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastIndex, match.start))
            );
          }

          // Add highlighted match
          const highlightSpan = document.createElement("span");
          highlightSpan.style.backgroundColor = "#ffeb3b";
          highlightSpan.style.color = "#000";
          highlightSpan.style.padding = "2px";
          highlightSpan.style.borderRadius = "2px";
          highlightSpan.textContent = text.substring(match.start, match.end);
          fragment.appendChild(highlightSpan);

          lastIndex = match.end;
        });

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex))
          );
        }

        textNode.parentNode.replaceChild(fragment, textNode);
      }
    }
  });
};

const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];

  // Clear highlights
  clearHighlights();
};

// Enhanced clear highlights - ensure all highlights are removed
const clearHighlights = () => {
  try {
    if (!epubRendition.value) return;

    console.log("🧹 Clearing all highlights...");

    const contents = epubRendition.value.getContents();
    let totalCleared = 0;

    for (let content of contents) {
      if (content.document) {
        // Find and remove all possible highlight spans with different selectors
        const highlightSelectors = [
          'span[style*="background-color: #ffeb3b"]',
          'span[style*="background-color: #ff9800"]',
          'span[style*="background-color: rgb(255, 235, 59)"]',
          'span[style*="background-color: rgb(255, 152, 0)"]',
          'span[style*="background-color:rgb(255,235,59)"]',
          'span[style*="background-color:rgb(255,152,0)"]',
          'span[style*="background-color:#ffeb3b"]',
          'span[style*="background-color:#ff9800"]',
          ".search-highlight", // Class-based highlights
        ];

        highlightSelectors.forEach((selector) => {
          const highlightSpans = content.document.querySelectorAll(selector);
          highlightSpans.forEach((span) => {
            const textNode = content.document.createTextNode(span.textContent);
            span.parentNode.replaceChild(textNode, span);
            totalCleared++;
          });
        });

        // Normalize text nodes to merge adjacent text nodes
        if (content.document.body) {
          content.document.body.normalize();
        }
      }
    }

    console.log(`✅ Cleared ${totalCleared} highlights`);
  } catch (error) {
    console.warn("⚠️ Clear highlights error:", error);
  }
};

const extractTableOfContents = async () => {
  if (!epubBook.value) {
    console.warn("⚠️ No EPUB book available for TOC extraction");
    return;
  }

  try {
    console.log("📋 Extracting table of contents...");

    // Get navigation from EPUB
    const navigation = epubBook.value.navigation;
    console.log("📋 Raw navigation:", navigation);

    if (navigation && navigation.toc) {
      const toc = navigation.toc;
      console.log("📋 TOC found:", toc);

      // Transform EPUB TOC to our format
      const processedToc = processTocItems(toc, 1);
      console.log("📋 Processed TOC:", processedToc);

      // Emit TOC to parent component
      emit("toc-extracted", processedToc);
    } else {
      console.warn("⚠️ No table of contents found in EPUB");
      emit("toc-extracted", []);
    }
  } catch (error) {
    console.error("❌ Error extracting TOC:", error);
    emit("toc-extracted", []);
  }
};

const processTocItems = (tocItems, level = 1) => {
  if (!Array.isArray(tocItems)) {
    return [];
  }

  return tocItems.map((item, index) => {
    const processedItem = {
      id: `toc-${level}-${index}`,
      label: item.label || item.title || "Không có tiêu đề",
      href: item.href || "",
      level: level,
      subitems: [],
    };

    // Process subitems recursively if they exist
    if (item.subitems && Array.isArray(item.subitems)) {
      processedItem.subitems = processTocItems(item.subitems, level + 1);
    }

    return processedItem;
  });
};

// Apply settings to EPUB rendition
const applySettings = () => {
  if (!epubRendition.value) return;

  try {
    console.log("🎨 Applying settings:", {
      fontSize: props.fontSize,
      fontFamily: props.fontFamily,
      theme: props.theme,
    });

    // Apply font settings
    epubRendition.value.themes.fontSize(`${props.fontSize}px`);
    epubRendition.value.themes.font(props.fontFamily);

    // Apply theme settings to EPUB content
    let bgColor, textColor;
    switch (props.theme) {
      case "dark":
        bgColor = "#1a1a1a";
        textColor = "#e0e0e0";
        break;
      case "sepia":
        bgColor = "#f4f1e8";
        textColor = "#5c4b37";
        break;
      case "light":
      default:
        bgColor = "#ffffff";
        textColor = "#333333";
        break;
    }

    // Apply to EPUB.js
    epubRendition.value.themes.override("color", textColor);
    epubRendition.value.themes.override("background-color", bgColor);

    // Apply to container CSS variables
    if (epubViewer.value) {
      epubViewer.value.style.setProperty("--reader-bg-color", bgColor);
      epubViewer.value.style.background = bgColor;
    }

    console.log("✅ Settings applied successfully");
  } catch (error) {
    console.error("❌ Error applying settings:", error);
  }
};

// Watchers
watch(
  () => [props.fileUrl, props.bookData?.id || props.bookData?._id],
  async (newValues, oldValues) => {
    try {
      // Safely destructure with fallbacks
      const [newUrl, newBookId] = newValues || [null, null];
      const [oldUrl, oldBookId] = oldValues || [null, null];

      console.log("📁 Reader watcher triggered:", {
        oldUrl,
        newUrl,
        oldBookId,
        newBookId,
        isInitializing: isInitializing.value,
        bookData: props.bookData,
      });

      // Chỉ khởi tạo khi có đủ cả fileUrl và bookId
      if (newUrl && newBookId && !isInitializing.value) {
        const shouldInitialize = newUrl !== oldUrl || newBookId !== oldBookId;

        if (shouldInitialize) {
          console.log(
            "🔄 Loading new content from watcher (both URL and bookId ready)..."
          );

          // Wait for DOM to be ready
          await nextTick();

          // Add delay để tránh multiple calls và DOM conflicts
          setTimeout(() => {
            if (!isInitializing.value && epubViewer.value) {
              initializeReader();
            }
          }, 200);
        }
      } else {
        console.log(
          "⏳ Waiting for both fileUrl and bookId to be available...",
          {
            hasUrl: !!newUrl,
            hasBookId: !!newBookId,
            isInitializing: isInitializing.value,
            bookData: props.bookData,
          }
        );
      }
    } catch (error) {
      console.error("❌ Watcher error:", error);
    }
  },
  { immediate: true }
);

// Watch for settings changes
watch(
  () => [props.fontSize, props.fontFamily, props.theme],
  () => {
    try {
      console.log("🎨 Settings changed, applying...");
      applySettings();
    } catch (error) {
      console.error("❌ Settings watch error:", error);
    }
  }
);

// Watch for notes changes to update highlights
watch(
  () => props.notes,
  (newNotes, oldNotes) => {
    try {
      const newLength = newNotes?.length || 0;
      const oldLength = oldNotes?.length || 0;

      console.log(`📝 Notes changed: ${oldLength} → ${newLength}`);

      if (epubRendition.value) {
        // Enhanced debounced refresh with longer delay to prevent rapid refreshes
        clearTimeout(watch.timeoutId);
        watch.timeoutId = setTimeout(() => {
          console.log("🔄 Debounced refresh triggered");
          refreshHighlights();
        }, 250); // Increased delay to 250ms
      }
    } catch (error) {
      console.error("❌ Notes watch error:", error);
    }
  },
  {
    deep: true,
    flush: "post", // Wait for DOM updates before triggering
  }
);

// Lifecycle
onMounted(async () => {
  try {
    console.log("🔧 ReaderContent mounted");
    console.log("📋 Props:", {
      fileUrl: props.fileUrl,
      isLoading: props.isLoading,
    });

    // Listen for fullscreen changes
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    console.log("⏳ Watcher with immediate:true will handle initialization...");
  } catch (error) {
    console.error("❌ Mount error:", error);
  }
});

const handleFullscreenChange = () => {
  try {
    if (document.fullscreenElement) {
      console.log("📺 Entered fullscreen mode");
      // Show notification when entering fullscreen
      showFullscreenNotification.value = true;

      setTimeout(() => {
        showFullscreenNotification.value = false;
      }, 4000);
    } else {
      console.log("📺 Exited fullscreen mode");
      // Hide notification when exiting fullscreen
      showFullscreenNotification.value = false;
    }
  } catch (error) {
    console.error("❌ Fullscreen change error:", error);
  }
};

onBeforeUnmount(() => {
  try {
    cleanup();

    // Remove fullscreen event listener
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  } catch (error) {
    console.error("❌ Unmount error:", error);
  }
});

// Expose public methods
defineExpose({
  getCurrentLocation,
  goToLocation,
  goToChapter,
  navigateToTocItem,
  loadContent,
  nextPage,
  previousPage,
  toggleFullscreen,
  isFullscreen: () => !!document.fullscreenElement,
  refreshHighlights,
  searchInBook,
  clearSearch,
});
</script>

<style scoped src="./ReaderContent.css"></style>
