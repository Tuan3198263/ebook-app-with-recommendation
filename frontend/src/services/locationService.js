import axios from 'axios';

// Lấy API token từ biến môi trường
const API_TOKEN = import.meta.env.VITE_GHN_API_TOKEN;

// URL cơ sở cho GHN API
const GHN_API_URL = 'https://online-gateway.ghn.vn/shiip/public-api';

// Tạo instance axios với cấu hình chung
const ghnAxios = axios.create({
  baseURL: GHN_API_URL,
  headers: {
    'token': API_TOKEN,
    'Content-Type': 'application/json'
  }
});

/**
 * Lấy danh sách tỉnh/thành phố
 * @returns {Promise<Array>} Mảng các tỉnh/thành phố
 */
const getProvinces = async () => {
  try {
    const response = await ghnAxios.get('/master-data/province');
    if (response.data.code === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', error);
    throw error;
  }
};

/**
 * Lấy danh sách quận/huyện theo ID tỉnh/thành phố
 * @param {Number} provinceId ID tỉnh/thành phố
 * @returns {Promise<Array>} Mảng các quận/huyện
 */
const getDistricts = async (provinceId) => {
  try {
    if (!provinceId) return [];
    
    const response = await ghnAxios.post('/master-data/district', {
      province_id: provinceId
    });
    
    if (response.data.code === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách quận/huyện:', error);
    throw error;
  }
};

/**
 * Lấy danh sách phường/xã theo ID quận/huyện
 * @param {Number} districtId ID quận/huyện
 * @returns {Promise<Array>} Mảng các phường/xã
 */
const getWards = async (districtId) => {
  try {
    if (!districtId) return [];
    
    const response = await ghnAxios.post('/master-data/ward', {
      district_id: districtId
    });
    
    if (response.data.code === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phường/xã:', error);
    throw error;
  }
};

/**
 * Chuyển đổi danh sách kết quả từ GHN API sang định dạng phù hợp với form
 * @param {Array} provinces Mảng tỉnh/thành phố từ GHN API
 * @returns {Array} Mảng đã được định dạng lại để sử dụng trong select
 */
const formatProvinces = (provinces) => {
  return provinces.map(province => ({
    id: province.ProvinceID,
    name: province.ProvinceName
  }));
};

/**
 * Chuyển đổi danh sách quận/huyện từ GHN API sang định dạng phù hợp với form
 * @param {Array} districts Mảng quận/huyện từ GHN API
 * @returns {Array} Mảng đã được định dạng lại để sử dụng trong select
 */
const formatDistricts = (districts) => {
  return districts.map(district => ({
    id: district.DistrictID,
    name: district.DistrictName
  }));
};

/**
 * Chuyển đổi danh sách phường/xã từ GHN API sang định dạng phù hợp với form
 * @param {Array} wards Mảng phường/xã từ GHN API
 * @returns {Array} Mảng đã được định dạng lại để sử dụng trong select
 */
const formatWards = (wards) => {
  return wards.map(ward => ({
    id: ward.WardCode,
    name: ward.WardName
  }));
};

export default {
  getProvinces,
  getDistricts,
  getWards,
  formatProvinces,
  formatDistricts,
  formatWards
};
