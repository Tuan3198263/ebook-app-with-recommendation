import express from 'express';
import {
  getFaculties,
  getMajors,
  getAllAcademicData
} from '../controllers/academicController.js';

const router = express.Router();

// Lấy tất cả khoa
router.get('/faculties', getFaculties);

// Lấy tất cả ngành của một khoa
router.get('/faculties/:facultyId/majors', getMajors);

// Lấy tất cả dữ liệu khoa và ngành
router.get('/all', getAllAcademicData);

export default router;
