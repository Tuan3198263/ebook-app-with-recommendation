export const facultiesAndMajors = [
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
      { id: "ttdpt", name: "Truyền thông đa phương tiện" }
    ]
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
      { id: "ktmt", name: "Kỹ thuật môi trường" }
    ]
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
      { id: "ktnn", name: "Kinh tế nông nghiệp" }
    ]
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
      { id: "gd_tc", name: "Giáo dục Thể chất" }
    ]
  },
  {
    id: "chinh_tri",
    name: "Khoa Chính Trị",
    majors: [
      { id: "triet_hoc", name: "Triết học" },
      { id: "lich_su", name: "Lịch sử" },
      { id: "xa_hoi", name: "Xã hội học" },
      { id: "ct_xh", name: "Công tác xã hội" }
    ]
  },
  {
    id: "van_hoc",
    name: "Khoa Văn học",
    majors: [
      { id: "van_hoc", name: "Văn học" },
      { id: "nn_viet", name: "Ngôn ngữ Việt & Văn hóa Việt Nam" },
      { id: "nn_anh", name: "Ngôn ngữ Anh" }
    ]
  }
];

// Mapping khoa/ngành với danh mục sách
export const facultyBookCategoryMapping = {
  "cntt": "Công nghệ thông tin",
  "khtn": "Khoa học tự nhiên", 
  "kinh_te": "Kinh tế",
  "giao_duc": "Giáo dục", 
  "chinh_tri": "Chính trị",
  "van_hoc": "Văn học"
};

// Hàm trợ giúp: Lấy danh sách tất cả các khoa
export const getAllFaculties = () => {
  return facultiesAndMajors.map(faculty => ({
    id: faculty.id,
    name: faculty.name
  }));
};

// Hàm trợ giúp: Lấy danh sách ngành học của một khoa
export const getMajorsByFaculty = (facultyId) => {
  const faculty = facultiesAndMajors.find(f => f.id === facultyId);
  return faculty ? faculty.majors : [];
};

// Hàm trợ giúp: Lấy thông tin chi tiết của một ngành học
export const getMajorDetail = (facultyId, majorId) => {
  const faculty = facultiesAndMajors.find(f => f.id === facultyId);
  if (!faculty) return null;
  
  const major = faculty.majors.find(m => m.id === majorId);
  return major ? { 
    ...major,
    faculty: {
      id: faculty.id,
      name: faculty.name
    } 
  } : null;
};

// Hàm trợ giúp: Lấy danh mục sách phù hợp với khoa
export const getBookCategoriesByFaculty = (facultyId) => {
  const categories = facultyBookCategoryMapping[facultyId];
  return Array.isArray(categories) ? categories : [categories];
};

// Hàm trợ giúp: Lấy tất cả ngành học theo danh mục sách
export const getMajorsByBookCategory = (bookCategory) => {
  const relatedMajors = [];
  
  Object.entries(facultyBookCategoryMapping).forEach(([facultyId, categories]) => {
    const categoryList = Array.isArray(categories) ? categories : [categories];
    if (categoryList.includes(bookCategory)) {
      const faculty = facultiesAndMajors.find(f => f.id === facultyId);
      if (faculty) {
        relatedMajors.push(...faculty.majors.map(major => ({
          ...major,
          facultyId: faculty.id,
          facultyName: faculty.name
        })));
      }
    }
  });
  
  return relatedMajors;
};

export default facultiesAndMajors;