<template>
  <div class="register-container">
    <div class="card register-card">
      <div class="card-body">
        <h2 class="text-center mb-4">Đăng ký tài khoản</h2>

        <form class="register-form" @submit.prevent="handleRegister">
          <div class="form-group mb-3">
            <label for="fullName" class="form-label">Họ và tên</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-user"></i>
              </span>
              <input
                type="text"
                id="fullName"
                class="form-control remove-invalid"
                placeholder="Nhập họ và tên của bạn"
                v-model="fullName"
                required
                @input="nameError = ''"
              />
            </div>
            <div v-if="nameError" class="text-danger mt-1">
              {{ nameError }}
            </div>
          </div>

          <div class="form-group mb-3">
            <label for="email" class="form-label">Email</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                id="email"
                class="form-control remove-invalid"
                placeholder="Nhập email của bạn"
                v-model="email"
                required
                @input="emailError = ''"
              />
            </div>
            <div v-if="emailError" class="text-danger mt-1">
              {{ emailError }}
            </div>
          </div>

          <div class="form-group mb-3">
            <label for="password" class="form-label">Mật khẩu</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-lock"></i>
              </span>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                class="form-control remove-invalid"
                placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                v-model="password"
                required
                @input="validatePassword"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="togglePassword"
              >
                <i
                  :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                ></i>
              </button>
            </div>
            <div v-if="passwordError" class="text-danger mt-1">
              {{ passwordError }}
            </div>
          </div>

          <div class="form-group mb-4">
            <label for="confirmPassword" class="form-label"
              >Xác nhận mật khẩu</label
            >
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-lock"></i>
              </span>
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                class="form-control remove-invalid"
                placeholder="Nhập lại mật khẩu"
                v-model="confirmPassword"
                required
                @input="validateConfirmPassword"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="toggleConfirmPassword"
              >
                <i
                  :class="
                    showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                  "
                ></i>
              </button>
            </div>
            <div v-if="confirmPasswordError" class="text-danger mt-1">
              {{ confirmPasswordError }}
            </div>
          </div>

          <div class="form-check mb-4">
            <input
              class="form-check-input remove-invalid"
              type="checkbox"
              id="agreeTerms"
              v-model="agreeTerms"
              @change="agreeTermsError = ''"
              required
            />
            <label class="form-check-label" for="agreeTerms">
              Tôi đồng ý với
              <a href="#" class="terms-link">điều khoản sử dụng</a> và
              <a href="#" class="terms-link">chính sách bảo mật</a>
            </label>
            <div v-if="agreeTermsError" class="text-danger mt-1">
              {{ agreeTermsError }}
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            :disabled="isLoading || !isFormValid"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
            ></span>
            {{ isLoading ? "Đang xử lý..." : "Đăng ký" }}
          </button>

          <div class="text-center">
            <p>
              Đã có tài khoản?
              <router-link to="/login" class="login-link">
                Đăng nhập
              </router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import authService from "../../services/authService";

// Khai báo reactive state
const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const agreeTerms = ref(false);
const isLoading = ref(false);

// Khai báo biến lỗi
const nameError = ref("");
const emailError = ref("");
const passwordError = ref("");
const confirmPasswordError = ref("");
const agreeTermsError = ref("");

// Hook các tiện ích
const toast = useToast();
const router = useRouter();

// Hàm chuyển đổi hiển thị mật khẩu
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Hàm chuyển đổi hiển thị xác nhận mật khẩu
const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// Kiểm tra tính hợp lệ của họ tên
const validateName = () => {
  const nameRegex =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

  if (!fullName.value.trim()) {
    nameError.value = "Họ tên không được để trống";
    return false;
  } else if (!nameRegex.test(fullName.value)) {
    nameError.value = "Họ tên không được chứa ký tự đặc biệt hoặc số";
    return false;
  } else if (fullName.value.length > 70) {
    nameError.value = "Họ tên không được quá 70 ký tự";
    return false;
  }

  nameError.value = "";
  return true;
};

// Kiểm tra tính hợp lệ của email
const validateEmail = () => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

  if (!email.value.trim()) {
    emailError.value = "Email không được để trống";
    return false;
  } else if (!emailRegex.test(email.value)) {
    emailError.value = "Email không hợp lệ";
    return false;
  }

  emailError.value = "";
  return true;
};

// Kiểm tra tính hợp lệ của mật khẩu
const validatePassword = () => {
  if (!password.value) {
    passwordError.value = "Mật khẩu không được để trống";
    return false;
  } else if (password.value.length < 6) {
    passwordError.value = "Mật khẩu phải có ít nhất 6 ký tự";
    return false;
  }

  passwordError.value = "";

  // Nếu đã nhập xác nhận mật khẩu, kiểm tra lại sự khớp
  if (confirmPassword.value) {
    validateConfirmPassword();
  }

  return true;
};

// Kiểm tra sự khớp mật khẩu
const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    confirmPasswordError.value = "Vui lòng xác nhận mật khẩu";
    return false;
  } else if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = "Mật khẩu xác nhận không khớp";
    return false;
  }

  confirmPasswordError.value = "";
  return true;
};

// Kiểm tra đồng ý điều khoản
const validateTerms = () => {
  if (!agreeTerms.value) {
    agreeTermsError.value = "Vui lòng đồng ý với điều khoản sử dụng";
    return false;
  }

  agreeTermsError.value = "";
  return true;
};

// Kiểm tra toàn bộ form có hợp lệ không
const isFormValid = computed(() => {
  return (
    fullName.value.trim() !== "" &&
    email.value.trim() !== "" &&
    password.value.length >= 6 &&
    password.value === confirmPassword.value &&
    agreeTerms.value
  );
});

// Xử lý đăng ký
const handleRegister = async () => {
  // Kiểm tra tất cả các trường
  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();
  const isTermsValid = validateTerms();

  // Nếu không hợp lệ, dừng lại
  if (
    !isNameValid ||
    !isEmailValid ||
    !isPasswordValid ||
    !isConfirmPasswordValid ||
    !isTermsValid
  ) {
    return;
  }

  try {
    // Hiện loading
    isLoading.value = true;

    // Gọi API đăng ký
    const userData = {
      name: fullName.value,
      email: email.value,
      password: password.value,
    };

    const response = await authService.register(userData);

    // Thông báo thành công
    toast.success("Đăng ký thành công!", {
      timeout: 2000,
    });

    // Chuyển hướng ngay lập tức đến trang đăng nhập
    router.push("/login");
  } catch (error) {
    // Xử lý lỗi
    console.error("Lỗi đăng ký:", error);

    // Hiển thị thông báo lỗi từ server hoặc thông báo lỗi mặc định
    const errorMessage =
      error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại";
    toast.error(errorMessage);

    // Xác định loại lỗi để hiển thị vào trường tương ứng
    if (errorMessage.toLowerCase().includes("email")) {
      emailError.value = errorMessage;
    } else if (errorMessage.toLowerCase().includes("mật khẩu")) {
      passwordError.value = errorMessage;
    } else if (errorMessage.toLowerCase().includes("họ tên")) {
      nameError.value = errorMessage;
    }
  } finally {
    // Ẩn loading
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 2rem;
}

.register-card {
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 15px;
  margin-top: 1rem;
  margin-bottom: 2rem;
}

.register-form {
  padding: 1rem;
}

.form-label {
  font-weight: 500;
}

.input-group-text {
  background-color: #f8f9fa;
  border-right: none;
}

.form-control {
  border-left: none;
}

.form-control:focus {
  box-shadow: none;
  border-color: #ced4da;
}

.text-muted {
  font-size: 0.8rem;
}

.login-link,
.terms-link {
  color: #646cff;
  font-weight: 600;
  text-decoration: none;
}

.login-link:hover,
.terms-link:hover {
  text-decoration: underline;
}

/* Bỏ viền đỏ khi form không hợp lệ */
.remove-invalid.form-control:focus,
.remove-invalid.form-control.is-invalid,
.remove-invalid.form-control.is-invalid:focus {
  border-color: #ced4da;
  box-shadow: none;
}

/* Loại bỏ biểu tượng xác thực mặc định của Bootstrap */
.form-control.remove-invalid.is-invalid {
  background-image: none;
  padding-right: 0.75rem;
}

.input-group > .form-control.remove-invalid.is-invalid {
  z-index: 0;
}

/* Loại bỏ viền đỏ cho checkbox */
.form-check-input.remove-invalid.is-invalid {
  border-color: #ced4da;
  background-image: none;
}

@media (max-width: 576px) {
  .register-card {
    box-shadow: none;
  }

  .register-container {
    padding: 1rem;
  }
}
</style>
