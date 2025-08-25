<template>
  <div class="add-book">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="page-title">Thêm sách mới</h1>
      <router-link to="/admin/books" class="btn btn-outline-success">
        Kho sách
      </router-link>
    </div>

    <div class="card shadow">
      <div class="card-body">
        <form
          @submit.prevent="submitForm"
          enctype="multipart/form-data"
          novalidate
        >
          <div class="row">
            <!-- Cột bên trái -->
            <div class="col-md-8">
              <!-- Thông tin cơ bản -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">Thông tin cơ bản</h5>
                </div>
                <div class="card-body">
                  <!-- Tiêu đề sách -->
                  <div class="mb-3">
                    <label for="title" class="form-label">
                      Tiêu đề sách <span class="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      class="form-control"
                      id="title"
                      v-model="formData.title"
                      required
                      maxlength="200"
                      :class="{ 'is-invalid': errors.title }"
                    />
                    <div class="invalid-feedback" v-if="errors.title">
                      {{ errors.title }}
                    </div>
                    <small class="form-text text-muted">
                      Nhập tiêu đề sách, tối đa 200 ký tự.
                    </small>
                  </div>

                  <!-- Danh mục -->
                  <div class="mb-3">
                    <label for="category" class="form-label">
                      Danh mục <span class="text-danger">*</span>
                    </label>
                    <select
                      class="form-select"
                      id="category"
                      v-model="formData.category"
                      required
                      :class="{ 'is-invalid': errors.category }"
                    >
                      <option value="" disabled selected>
                        -- Chọn danh mục --
                      </option>
                      <option
                        v-for="category in categories"
                        :key="category._id"
                        :value="category._id"
                      >
                        {{ category.name }}
                      </option>
                    </select>
                    <div class="invalid-feedback" v-if="errors.category">
                      {{ errors.category }}
                    </div>
                  </div>

                  <!-- Tác giả - phiên bản mới với Multiselect -->
                  <div class="mb-3">
                    <label class="form-label">
                      Tác giả <span class="text-danger">*</span>
                    </label>
                    <div :class="{ 'is-invalid': errors.authors }">
                      <VueMultiselect
                        v-model="selectedAuthors"
                        :options="authors"
                        :multiple="true"
                        :close-on-select="false"
                        :clear-on-select="false"
                        placeholder="Chọn tác giả"
                        label="name"
                        track-by="_id"
                        :searchable="true"
                        :internal-search="true"
                        :allow-empty="false"
                        :max-height="200"
                        :show-labels="false"
                        :hide-selected="false"
                      >
                        <template #selection="{ values, search, isOpen }">
                          <div
                            class="multiselect__tags-wrap"
                            v-if="values.length && !isOpen"
                          >
                            <div
                              v-if="values.length <= 3"
                              class="selected-authors"
                            >
                              <span
                                v-for="(author, i) in values"
                                :key="author._id"
                                class="badge bg-light text-dark p-2 me-2 mb-2"
                              >
                                {{ author.name }}
                                <button
                                  type="button"
                                  class="btn-close btn-close-sm ms-2"
                                  @click.stop="removeAuthor(author)"
                                ></button>
                              </span>
                            </div>
                            <span
                              v-if="values.length > 3"
                              class="multiselect__tag"
                            >
                              {{ values[0].name }} và
                              {{ values.length - 1 }} tác giả khác
                            </span>
                          </div>
                          <div
                            class="multiselect__spinner"
                            v-show="isLoadingAuthors"
                          ></div>
                          <input
                            class="multiselect__input"
                            v-if="isOpen"
                            type="text"
                            @keyup="search.query = $event.target.value"
                          />
                        </template>
                        <template #option="{ option }">
                          <div class="option__desc">
                            <span class="option__title">{{ option.name }}</span>
                          </div>
                        </template>
                        <template #noOptions>
                          Không tìm thấy tác giả nào
                        </template>
                      </VueMultiselect>
                    </div>
                    <div class="invalid-feedback d-block" v-if="errors.authors">
                      {{ errors.authors }}
                    </div>
                    <small class="form-text text-muted">
                      Chọn ít nhất một tác giả. Nhập tên để tìm kiếm nhanh.
                    </small>
                  </div>

                  <!-- Mô tả -->
                  <div class="mb-3">
                    <label for="description" class="form-label">
                      Mô tả <span class="text-danger">*</span>
                    </label>
                    <div
                      class="quill-editor-container"
                      :class="{ 'is-invalid': errors.description }"
                    >
                      <QuillEditor
                        v-model:content="formData.description"
                        contentType="html"
                        theme="snow"
                        :toolbar="[
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          ['clean'],
                        ]"
                      />
                    </div>
                    <div class="invalid-feedback" v-if="errors.description">
                      {{ errors.description }}
                    </div>
                    <small class="form-text text-muted">
                      Mô tả chi tiết về nội dung sách là bắt buộc. Bạn có thể
                      định dạng đơn giản như in đậm, nghiêng và tạo danh sách.
                    </small>
                  </div>
                </div>
              </div>

              <!-- Thông tin chi tiết -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">Thông tin chi tiết</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <!-- Nhà xuất bản -->
                    <div class="col-md-6 mb-3">
                      <label for="publisher" class="form-label"
                        >Nhà xuất bản</label
                      >
                      <input
                        type="text"
                        class="form-control"
                        id="publisher"
                        v-model="formData.publisher"
                      />
                    </div>

                    <!-- Năm xuất bản -->
                    <div class="col-md-6 mb-3">
                      <label for="publicationYear" class="form-label"
                        >Năm xuất bản</label
                      >
                      <input
                        type="number"
                        class="form-control"
                        id="publicationYear"
                        v-model="formData.publicationYear"
                        min="1000"
                        :max="currentYear"
                        :class="{ 'is-invalid': errors.publicationYear }"
                      />
                      <div
                        class="invalid-feedback"
                        v-if="errors.publicationYear"
                      >
                        {{ errors.publicationYear }}
                      </div>
                    </div>

                    <!-- Kích thước -->
                    <div class="col-md-6 mb-3">
                      <label for="dimensions" class="form-label"
                        >Kích thước</label
                      >
                      <input
                        type="text"
                        class="form-control"
                        id="dimensions"
                        v-model="formData.dimensions"
                        placeholder="Ví dụ: 14x20 cm"
                      />
                    </div>

                    <!-- Số trang -->
                    <div class="col-md-6 mb-3">
                      <label for="pages" class="form-label">Số trang</label>
                      <input
                        type="number"
                        class="form-control"
                        id="pages"
                        v-model="formData.pages"
                        min="1"
                        :class="{ 'is-invalid': errors.pages }"
                      />
                      <div class="invalid-feedback" v-if="errors.pages">
                        {{ errors.pages }}
                      </div>
                    </div>

                    <!-- ISBN -->
                    <div class="col-md-6 mb-3">
                      <label for="isbn" class="form-label">ISBN</label>
                      <input
                        type="text"
                        class="form-control"
                        id="isbn"
                        v-model="formData.isbn"
                      />
                    </div>

                    <!-- Ngôn ngữ -->
                    <div class="col-md-6 mb-3">
                      <label for="language" class="form-label">Ngôn ngữ</label>
                      <input
                        type="text"
                        class="form-control"
                        id="language"
                        v-model="formData.language"
                        placeholder="Tiếng Việt"
                      />
                    </div>

                    <!-- Loại tài liệu -->
                    <div class="col-md-12 mb-3">
                      <label class="form-label">Loại tài liệu</label>
                      <div class="d-flex">
                        <div class="form-check me-4">
                          <input
                            class="form-check-input"
                            type="radio"
                            id="textbook"
                            value="textbook"
                            v-model="formData.documentType"
                          />
                          <label class="form-check-label" for="textbook">
                            Giáo trình
                          </label>
                        </div>
                        <div class="form-check">
                          <input
                            class="form-check-input"
                            type="radio"
                            id="other"
                            value="other"
                            v-model="formData.documentType"
                          />
                          <label class="form-check-label" for="other">
                            Khác
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Thông tin ebook và giá bán -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">Thông tin Ebook & Giá bán</h5>
                </div>
                <div class="card-body">
                  <!-- File ebook -->
                  <div class="mb-3">
                    <label class="form-label">
                      File ebook <span class="text-danger">*</span>
                    </label>
                    <div class="form-text text-muted mb-2">
                      Tải lên ít nhất một file (EPUB hoặc PDF), hoặc cả hai định
                      dạng.
                    </div>

                    <!-- File EPUB -->
                    <div class="mb-2">
                      <label for="epubFile" class="form-label">
                        File EPUB
                      </label>
                      <input
                        type="file"
                        class="form-control"
                        id="epubFile"
                        @change="handleEpubFileChange"
                        accept=".epub,application/epub+zip"
                        :class="{ 'is-invalid': errors.epubFile }"
                      />
                      <div class="invalid-feedback" v-if="errors.epubFile">
                        {{ errors.epubFile }}
                      </div>
                      <small class="form-text text-muted">
                        Tệp EPUB tối đa 100MB.
                      </small>
                    </div>

                    <!-- File PDF -->
                    <div class="mb-2">
                      <label for="pdfFile" class="form-label"> File PDF </label>
                      <input
                        type="file"
                        class="form-control"
                        id="pdfFile"
                        @change="handlePdfFileChange"
                        accept=".pdf,application/pdf"
                        :class="{ 'is-invalid': errors.pdfFile }"
                      />
                      <div class="invalid-feedback" v-if="errors.pdfFile">
                        {{ errors.pdfFile }}
                      </div>
                      <small class="form-text text-muted">
                        Tệp PDF tối đa 100MB.
                      </small>
                    </div>

                    <!-- Thông báo lỗi chung -->
                    <div
                      class="invalid-feedback d-block"
                      v-if="errors.bookFiles"
                    >
                      {{ errors.bookFiles }}
                    </div>
                  </div>

                  <!-- Tùy chọn cho thuê/mua ebook -->
                  <div class="mb-3">
                    <label class="form-label">
                      Tùy chọn thuê/mua <span class="text-danger">*</span>
                    </label>
                    <div class="border p-2 rounded">
                      <div
                        v-for="(option, index) in formData.ebookOptions"
                        :key="index"
                        class="d-flex mb-2 align-items-center"
                      >
                        <select
                          class="form-select me-2"
                          v-model="option.duration"
                          style="width: 150px"
                          @change="checkDuplicateDurations"
                          :class="{
                            'is-invalid': hasDuplicateDuration(
                              option.duration,
                              index
                            ),
                          }"
                        >
                          <option value="1_month">1 tháng</option>
                          <option value="3_months">3 tháng</option>
                          <option value="6_months">6 tháng</option>
                          <option value="permanent">Vĩnh viễn</option>
                        </select>
                        <div class="input-group me-2" style="max-width: 200px">
                          <span class="input-group-text">₫</span>
                          <input
                            type="number"
                            class="form-control"
                            v-model="option.price"
                            min="0"
                            placeholder="Giá"
                          />
                        </div>
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-sm"
                          @click="removeEbookOption(index)"
                          :disabled="formData.ebookOptions.length === 1"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                        <div
                          class="invalid-feedback d-block"
                          v-if="hasDuplicateDuration(option.duration, index)"
                        >
                          Thời hạn này đã tồn tại, vui lòng chọn thời hạn khác.
                        </div>
                      </div>
                      <div class="mt-2">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          @click="addEbookOption"
                          :disabled="formData.ebookOptions.length >= 4"
                        >
                          <i class="fas fa-plus me-1"></i> Thêm tùy chọn
                        </button>
                        <small
                          class="text-muted ms-2"
                          v-if="formData.ebookOptions.length >= 4"
                        >
                          Tối đa 4 tùy chọn.
                        </small>
                      </div>
                      <div
                        class="invalid-feedback d-block"
                        v-if="errors.ebookOptions"
                      >
                        {{ errors.ebookOptions }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cột bên phải -->
            <div class="col-md-4">
              <!-- Ảnh bìa sách -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">Ảnh bìa sách</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label for="coverImages" class="form-label">
                      Tải lên ảnh bìa
                      <small class="text-muted">(Tối đa 5 ảnh)</small>
                    </label>
                    <input
                      type="file"
                      class="form-control"
                      id="coverImages"
                      @change="handleCoverImagesChange"
                      accept="image/*"
                      multiple
                      :class="{ 'is-invalid': errors.coverImages }"
                    />
                    <div class="invalid-feedback" v-if="errors.coverImages">
                      {{ errors.coverImages }}
                    </div>
                    <small class="form-text text-muted">
                      Chọn tối đa 5 ảnh, mỗi ảnh không quá 2MB.
                    </small>
                  </div>

                  <!-- Xem trước ảnh đã chọn -->
                  <div
                    class="image-preview-container mt-3"
                    v-if="coverImagePreviews.length > 0"
                  >
                    <h6 class="mb-2">Xem trước:</h6>
                    <div class="d-flex flex-wrap">
                      <div
                        v-for="(preview, index) in coverImagePreviews"
                        :key="index"
                        class="position-relative me-2 mb-2"
                      >
                        <img
                          :src="preview"
                          class="img-thumbnail"
                          style="width: 80px; height: 100px; object-fit: cover"
                        />
                        <button
                          type="button"
                          class="btn btn-sm btn-danger position-absolute top-0 end-0 p-0"
                          style="width: 20px; height: 20px; border-radius: 50%"
                          @click="removeCoverImage(index)"
                        >
                          <i class="fas fa-times fa-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Trạng thái xuất bản -->
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="card-title mb-0">Trạng thái</h5>
                </div>
                <div class="card-body">
                  <div class="form-check form-switch mb-3">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="active"
                      v-model="formData.active"
                    />
                    <label class="form-check-label" for="active">
                      Kích hoạt và hiển thị ngay
                    </label>
                  </div>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="featured"
                      v-model="formData.featured"
                    />
                    <label class="form-check-label" for="featured">
                      Đánh dấu là sách nổi bật
                    </label>
                  </div>
                </div>
              </div>

              <!-- Nút lưu -->
              <div class="d-grid gap-2">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  :disabled="isSubmitting"
                >
                  <span
                    v-if="isSubmitting"
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Thêm sách mới
                </button>
                <router-link
                  to="/admin/books"
                  class="btn btn-outline-secondary"
                >
                  Hủy và quay lại
                </router-link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import bookService from "../../../services/bookService";
import categoryService from "../../../services/categoryService";
import authorService from "../../../services/authorService";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import VueMultiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";

const router = useRouter();
const toast = useToast();

// Biến trạng thái
const isSubmitting = ref(false);
const categories = ref([]);
const authors = ref([]);
const coverImagePreviews = ref([]);
const coverImageFiles = ref([]);
const epubFile = ref(null);
const pdfFile = ref(null);
const currentYear = new Date().getFullYear();
// Thêm biến isLoadingAuthors để thay thế loading
const isLoadingAuthors = ref(false);

// Form data - bỏ bookType và paperBookInfo
const formData = reactive({
  title: "",
  category: "",
  authors: [],
  publisher: "",
  dimensions: "",
  publicationYear: "",
  isbn: "",
  language: "Tiếng Việt",
  description: "",
  documentType: "other",
  pages: "",
  ebookOptions: [{ duration: "1_month", price: 0 }],
  active: true,
  featured: false,
});

// Object lưu lỗi validation
const errors = reactive({});

// Biến cho multiselect tác giả
const selectedAuthors = ref([]);

// Phương thức thêm/xóa tùy chọn ebook
const addEbookOption = () => {
  formData.ebookOptions.push({ duration: "1_month", price: 0 });
};

const removeEbookOption = (index) => {
  formData.ebookOptions.splice(index, 1);
};

// Xử lý khi chọn file EPUB
const handleEpubFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Kiểm tra định dạng file
  const allowedTypes = ["application/epub+zip"];
  if (
    !allowedTypes.includes(file.type) &&
    !file.name.toLowerCase().endsWith(".epub")
  ) {
    errors.epubFile = "Chỉ chấp nhận file EPUB";
    event.target.value = "";
    return;
  }

  // Kiểm tra kích thước file (tối đa 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    errors.epubFile = "Kích thước file không được vượt quá 100MB";
    event.target.value = "";
    return;
  }

  epubFile.value = file;
  delete errors.epubFile;
  delete errors.bookFiles;
};

// Xử lý khi chọn file PDF
const handlePdfFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Kiểm tra định dạng file
  const allowedTypes = ["application/pdf"];
  if (
    !allowedTypes.includes(file.type) &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    errors.pdfFile = "Chỉ chấp nhận file PDF";
    event.target.value = "";
    return;
  }

  // Kiểm tra kích thước file (tối đa 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    errors.pdfFile = "Kích thước file không được vượt quá 100MB";
    event.target.value = "";
    return;
  }

  pdfFile.value = file;
  delete errors.pdfFile;
  delete errors.bookFiles;
};

// Xử lý khi chọn ảnh bìa
const handleCoverImagesChange = (event) => {
  const files = Array.from(event.target.files);

  // Kiểm tra số lượng ảnh (tối đa 5)
  if (coverImageFiles.value.length + files.length > 5) {
    errors.coverImages = "Bạn chỉ có thể tải lên tối đa 5 ảnh";
    return;
  }

  // Kiểm tra định dạng và kích thước từng ảnh
  for (const file of files) {
    // Kiểm tra có phải ảnh không
    if (!file.type.startsWith("image/")) {
      errors.coverImages = "Chỉ chấp nhận file hình ảnh";
      return;
    }

    // Kiểm tra kích thước (tối đa 2MB mỗi ảnh)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      errors.coverImages = "Mỗi ảnh không được vượt quá 2MB";
      return;
    }

    // Thêm vào danh sách file ảnh
    coverImageFiles.value.push(file);

    // Tạo preview
    const reader = new FileReader();
    reader.onload = (e) => {
      coverImagePreviews.value.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  delete errors.coverImages;
};

// Xóa ảnh bìa đã chọn
const removeCoverImage = (index) => {
  coverImagePreviews.value.splice(index, 1);
  coverImageFiles.value.splice(index, 1);
};

// Xóa tác giả đã chọn
const removeAuthor = (author) => {
  selectedAuthors.value = selectedAuthors.value.filter(
    (a) => a._id !== author._id
  );
};

// Watch selectedAuthors để cập nhật formData.authors
watch(
  selectedAuthors,
  (newVal) => {
    formData.authors = newVal.map((author) => author._id);
  },
  { deep: true }
);

// Kiểm tra trùng lặp thời hạn
const hasDuplicateDuration = (duration, currentIndex) => {
  return formData.ebookOptions.some(
    (option, index) => option.duration === duration && index !== currentIndex
  );
};

// Kiểm tra trùng lặp sau khi thay đổi
const checkDuplicateDurations = () => {
  const durations = new Set();
  let hasDuplicate = false;

  formData.ebookOptions.forEach((option) => {
    if (durations.has(option.duration)) {
      hasDuplicate = true;
    } else {
      durations.add(option.duration);
    }
  });

  if (hasDuplicate) {
    errors.ebookOptions = "Không thể có hai tùy chọn cùng thời hạn";
  } else {
    delete errors.ebookOptions;
  }

  return !hasDuplicate;
};

// Validate form trước khi submit
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Tiêu đề sách
  if (!formData.title || formData.title.trim() === "") {
    errors.title = "Vui lòng nhập tiêu đề sách";
  } else if (formData.title.length > 200) {
    errors.title = "Tiêu đề sách không được quá 200 ký tự";
  }

  // Danh mục
  if (!formData.category) {
    errors.category = "Vui lòng chọn danh mục sách";
  }

  // Tác giả
  if (!formData.authors.length) {
    errors.authors = "Vui lòng chọn ít nhất một tác giả";
  }

  // Mô tả - bắt buộc
  if (
    !formData.description ||
    formData.description.trim() === "" ||
    formData.description.trim() === "<p></p>"
  ) {
    errors.description = "Vui lòng nhập mô tả sách";
  } else if (formData.description.length > 100000) {
    errors.description = "Mô tả sách không được quá 10000 ký tự";
  }

  // Năm xuất bản
  if (formData.publicationYear) {
    const year = parseInt(formData.publicationYear);
    if (isNaN(year) || year < 1000 || year > currentYear) {
      errors.publicationYear = `Năm xuất bản phải là số từ 1000 đến ${currentYear}`;
    }
  }

  // Số trang
  if (formData.pages) {
    const pages = parseInt(formData.pages);
    if (isNaN(pages) || pages < 1) {
      errors.pages = "Số trang phải là số dương";
    }
  }

  // Validate file ebook - bắt buộc ít nhất 1 file
  if (!epubFile.value && !pdfFile.value) {
    errors.bookFiles =
      "Vui lòng tải lên ít nhất một file ebook (EPUB hoặc PDF)";
  }

  // Validate tùy chọn ebook
  if (!formData.ebookOptions.length) {
    errors.ebookOptions = "Vui lòng thêm ít nhất một tùy chọn giá";
  }

  // Kiểm tra trùng lặp thời hạn
  if (!checkDuplicateDurations()) {
    errors.ebookOptions = "Không thể có hai tùy chọn cùng thời hạn";
  }

  return Object.keys(errors).length === 0;
};

// Gửi form - bỏ logic bookType và paperBookInfo
const submitForm = async () => {
  if (!validateForm()) {
    toast.error("Vui lòng kiểm tra lại thông tin sách");
    return;
  }

  isSubmitting.value = true;

  try {
    // Chuẩn bị form data để gửi lên server
    const submitData = new FormData();

    // Thêm các trường thông tin cơ bản
    submitData.append("title", formData.title);
    submitData.append("category", formData.category);
    submitData.append("authors", JSON.stringify(formData.authors));

    if (formData.publisher) submitData.append("publisher", formData.publisher);
    if (formData.dimensions)
      submitData.append("dimensions", formData.dimensions);
    if (formData.publicationYear)
      submitData.append("publicationYear", formData.publicationYear);
    if (formData.isbn) submitData.append("isbn", formData.isbn);
    if (formData.language) submitData.append("language", formData.language);
    if (formData.description)
      submitData.append("description", formData.description);
    if (formData.pages) submitData.append("pages", formData.pages);

    submitData.append("documentType", formData.documentType);
    submitData.append("active", formData.active);
    submitData.append("featured", formData.featured);

    // Thêm thông tin ebook
    submitData.append("ebookOptions", JSON.stringify(formData.ebookOptions));

    // Thêm file ebook nếu có
    if (epubFile.value) submitData.append("epubFile", epubFile.value);
    if (pdfFile.value) submitData.append("pdfFile", pdfFile.value);

    // Thêm ảnh bìa sách nếu có
    coverImageFiles.value.forEach((file) => {
      submitData.append("coverImages", file);
    });

    // Gửi yêu cầu API
    const response = await bookService.createBook(submitData);

    if (response.success) {
      toast.success("Thêm sách mới thành công!");
      router.push("/admin/books");
    } else {
      toast.error(response.message || "Thêm sách thất bại.");
    }
  } catch (error) {
    console.error("Lỗi khi thêm sách:", error);

    if (error.response?.data?.message) {
      toast.error(`Lỗi: ${error.response.data.message}`);
    } else {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Lấy danh sách danh mục và tác giả khi component được mount
onMounted(async () => {
  try {
    isLoadingAuthors.value = true;
    // Lấy danh sách danh mục
    const categoryResponse = await categoryService.getCategoriesList();
    if (categoryResponse.success) {
      categories.value = categoryResponse.data || [];
    }

    // Lấy danh sách tác giả
    const authorResponse = await authorService.getAuthorsList();
    if (authorResponse.success) {
      authors.value = authorResponse.data || [];
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu:", error);
    console.error("Lỗi khi lấy danh mục hoặc tác giả:", error);
    toast.error("Không thể tải danh sách danh mục và tác giả");
  } finally {
    isLoadingAuthors.value = false;
  }
});
</script>

<style scoped>
.page-title {
  color: #3c4b64;
  font-weight: 600;
}

.card {
  border: none;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.card-header {
  background-color: #f8f9fc;
  border-bottom: 1px solid #e3e6f0;
  padding: 1rem;
}

.card-body {
  padding: 1.25rem;
}

.form-label {
  font-weight: 500;
}

/* Tùy chỉnh style cho các khu vực của form */
.border {
  border-color: #e3e6f0 !important;
}

/* Style cho xem trước ảnh */
.image-preview-container {
  background-color: #f8f9fc;
  padding: 0.75rem;
  border-radius: 0.25rem;
}

/* Style cho trình soạn thảo văn bản */
:deep(.ql-toolbar.ql-snow),
:deep(.ql-container.ql-snow) {
  border-color: #ced4da;
}

:deep(.ql-container) {
  min-height: 200px;
  background-color: #ffffff;
}

.quill-editor-container.is-invalid :deep(.ql-toolbar.ql-snow),
.quill-editor-container.is-invalid :deep(.ql-container.ql-snow) {
  border-color: #dc3545;
}

/* Tùy chỉnh style cho Vue Multiselect */
:deep(.multiselect) {
  min-height: 40px;
  border-radius: 0.25rem;
}

:deep(.multiselect__tags) {
  min-height: 40px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: #fff;
}

:deep(.multiselect__tag) {
  background-color: #3c4b64;
  color: white;
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Cải thiện nút xóa tag */
:deep(.multiselect__tag-icon) {
  background-color: rgba(0, 0, 0, 0.1);
  color: white;
  border-radius: 50%;
  cursor: pointer;
}

:deep(.multiselect__tag-icon:after) {
  content: "×";
  color: white;
  font-size: 14px;
  font-weight: bold;
}

:deep(.multiselect__tag-icon:hover) {
  background-color: rgba(0, 0, 0, 0.3);
}

:deep(.multiselect__tag-icon:hover:after) {
  color: white;
}

:deep(.multiselect__input) {
  border: none;
  padding: 0;
  margin-bottom: 0;
  vertical-align: top;
}

:deep(.multiselect__placeholder) {
  color: #6c757d;
  padding-top: 0;
  margin-bottom: 0;
}

:deep(.multiselect__content-wrapper) {
  border-color: #ced4da;
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

:deep(.multiselect__option--highlight) {
  background-color: #3c4b64;
}

:deep(.multiselect--active) {
  z-index: 100;
}

:deep(.multiselect__option) {
  padding: 10px 12px;
}

:deep(.multiselect__option--selected) {
  background-color: rgba(60, 75, 100, 0.1);
  color: #3c4b64;
  font-weight: bold;
}

:deep(.multiselect__option--selected.multiselect__option--highlight) {
  background-color: #dc3545;
  color: white;
}

:deep(.multiselect__option--selected.multiselect__option--highlight:after) {
  content: "Bỏ chọn";
  color: white;
}

/* Style cho tag tác giả */
.selected-authors {
  display: flex;
  flex-wrap: wrap;
}

.btn-close-sm {
  font-size: 0.5rem;
  padding: 0.25rem;
}

/* Các style khác */
</style>
