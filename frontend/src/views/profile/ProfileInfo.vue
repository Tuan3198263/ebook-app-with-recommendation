<template>
  <div class="profile-info">
    <div class="card-header">
      <h5 class="mb-0"><i class="fas fa-user me-2"></i>Thông tin cá nhân</h5>
    </div>

    <div v-if="loading" class="card-body text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-2">Đang tải thông tin cá nhân...</p>
    </div>

    <div v-else class="card-body">
      <div class="row">
        <!-- Phần ảnh đại diện -->
        <div class="col-md-4 mb-4 mb-md-0">
          <div class="text-center">
            <h6 class="mb-3">Ảnh đại diện</h6>
            <div class="avatar-wrapper mb-3">
              <img
                :src="formData.avatar || defaultAvatar"
                alt="Avatar"
                class="avatar-img"
              />
              <div class="avatar-edit">
                <label for="avatarUpload" class="avatar-edit-icon">
                  <i class="fas fa-camera"></i>
                </label>
                <input
                  type="file"
                  id="avatarUpload"
                  @change="handleAvatarChange"
                  accept="image/jpeg, image/png, image/gif, image/webp"
                  class="d-none"
                />
              </div>
            </div>

            <div class="avatar-actions">
              <div v-if="newAvatarFile" class="mb-3">
                <button
                  @click="confirmUpdateAvatar"
                  class="btn btn-sm btn-primary"
                  :disabled="isAvatarUploading"
                >
                  <span
                    v-if="isAvatarUploading"
                    class="spinner-border spinner-border-sm me-1"
                  ></span>
                  <i v-else class="fas fa-check me-1"></i>
                  Cập nhật ảnh đại diện
                </button>
                <button
                  @click="cancelAvatarUpdate"
                  class="btn btn-sm btn-outline-secondary ms-2"
                >
                  Hủy
                </button>
              </div>
              <div class="small text-muted mt-2">
                <p class="mb-1">* Kích thước tối đa: 2MB</p>
                <p class="mb-0">
                  * Định dạng hỗ trợ: JPEG, JPG, PNG, GIF, WEBP
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Phần thông tin cá nhân -->
        <div class="col-md-8">
          <form @submit.prevent="saveProfile">
            <!-- Họ và tên -->
            <div class="mb-3">
              <label for="fullName" class="form-label">Họ và tên</label>
              <input
                type="text"
                class="form-control"
                id="fullName"
                v-model="formData.name"
                :class="{ 'is-invalid': errors.name }"
                required
              />
              <div v-if="errors.name" class="invalid-feedback">
                {{ errors.name }}
              </div>
            </div>

            <!-- Email -->
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                type="email"
                class="form-control-plaintext"
                id="email"
                v-model="formData.email"
                disabled
                readonly
              />
            </div>

            <!-- Ngày sinh -->
            <div class="mb-3">
              <label for="dateOfBirth" class="form-label">Ngày sinh</label>
              <input
                type="date"
                class="form-control"
                id="dateOfBirth"
                v-model="formData.dateOfBirth"
              />
            </div>

            <!-- Khoa -->
            <div class="mb-3">
              <label for="faculty" class="form-label">Khoa/Trường</label>
              <div class="dropdown-search">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Tìm kiếm khoa..."
                    v-model="facultySearchTerm"
                    @focus="showFacultyDropdown = true"
                    @input="filterFaculties"
                  />
                  <button
                    class="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    @click="toggleFacultyDropdown"
                  >
                    <i class="fas fa-caret-down"></i>
                  </button>
                </div>
                <div
                  class="dropdown-menu w-100"
                  :class="{ show: showFacultyDropdown }"
                >
                  <div class="dropdown-search-container">
                    <div v-if="isLoadingFaculties" class="text-center p-2">
                      <div
                        class="spinner-border spinner-border-sm text-primary"
                        role="status"
                      >
                        <span class="visually-hidden">Đang tải...</span>
                      </div>
                      <span class="ms-2">Đang tải danh sách khoa...</span>
                    </div>
                    <div
                      v-else-if="filteredFaculties.length === 0"
                      class="dropdown-item disabled"
                    >
                      Không tìm thấy khoa phù hợp
                    </div>
                    <template v-else>
                      <a
                        v-for="faculty in filteredFaculties"
                        :key="faculty.id"
                        class="dropdown-item"
                        href="#"
                        @click.prevent="selectFaculty(faculty)"
                      >
                        {{ faculty.name }}
                      </a>
                    </template>
                  </div>
                </div>
              </div>
              <div v-if="formData.faculty" class="selected-item mt-2">
                <span class="badge bg-light text-dark p-2">
                  {{ formData.faculty }}
                  <button
                    type="button"
                    class="btn-close btn-close-sm ms-2"
                    @click="clearFaculty"
                  ></button>
                </span>
              </div>
            </div>

            <!-- Ngành học -->
            <div class="mb-3">
              <label for="major" class="form-label">Ngành học</label>
              <div
                class="dropdown-search"
                :class="{ disabled: !formData.faculty }"
              >
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Tìm kiếm ngành học..."
                    v-model="majorSearchTerm"
                    @focus="showMajorDropdown = true"
                    @input="filterMajors"
                    :disabled="!formData.faculty"
                  />
                  <button
                    class="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    @click="toggleMajorDropdown"
                    :disabled="!formData.faculty"
                  >
                    <i class="fas fa-caret-down"></i>
                  </button>
                </div>
                <div
                  class="dropdown-menu w-100"
                  :class="{ show: showMajorDropdown }"
                >
                  <div class="dropdown-search-container">
                    <div v-if="isLoadingMajors" class="text-center p-2">
                      <div
                        class="spinner-border spinner-border-sm text-primary"
                        role="status"
                      >
                        <span class="visually-hidden">Đang tải...</span>
                      </div>
                      <span class="ms-2">Đang tải danh sách ngành...</span>
                    </div>
                    <div
                      v-else-if="!formData.faculty"
                      class="dropdown-item disabled"
                    >
                      Vui lòng chọn khoa trước
                    </div>
                    <div
                      v-else-if="filteredMajors.length === 0"
                      class="dropdown-item disabled"
                    >
                      Không tìm thấy ngành phù hợp
                    </div>
                    <template v-else>
                      <a
                        v-for="major in filteredMajors"
                        :key="major.id"
                        class="dropdown-item"
                        href="#"
                        @click.prevent="selectMajor(major)"
                      >
                        {{ major.name }}
                      </a>
                    </template>
                  </div>
                </div>
              </div>
              <div v-if="formData.major" class="selected-item mt-2">
                <span class="badge bg-light text-dark p-2">
                  {{ formData.major }}
                  <button
                    type="button"
                    class="btn-close btn-close-sm ms-2"
                    @click="clearMajor"
                  ></button>
                </span>
              </div>
              <div v-if="!formData.faculty" class="form-text text-muted">
                Chọn khoa trước khi chọn ngành học
              </div>
            </div>

            <!-- Vai trò -->
            <div class="mb-3">
              <label for="role" class="form-label">Vai trò</label>
              <input
                type="text"
                class="form-control-plaintext"
                id="role"
                :value="getRoleDisplay(formData.role)"
                disabled
                readonly
              />
            </div>

            <!-- Nút lưu -->
            <div class="mt-4 text-end">
              <button
                type="submit"
                class="btn btn-success px-4"
                :disabled="isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                <i v-else class="fas fa-save me-1"></i> Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, watch } from "vue";
import { useToast } from "vue-toastification";
import authService from "../../services/authService";
import academicService from "../../services/academicService";
import Swal from "sweetalert2";
import mitt from "mitt";

// Tạo event emitter cho toàn ứng dụng nếu chưa có
const emitter = window.emitter || (window.emitter = mitt());

// Khởi tạo các biến cơ bản
const toast = useToast();
const isSubmitting = ref(false);
const isAvatarUploading = ref(false);
const loading = ref(true);
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/6596/6596121.png";
const newAvatarFile = ref(null);

// Dữ liệu người dùng và lỗi
const formData = ref({
  name: "",
  email: "",
  avatar: "",
  dateOfBirth: "",
  faculty: "",
  major: "",
  role: "",
});

const errors = ref({});

// Format ngày sinh về dạng YYYY-MM-DD cho input date
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

// Hiển thị vai trò người dùng
const getRoleDisplay = (role) => {
  const roleMap = {
    student: "Sinh viên",
    admin: "Quản trị viên",
    teacher: "Giáo viên/Giảng viên",
  };
  return roleMap[role] || role;
};

// Lấy thông tin người dùng từ API
const fetchUserProfile = async () => {
  try {
    loading.value = true;
    const response = await authService.getProfile();

    if (response && response.success && response.user) {
      // Map API data to form data
      const user = response.user;
      formData.value = {
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || defaultAvatar,
        dateOfBirth: formatDateForInput(user.dateOfBirth),
        faculty: user.faculty || "",
        major: user.major || "",
        role: user.role || "student",
      };
    } else {
      toast.error("Không thể tải thông tin người dùng");
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin người dùng:", error);
    toast.error("Không thể tải thông tin người dùng");
  } finally {
    loading.value = false;
  }
};

// Xử lý khi chọn file ảnh mới
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Kiểm tra loại file
  const acceptedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!acceptedTypes.includes(file.type)) {
    toast.error(
      "Vui lòng chọn file hình ảnh định dạng: JPEG, JPG, PNG, GIF, WEBP"
    );
    return;
  }

  // Kiểm tra kích thước file (tối đa 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error("Kích thước file không được vượt quá 2MB");
    return;
  }

  // Lưu file để sử dụng khi upload
  newAvatarFile.value = file;

  // Tạo URL xem trước ảnh
  const reader = new FileReader();
  reader.onload = (e) => {
    formData.value.avatar = e.target.result; // Hiển thị xem trước
  };
  reader.readAsDataURL(file);
};

// Hủy cập nhật avatar
const cancelAvatarUpdate = () => {
  newAvatarFile.value = null;
  // Tải lại thông tin người dùng để hiển thị avatar ban đầu
  fetchUserProfile();
};

// Hiện hộp thoại xác nhận trước khi cập nhật avatar
const confirmUpdateAvatar = () => {
  if (!newAvatarFile.value) return;

  Swal.fire({
    title: "Xác nhận cập nhật ảnh đại diện?",
    text: "Ảnh đại diện của bạn sẽ được cập nhật ngay lập tức",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Đồng ý",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (result.isConfirmed) {
      updateAvatar();
    }
  });
};

// Cập nhật avatar
const updateAvatar = async () => {
  if (!newAvatarFile.value) return;

  isAvatarUploading.value = true;

  try {
    // Tạo form data để upload file
    const avatarFormData = new FormData();
    avatarFormData.append("avatar", newAvatarFile.value);

    const response = await authService.updateAvatar(avatarFormData);

    // Xử lý phản hồi an toàn
    if (response && response.message) {
      // Đảm bảo component còn trong DOM trước khi hiển thị toast
      await nextTick();
      toast.success("Cập nhật ảnh đại diện thành công!");

      // Tải lại thông tin người dùng
      await fetchUserProfile();

      // Thông báo cho các component khác biết thông tin đã thay đổi
      emitter.emit("user-updated");
    } else {
      await nextTick();
      toast.error(
        (response && response.message) || "Cập nhật ảnh đại diện thất bại"
      );
      // Tải lại thông tin người dùng để hiển thị avatar ban đầu
      await fetchUserProfile();
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật avatar:", error);
    await nextTick();
    toast.error("Có lỗi xảy ra khi cập nhật ảnh đại diện");
    // Tải lại thông tin người dùng để hiển thị avatar ban đầu
    await fetchUserProfile();
  } finally {
    isAvatarUploading.value = false;
    newAvatarFile.value = null;
  }
};

// Kiểm tra dữ liệu hợp lệ
const validateForm = () => {
  const newErrors = {};

  // Kiểm tra tên
  if (!formData.value.name) {
    newErrors.name = "Vui lòng nhập họ tên";
  } else if (formData.value.name.length > 70) {
    newErrors.name = "Họ tên không được quá 70 ký tự";
  } else if (
    !/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(
      formData.value.name
    )
  ) {
    newErrors.name = "Họ tên không được chứa ký tự đặc biệt hoặc số";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

// Chuẩn bị dữ liệu để gửi lên API
const prepareUserData = () => {
  const userData = { ...formData.value };

  // Chuyển đổi ngày sinh về định dạng ISO nếu có giá trị
  if (userData.dateOfBirth) {
    userData.dateOfBirth = new Date(userData.dateOfBirth).toISOString();
  }

  // Loại bỏ avatar nếu đang upload avatar mới
  if (newAvatarFile.value) {
    delete userData.avatar;
  }

  return userData;
};

// Lưu thông tin cá nhân
const saveProfile = async () => {
  if (!validateForm()) {
    toast.error("Vui lòng kiểm tra lại thông tin");
    return;
  }

  isSubmitting.value = true;

  try {
    const userData = prepareUserData();
    const response = await authService.updateProfile(userData);

    // Đảm bảo xử lý phản hồi an toàn
    if (response && response.message) {
      await nextTick();
      toast.success("Cập nhật thông tin thành công!");

      // Tải lại thông tin người dùng để hiển thị dữ liệu mới nhất
      await fetchUserProfile();

      // Thông báo cho các component khác biết thông tin đã thay đổi
      emitter.emit("user-updated");
    } else {
      await nextTick();
      const errorMessage =
        response && response.message
          ? response.message
          : "Có lỗi xảy ra khi cập nhật thông tin";
      toast.error(errorMessage);
    }
  } catch (error) {
    console.error("Lỗi khi xử lý cập nhật thông tin:", error);
    await nextTick();
    toast.error("Có lỗi xảy ra trong quá trình cập nhật thông tin");
  } finally {
    isSubmitting.value = false;
  }
};

// Kiểm soát trạng thái component
const isMounted = ref(true);

// Khởi tạo dữ liệu khoa và ngành
const faculties = ref([]);
const majors = ref([]);
const filteredFaculties = ref([]);
const filteredMajors = ref([]);
const facultySearchTerm = ref("");
const majorSearchTerm = ref("");
const showFacultyDropdown = ref(false);
const showMajorDropdown = ref(false);
const isLoadingFaculties = ref(false);
const isLoadingMajors = ref(false);
const selectedFacultyId = ref("");

// Lấy danh sách khoa từ API
const fetchFaculties = async () => {
  try {
    isLoadingFaculties.value = true;
    const response = await academicService.getFaculties();
    if (response && response.success) {
      faculties.value = response.data;
      filteredFaculties.value = [...faculties.value];
    } else {
      console.error("Không thể tải danh sách khoa:", response);
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách khoa:", error);
  } finally {
    isLoadingFaculties.value = false;
  }
};

// Lấy danh sách ngành theo khoa từ API
const fetchMajorsByFaculty = async (facultyId) => {
  if (!facultyId) {
    majors.value = [];
    filteredMajors.value = [];
    return;
  }

  try {
    isLoadingMajors.value = true;
    const response = await academicService.getMajorsByFaculty(facultyId);
    if (response && response.success) {
      majors.value = response.data;
      filteredMajors.value = [...majors.value];
    } else {
      console.error("Không thể tải danh sách ngành:", response);
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách ngành:", error);
  } finally {
    isLoadingMajors.value = false;
  }
};

// Lọc danh sách khoa theo từ khóa tìm kiếm
const filterFaculties = () => {
  if (!facultySearchTerm.value.trim()) {
    filteredFaculties.value = [...faculties.value];
    return;
  }

  const searchTerm = facultySearchTerm.value.toLowerCase().trim();
  filteredFaculties.value = faculties.value.filter((faculty) =>
    faculty.name.toLowerCase().includes(searchTerm)
  );
};

// Lọc danh sách ngành theo từ khóa tìm kiếm
const filterMajors = () => {
  if (!majorSearchTerm.value.trim()) {
    filteredMajors.value = [...majors.value];
    return;
  }

  const searchTerm = majorSearchTerm.value.toLowerCase().trim();
  filteredMajors.value = majors.value.filter((major) =>
    major.name.toLowerCase().includes(searchTerm)
  );
};

// Chọn khoa
const selectFaculty = (faculty) => {
  formData.value.faculty = faculty.name;
  selectedFacultyId.value = faculty.id;
  facultySearchTerm.value = "";
  showFacultyDropdown.value = false;

  // Xóa ngành khi thay đổi khoa
  formData.value.major = "";

  // Tải danh sách ngành của khoa đã chọn
  fetchMajorsByFaculty(faculty.id);
};

// Chọn ngành
const selectMajor = (major) => {
  formData.value.major = major.name;
  majorSearchTerm.value = "";
  showMajorDropdown.value = false;
};

// Xóa khoa đã chọn
const clearFaculty = () => {
  formData.value.faculty = "";
  formData.value.major = "";
  selectedFacultyId.value = "";
  majors.value = [];
  filteredMajors.value = [];
};

// Xóa ngành đã chọn
const clearMajor = () => {
  formData.value.major = "";
};

// Bật/tắt dropdown khoa
const toggleFacultyDropdown = () => {
  showFacultyDropdown.value = !showFacultyDropdown.value;
  if (showFacultyDropdown.value) {
    showMajorDropdown.value = false;
  }
};

// Bật/tắt dropdown ngành
const toggleMajorDropdown = () => {
  if (!formData.value.faculty) return;

  showMajorDropdown.value = !showMajorDropdown.value;
  if (showMajorDropdown.value) {
    showFacultyDropdown.value = false;
  }
};

// Đóng dropdown khi click ra ngoài
const closeDropdowns = (event) => {
  const facultyDropdown = document.querySelector(".dropdown-search");
  const majorDropdown = document.querySelectorAll(".dropdown-search")[1];

  if (facultyDropdown && !facultyDropdown.contains(event.target)) {
    showFacultyDropdown.value = false;
  }

  if (majorDropdown && !majorDropdown.contains(event.target)) {
    showMajorDropdown.value = false;
  }
};

// Hàm hiển thị toast an toàn
const safeToast = (message, type = "success") => {
  if (!isMounted.value) return;

  if (type === "success") {
    toast.success(message);
  } else {
    toast.error(message);
  }
};

// Khởi tạo dữ liệu khi component được tạo
onMounted(() => {
  isMounted.value = true;
  // Lấy thông tin người dùng từ API
  fetchUserProfile();
  // Lấy danh sách khoa
  fetchFaculties();

  // Thêm event listener để đóng dropdown khi click ra ngoài
  document.addEventListener("click", closeDropdowns);
});

// Khi component bị hủy
onBeforeUnmount(() => {
  isMounted.value = false;
  // Gỡ bỏ event listener
  document.removeEventListener("click", closeDropdowns);
});

// Theo dõi thay đổi của formData để tìm khoa và ngành khi tải dữ liệu
watch(
  () => formData.value.faculty,
  (newValue) => {
    if (newValue) {
      // Tìm facultyId từ tên khoa
      const faculty = faculties.value.find((f) => f.name === newValue);
      if (faculty) {
        selectedFacultyId.value = faculty.id;
        fetchMajorsByFaculty(faculty.id);
      }
    }
  },
  { immediate: false }
);
</script>

<style scoped>
.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  padding: 1rem 1.25rem;
}

.card-body {
  padding: 1.5rem;
}

label {
  font-weight: 500;
  color: #6c757d;
}

.form-control-plaintext {
  background-color: transparent;
  border: none;
  padding: 0.375rem 0;
}

/* Phần ảnh đại diện */
.avatar-wrapper {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  border: 3px solid #f0f0f0;
  position: relative;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-edit-icon {
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.avatar-actions {
  margin-top: 1rem;
}

/* Dropdown tìm kiếm */
.dropdown-search {
  position: relative;
}

.dropdown-search-container {
  /* Loại bỏ max-height và overflow-y từ container này */
  width: 100%;
}

.dropdown-menu.show {
  display: block;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  white-space: normal;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.disabled {
  color: #6c757d;
  cursor: not-allowed;
}

.selected-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-close-sm {
  font-size: 0.5rem;
  padding: 0.25rem;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.disabled {
  pointer-events: none;
  opacity: 0.65;
}
</style>
