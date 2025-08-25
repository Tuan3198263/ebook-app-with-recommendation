import api from './api';

// Service cho các chức năng liên quan đến dữ liệu học thuật (khoa, ngành)
const academicService = {
  // Lấy tất cả các khoa
  getFaculties: async () => {
    try {
      const response = await api.get('/academic/faculties');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả các ngành của một khoa
  getMajorsByFaculty: async (facultyId) => {
    try {
      const response = await api.get(`/academic/faculties/${facultyId}/majors`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả dữ liệu khoa và ngành
  getAllAcademicData: async () => {
    try {
      const response = await api.get('/academic/all');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default academicService;
