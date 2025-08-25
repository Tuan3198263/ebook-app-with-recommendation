import { facultiesAndMajors, getAllFaculties, getMajorsByFaculty } from '../data/facultiesAndMajors.js';

// @desc    Lấy tất cả các khoa
// @route   GET /api/academic/faculties
// @access  Public
export const getFaculties = (req, res) => {
  try {
    const faculties = getAllFaculties();
    
    res.status(200).json({
      success: true,
      count: faculties.length,
      data: faculties
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khoa:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khoa',
      error: error.message
    });
  }
};

// @desc    Lấy tất cả các ngành của một khoa
// @route   GET /api/academic/faculties/:facultyId/majors
// @access  Public
export const getMajors = (req, res) => {
  try {
    const { facultyId } = req.params;
    const majors = getMajorsByFaculty(facultyId);
    
    if (!majors.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa hoặc khoa không có ngành nào'
      });
    }
    
    res.status(200).json({
      success: true,
      count: majors.length,
      data: majors
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ngành:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách ngành',
      error: error.message
    });
  }
};

// @desc    Lấy tất cả khoa và ngành
// @route   GET /api/academic/all
// @access  Public
export const getAllAcademicData = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: facultiesAndMajors
    });
  } catch (error) {
    console.error('Lỗi khi lấy tất cả dữ liệu học thuật:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};
