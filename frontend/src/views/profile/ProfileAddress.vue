<template>
  <div class="profile-address">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="fas fa-map-marker-alt me-2"></i>Địa chỉ của tôi
      </h5>
      <button
        class="btn btn-sm btn-primary"
        @click="addNewAddress"
        v-if="!isEditing && !hasAddress"
      >
        <i class="fas fa-plus me-1"></i> Thêm địa chỉ
      </button>
    </div>

    <div class="card-body">
      <!-- Hiển thị loading khi đang tải dữ liệu -->
      <div v-if="isLoading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải dữ liệu...</p>
      </div>

      <!-- Form thêm/chỉnh sửa địa chỉ -->
      <div v-else-if="isEditing" class="address-form mb-4">
        <h6 class="mb-3">
          {{ !hasAddress ? "Thêm địa chỉ" : "Chỉnh sửa địa chỉ" }}
        </h6>
        <form @submit.prevent="saveAddress">
          <div class="row">
            <!-- Họ và tên người nhận -->
            <div class="col-md-6 mb-3">
              <label for="fullName" class="form-label"
                >Họ và tên người nhận <span class="text-danger">*</span></label
              >
              <input
                type="text"
                class="form-control"
                id="fullName"
                v-model="currentAddress.fullname"
                required
              />
            </div>

            <!-- Số điện thoại -->
            <div class="col-md-6 mb-3">
              <label for="phone" class="form-label"
                >Số điện thoại <span class="text-danger">*</span></label
              >
              <input
                type="tel"
                class="form-control"
                id="phone"
                v-model="currentAddress.phone"
                required
                pattern="[0-9]{10}"
              />
            </div>

            <!-- Tỉnh/Thành phố -->
            <div class="col-md-4 mb-3">
              <label for="province" class="form-label"
                >Tỉnh/Thành phố <span class="text-danger">*</span></label
              >
              <select
                class="form-select"
                id="province"
                v-model="currentAddress.provinceId"
                required
                @change="onProvinceChange"
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                <option
                  v-for="province in provinces"
                  :key="province.id"
                  :value="province.id"
                >
                  {{ province.name }}
                </option>
              </select>
              <div v-if="loadingProvinces" class="text-center mt-1">
                <small class="text-muted">Đang tải...</small>
              </div>
            </div>

            <!-- Quận/Huyện -->
            <div class="col-md-4 mb-3">
              <label for="district" class="form-label"
                >Quận/Huyện <span class="text-danger">*</span></label
              >
              <select
                class="form-select"
                id="district"
                v-model="currentAddress.districtId"
                required
                :disabled="!currentAddress.provinceId || loadingDistricts"
                @change="onDistrictChange"
              >
                <option value="">-- Chọn Quận/Huyện --</option>
                <option
                  v-for="district in districts"
                  :key="district.id"
                  :value="district.id"
                >
                  {{ district.name }}
                </option>
              </select>
              <div v-if="loadingDistricts" class="text-center mt-1">
                <small class="text-muted">Đang tải...</small>
              </div>
            </div>

            <!-- Phường/Xã -->
            <div class="col-md-4 mb-3">
              <label for="ward" class="form-label"
                >Phường/Xã <span class="text-danger">*</span></label
              >
              <select
                class="form-select"
                id="ward"
                v-model="currentAddress.wardId"
                required
                :disabled="!currentAddress.districtId || loadingWards"
              >
                <option value="">-- Chọn Phường/Xã --</option>
                <option v-for="ward in wards" :key="ward.id" :value="ward.id">
                  {{ ward.name }}
                </option>
              </select>
              <div v-if="loadingWards" class="text-center mt-1">
                <small class="text-muted">Đang tải...</small>
              </div>
            </div>

            <!-- Địa chỉ cụ thể -->
            <div class="col-12 mb-3">
              <label for="streetAddress" class="form-label"
                >Địa chỉ cụ thể <span class="text-danger">*</span></label
              >
              <input
                type="text"
                class="form-control"
                id="streetAddress"
                v-model="currentAddress.address"
                required
                placeholder="Số nhà, tên đường, tòa nhà, khu vực..."
              />
            </div>

            <!-- Nút lưu và hủy -->
            <div class="col-12 mt-3">
              <button type="submit" class="btn btn-success" :disabled="saving">
                <span
                  v-if="saving"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                <i v-else class="fas fa-save me-1"></i> Lưu địa chỉ
              </button>
              <button
                type="button"
                class="btn btn-secondary ms-2"
                @click="cancelEdit"
                :disabled="saving"
              >
                <i class="fas fa-times me-1"></i> Hủy
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Hiển thị địa chỉ -->
      <div v-else class="address-display">
        <div v-if="hasAddress" class="address-card">
          <div class="address-header d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <h6 class="mb-0">{{ userAddress.fullname }}</h6>
              <span class="badge bg-primary ms-2">Mặc định</span>
            </div>
            <div class="address-actions">
              <button
                class="btn btn-sm btn-outline-primary"
                @click="editAddress"
              >
                <i class="fas fa-edit"></i> Sửa
              </button>
            </div>
          </div>

          <div class="address-content">
            <p class="mb-1">
              <i class="fas fa-phone me-2"></i> {{ userAddress.phone }}
            </p>
            <p class="mb-0">
              <i class="fas fa-map-marked-alt me-2"></i>
              {{ formatFullAddress(userAddress) }}
            </p>
          </div>
        </div>

        <div v-else class="text-center my-5">
          <i class="fas fa-map-marker-alt fa-3x mb-3 text-muted"></i>
          <p>Bạn chưa có địa chỉ</p>
          <button class="btn btn-primary" @click="addNewAddress">
            <i class="fas fa-plus me-1"></i> Thêm địa chỉ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import addressService from "../../services/addressService.js";
import locationService from "../../services/locationService.js";

const toast = useToast();
const isEditing = ref(false);
const userAddress = ref(null);
const isLoading = ref(false);
const saving = ref(false);

// Trạng thái loading cho các danh sách
const loadingProvinces = ref(false);
const loadingDistricts = ref(false);
const loadingWards = ref(false);

// Computed property to check if user has an address
const hasAddress = computed(() => userAddress.value !== null);

// Dữ liệu địa chỉ đang chỉnh sửa
const currentAddress = ref({
  fullname: "",
  phone: "",
  provinceId: "",
  provinceName: "",
  districtId: "",
  districtName: "",
  wardId: "",
  wardName: "",
  address: "",
});

// Dữ liệu về tỉnh/thành phố, quận/huyện, phường/xã
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

// Lấy danh sách tỉnh/thành phố từ API
const fetchProvinces = async () => {
  try {
    loadingProvinces.value = true;
    const data = await locationService.getProvinces();
    provinces.value = locationService.formatProvinces(data);
  } catch (error) {
    console.error("Lỗi khi tải danh sách tỉnh/thành phố:", error);
    toast.error("Không thể tải danh sách tỉnh/thành phố");
  } finally {
    loadingProvinces.value = false;
  }
};

// Lấy danh sách quận/huyện theo tỉnh/thành phố
const fetchDistricts = async (provinceId) => {
  try {
    if (!provinceId) {
      districts.value = [];
      return;
    }

    loadingDistricts.value = true;
    const data = await locationService.getDistricts(provinceId);
    districts.value = locationService.formatDistricts(data);
  } catch (error) {
    console.error("Lỗi khi tải danh sách quận/huyện:", error);
    toast.error("Không thể tải danh sách quận/huyện");
  } finally {
    loadingDistricts.value = false;
  }
};

// Lấy danh sách phường/xã theo quận/huyện
const fetchWards = async (districtId) => {
  try {
    if (!districtId) {
      wards.value = [];
      return;
    }

    loadingWards.value = true;
    const data = await locationService.getWards(districtId);
    wards.value = locationService.formatWards(data);
  } catch (error) {
    console.error("Lỗi khi tải danh sách phường/xã:", error);
    toast.error("Không thể tải danh sách phường/xã");
  } finally {
    loadingWards.value = false;
  }
};

// Lấy địa chỉ người dùng từ API
const fetchUserAddress = async () => {
  try {
    isLoading.value = true;
    const response = await addressService.getUserAddress();

    if (response.success) {
      userAddress.value = response.data;
      // Nếu có message và không có data, hiển thị thông báo nhẹ nhàng
      if (response.message && !response.data) {
        console.info(response.message);
      }
    } else {
      userAddress.value = null;
    }
  } catch (error) {
    console.error("Lỗi khi tải địa chỉ:", error);
    userAddress.value = null;

    // Hiển thị thông báo lỗi chỉ khi có lỗi thực sự từ server
    let errorMessage = "Không thể tải thông tin địa chỉ";
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    toast.error(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// Thêm địa chỉ mới
const addNewAddress = async () => {
  isEditing.value = true;
  currentAddress.value = {
    fullname: "",
    phone: "",
    provinceId: "",
    provinceName: "",
    districtId: "",
    districtName: "",
    wardId: "",
    wardName: "",
    address: "",
  };

  // Tải danh sách tỉnh/thành phố nếu chưa có
  if (provinces.value.length === 0) {
    await fetchProvinces();
  }
};

// Chỉnh sửa địa chỉ
const editAddress = async () => {
  isEditing.value = true;

  // Tải danh sách tỉnh/thành phố nếu chưa có
  if (provinces.value.length === 0) {
    await fetchProvinces();
  }

  // Copy thông tin từ địa chỉ hiện tại vào form chỉnh sửa
  currentAddress.value = { ...userAddress.value };

  // Cập nhật danh sách quận/huyện và phường/xã
  if (currentAddress.value.provinceId) {
    await fetchDistricts(currentAddress.value.provinceId);
    if (currentAddress.value.districtId) {
      await fetchWards(currentAddress.value.districtId);
    }
  }
};

// Hủy chỉnh sửa
const cancelEdit = () => {
  isEditing.value = false;
};

// Xử lý khi thay đổi tỉnh/thành phố
const onProvinceChange = async () => {
  const provinceId = parseInt(currentAddress.value.provinceId);
  currentAddress.value.districtId = "";
  currentAddress.value.wardId = "";
  currentAddress.value.provinceName =
    provinces.value.find((p) => p.id === provinceId)?.name || "";

  await fetchDistricts(provinceId);
  wards.value = [];
};

// Xử lý khi thay đổi quận/huyện
const onDistrictChange = async () => {
  const districtId = parseInt(currentAddress.value.districtId);
  currentAddress.value.wardId = "";
  currentAddress.value.districtName =
    districts.value.find((d) => d.id === districtId)?.name || "";

  await fetchWards(districtId);
};

// Lưu địa chỉ
const saveAddress = async () => {
  try {
    saving.value = true;

    // Lấy tên phường/xã từ ID
    const ward = wards.value.find((w) => w.id === currentAddress.value.wardId);
    if (ward) {
      currentAddress.value.wardName = ward.name;
    }

    const addressData = { ...currentAddress.value };

    // Gửi dữ liệu lên server
    const response = await addressService.createOrUpdateAddress(addressData);

    if (response.success) {
      userAddress.value = response.data;
      isEditing.value = false;
      toast.success(response.message || "Lưu địa chỉ thành công!");
    }
  } catch (error) {
    console.error("Lỗi khi lưu địa chỉ:", error);
    let errorMessage = "Không thể lưu địa chỉ";
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    toast.error(errorMessage);
  } finally {
    saving.value = false;
  }
};

// Định dạng địa chỉ đầy đủ
const formatFullAddress = (address) => {
  return `${address.address}, ${address.wardName}, ${address.districtName}, ${address.provinceName}`;
};

onMounted(async () => {
  await fetchUserAddress();
  await fetchProvinces();
});
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

.address-form {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #eaeaea;
}

.address-card {
  background-color: #fff;
  border: 1px solid #646cff;
  border-radius: 0.5rem;
  padding: 1rem;
  position: relative;
  box-shadow: 0 2px 5px rgba(100, 108, 255, 0.1);
}

.address-header {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0.5rem;
}

.address-content {
  color: #333;
}

.address-actions {
  display: flex;
}

label {
  font-weight: 500;
  color: #6c757d;
}
</style>
