<template>
  <div class="login-container">
    <div class="card login-card">
      <div class="card-body">
        <h2 class="text-center mb-4">Đăng nhập</h2>

        <form class="login-form" @submit.prevent="handleLogin">
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

          <div class="form-group mb-4">
            <label for="password" class="form-label">Mật khẩu</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-lock"></i>
              </span>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                class="form-control remove-invalid"
                placeholder="Nhập mật khẩu"
                v-model="password"
                required
                @input="passwordError = ''"
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

          <div class="d-flex justify-content-between mb-4">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="rememberMe"
                v-model="rememberMe"
              />
              <label class="form-check-label" for="rememberMe">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <a href="#" class="forgot-password">Quên mật khẩu?</a>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            :disabled="isLoading"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
            ></span>
            {{ isLoading ? "Đang xử lý..." : "Đăng nhập" }}
          </button>

          <div class="text-center">
            <p>
              Chưa có tài khoản?
              <router-link to="/register" class="register-link">
                Đăng ký ngay
              </router-link>
            </p>
          </div>

          <div class="divider d-flex align-items-center my-4">
            <p class="text-center fw-bold mx-auto">Hoặc đăng nhập với</p>
          </div>

          <div class="social-login">
            <button type="button" class="btn btn-outline-primary social-btn">
              <i class="fab fa-facebook-f"></i>
            </button>
            <button type="button" class="btn btn-outline-danger social-btn">
              <i class="fab fa-google"></i>
            </button>
            <button type="button" class="btn btn-outline-dark social-btn">
              <i class="fab fa-github"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import authService from "../../services/authService";

// Khai báo reactive state
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const emailError = ref("");
const passwordError = ref("");

// Hook các tiện ích
const toast = useToast();
const router = useRouter();
const authStore = useAuthStore();

// Hàm chuyển đổi hiển thị mật khẩu
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Kiểm tra định dạng email
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Xử lý đăng nhập
const handleLogin = async () => {
  // Đặt lại thông báo lỗi
  emailError.value = "";
  passwordError.value = "";

  // Kiểm tra dữ liệu đầu vào
  let isValid = true;

  // Kiểm tra email
  if (!email.value.trim()) {
    emailError.value = "Email không được để trống";
    isValid = false;
  } else if (!isValidEmail(email.value)) {
    emailError.value = "Email không hợp lệ";
    isValid = false;
  }

  // Kiểm tra mật khẩu
  if (!password.value) {
    passwordError.value = "Mật khẩu không được để trống";
    isValid = false;
  } else if (password.value.length < 6) {
    passwordError.value = "Mật khẩu phải có ít nhất 6 ký tự";
    isValid = false;
  }

  // Nếu không hợp lệ, dừng lại
  if (!isValid) return;

  try {
    // Hiện loading
    isLoading.value = true;

    // Gọi API đăng nhập
    const response = await authService.login(email.value, password.value);

    // Lưu token vào store
    authStore.setAuth(response.token);

    // Tùy chọn: Lấy thông tin người dùng ngay sau khi đăng nhập
    try {
      const userResponse = await authService.getProfile();
      if (userResponse.success && userResponse.user) {
        // Nếu bạn muốn lưu thông tin user vào store, có thể thêm phương thức trong authStore
        // authStore.setUserProfile(userResponse.user);
      }
    } catch (error) {
      console.error("Không thể lấy thông tin người dùng sau đăng nhập:", error);
    }

    // Thông báo thành công
    toast.success("Đăng nhập thành công!", {
      timeout: 2000,
    });

    // Chuyển hướng ngay lập tức đến trang chủ
    router.push("/");
  } catch (error) {
    // Xử lý lỗi
    console.error("Lỗi đăng nhập:", error);

    // Hiển thị thông báo lỗi từ server hoặc thông báo lỗi mặc định
    const errorMessage =
      error.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại";
    toast.error(errorMessage);

    // Nếu lỗi liên quan đến email/password
    if (errorMessage.toLowerCase().includes("email")) {
      emailError.value = errorMessage;
    } else if (errorMessage.toLowerCase().includes("mật khẩu")) {
      passwordError.value = errorMessage;
    }
  } finally {
    // Ẩn loading
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.login-card {
  max-width: 450px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 15px;
}

.login-form {
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

.forgot-password {
  color: #646cff;
  text-decoration: none;
  font-size: 0.9rem;
}

.register-link {
  color: #646cff;
  font-weight: 600;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}

.divider {
  position: relative;
}

.divider p {
  background-color: white;
  padding: 0 10px;
  color: #6c757d;
  font-size: 0.9rem;
}

.divider::before {
  content: "";
  position: absolute;
  height: 1px;
  width: 100%;
  background-color: #dee2e6;
  top: 50%;
  z-index: -1;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-btn {
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
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

@media (max-width: 576px) {
  .login-card {
    box-shadow: none;
  }
}
</style>
