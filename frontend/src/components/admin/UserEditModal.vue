<template>
  <div
    v-if="show"
    class="modal fade show"
    style="display: block"
    tabindex="-1"
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Chỉnh sửa người dùng</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <form @submit.prevent="submitEdit">
          <div class="modal-body" v-if="user">
            <div class="mb-2">
              <label class="form-label">Tên</label>
              <input v-model="form.name" class="form-control" required />
            </div>
            <div class="mb-2">
              <label class="form-label">Email</label>
              <input
                v-model="form.email"
                class="form-control"
                required
                type="email"
                disabled
              />
            </div>
            <div class="mb-2">
              <label class="form-label">Khoa</label>
              <select
                v-model="form.faculty"
                class="form-select"
                @change="onFacultyChange"
              >
                <option value="">Chọn khoa</option>
                <option
                  v-for="faculty in faculties"
                  :key="faculty.id"
                  :value="faculty.id"
                >
                  {{ faculty.name }}
                </option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Ngành</label>
              <select v-model="form.major" class="form-select">
                <option value="">Chọn ngành</option>
                <option
                  v-for="major in majors"
                  :key="major.id"
                  :value="major.id"
                >
                  {{ major.name }}
                </option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Vai trò</label>
              <select v-model="form.role" class="form-select">
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="$emit('close')"
            >
              Hủy
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import userService from "../../services/userService";
import { useToast } from "vue-toastification";

// Dữ liệu ánh xạ khoa/ngành (copy từ backend/src/data/facultiesAndMajors.js)
const facultiesAndMajors = [
  {
    id: "cntt",
    name: "Khoa Công nghệ Thông tin",
    majors: [
      { id: "cntt", name: "Công nghệ thông tin" },
      { id: "khmt", name: "Khoa học máy tính" },
      { id: "ktpm", name: "Kỹ thuật phần mềm" },
      { id: "httt", name: "Hệ thống thông tin" },
      { id: "attt", name: "An toàn thông tin" },
      { id: "mmt", name: "Mạng máy tính" },
      { id: "ttdpt", name: "Truyền thông đa phương tiện" },
    ],
  },
  {
    id: "khtn",
    name: "Khoa Khoa học Tự nhiên",
    majors: [
      { id: "toan", name: "Toán học" },
      { id: "vatly", name: "Vật lý học" },
      { id: "hoahoc", name: "Hóa học" },
      { id: "sinhhoc", name: "Sinh học" },
      { id: "khvl", name: "Khoa học vật liệu" },
      { id: "thongke", name: "Thống kê" },
      { id: "nong_hoc", name: "Nông học" },
      { id: "bvtv", name: "Bảo vệ thực vật" },
      { id: "kh_dat", name: "Khoa học đất" },
      { id: "cnsh", name: "Công nghệ sinh học" },
      { id: "sthtn", name: "Sinh thái học nông nghiệp" },
      { id: "ntts", name: "Nuôi trồng thủy sản" },
      { id: "bhts", name: "Bệnh học thủy sản" },
      { id: "cnchts", name: "Công nghệ chế biến thủy sản" },
      { id: "khmt", name: "Khoa học môi trường" },
      { id: "qltntl", name: "Quản lý tài nguyên & môi trường" },
      { id: "ktmt", name: "Kỹ thuật môi trường" },
    ],
  },
  {
    id: "kinh_te",
    name: "Khoa Kinh tế",
    majors: [
      { id: "ktqt", name: "Kinh tế quốc tế" },
      { id: "qtkd", name: "Quản trị kinh doanh" },
      { id: "tcnh", name: "Tài chính - Ngân hàng" },
      { id: "ketoan", name: "Kế toán" },
      { id: "marketing", name: "Marketing" },
      { id: "tmqt", name: "Thương mại quốc tế" },
      { id: "ktnn", name: "Kinh tế nông nghiệp" },
    ],
  },
  {
    id: "giao_duc",
    name: "Khoa Giáo dục",
    majors: [
      { id: "sp_toan", name: "Sư phạm Toán học" },
      { id: "sp_ly", name: "Sư phạm Vật lý" },
      { id: "sp_hoa", name: "Sư phạm Hóa học" },
      { id: "sp_sinh", name: "Sư phạm Sinh học" },
      { id: "sp_tin", name: "Sư phạm Tin học" },
      { id: "sp_van", name: "Sư phạm Văn học" },
      { id: "gd_tieu", name: "Giáo dục Tiểu học" },
      { id: "gd_mn", name: "Giáo dục Mầm non" },
      { id: "gd_tc", name: "Giáo dục Thể chất" },
    ],
  },
  {
    id: "chinh_tri",
    name: "Khoa Chính Trị",
    majors: [
      { id: "triet_hoc", name: "Triết học" },
      { id: "lich_su", name: "Lịch sử" },
      { id: "xa_hoi", name: "Xã hội học" },
      { id: "ct_xh", name: "Công tác xã hội" },
    ],
  },
  {
    id: "van_hoc",
    name: "Khoa Văn học",
    majors: [
      { id: "van_hoc", name: "Văn học" },
      { id: "nn_viet", name: "Ngôn ngữ Việt & Văn hóa Việt Nam" },
      { id: "nn_anh", name: "Ngôn ngữ Anh" },
    ],
  },
];

function getAllFaculties() {
  return facultiesAndMajors.map((faculty) => ({
    id: faculty.id,
    name: faculty.name,
  }));
}
function getMajorsByFaculty(facultyId) {
  const faculty = facultiesAndMajors.find((f) => f.id === facultyId);
  return faculty ? faculty.majors : [];
}

const props = defineProps({ userId: String, show: Boolean });
const emit = defineEmits(["close"]);
const user = ref(null);
const form = ref({ name: "", email: "", role: "user", faculty: "", major: "" });
const isLoading = ref(false);
const toast = useToast();
const faculties = ref(getAllFaculties());
const majors = ref([]);

const fetchUserDetail = async () => {
  if (!props.userId) return;
  const response = await userService.getUserDetail(props.userId);
  if (response.success) {
    user.value = response.data;
    Object.assign(form.value, response.data);
    majors.value = form.value.faculty
      ? getMajorsByFaculty(form.value.faculty)
      : [];
  } else {
    user.value = null;
  }
};
watch(() => props.userId, fetchUserDetail, { immediate: true });
watch(
  () => props.show,
  (val) => {
    if (!val) user.value = null;
  }
);

const onFacultyChange = () => {
  majors.value = form.value.faculty
    ? getMajorsByFaculty(form.value.faculty)
    : [];
  form.value.major = "";
};

const submitEdit = async () => {
  if (!props.userId) return;
  isLoading.value = true;
  // Đảm bảo role là string 'admin' hoặc 'student'
  const payload = {
    ...form.value,
    role: form.value.role === "admin" ? "admin" : "student",
  };
  const response = await userService.updateUserDetail(props.userId, payload);
  if (response.success) {
    toast.success("Cập nhật thông tin người dùng thành công!");
    emit("close");
  } else {
    toast.error("Không thể cập nhật thông tin người dùng");
  }
  isLoading.value = false;
};
</script>

<style scoped>
.modal.show {
  display: block;
  background: rgba(0, 0, 0, 0.3);
}
</style>
