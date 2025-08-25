import mongoose from 'mongoose';
import User from '../../src/models/user.js';
import connectToDatabase from '../../src/db.js';
import { facultiesAndMajors } from '../../src/data/facultiesAndMajors.js';

// Kết nối database
const connectDB = async () => {
  try {
    await connectToDatabase();
    console.log('✅ Kết nối MongoDB thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

// Danh sách tên sinh viên Việt Nam
const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
  'Ngô Thị Phương', 'Đặng Minh Giang', 'Bùi Thị Hương', 'Vũ Đức Ích', 'Đỗ Thị Kim',
  'Lý Văn Long', 'Trương Thị Mai', 'Phan Hữu Nam', 'Chu Thị Oanh', 'Tạ Văn Phúc',
  'Đinh Thị Quỳnh', 'Lương Minh Rực', 'Võ Thị Sáng', 'Nguyễn Văn Tài', 'Lê Thị Uyên',
  'Trần Hữu Vinh', 'Phạm Thị Xuân', 'Hoàng Đức Yên', 'Ngô Thị Zung', 'Đặng Văn Bảo',
  'Bùi Thị Cẩm', 'Vũ Minh Đăng', 'Đỗ Thị Linh', 'Lý Hữu Giang', 'Trương Thị Hằng',
  'Phan Văn Khánh', 'Chu Thị Liên', 'Tạ Đức Minh', 'Đinh Thị Ngọc', 'Lương Văn Ôn',
  'Võ Thị Phiên', 'Nguyễn Hữu Quang', 'Lê Thị Rạng', 'Trần Văn Sơn', 'Phạm Thị Tâm',
  'Hoàng Minh Ưng', 'Ngô Thị Vân', 'Đặng Hữu Xuân', 'Bùi Thị Yến', 'Vũ Văn Zôn',
  'Đỗ Thị Ánh', 'Lý Minh Bình', 'Trương Thị Châu', 'Phan Văn Đức', 'Chu Thị Én',
  'Tạ Hữu Phát', 'Đinh Thị Gấm', 'Lương Văn Hải', 'Võ Thị Ý', 'Nguyễn Đức Kiên',
  'Lê Thị Loan', 'Trần Hữu Mạnh', 'Phạm Thị Nga', 'Hoàng Văn Ơn', 'Ngô Thị Phúc',
  'Đặng Minh Quý', 'Bùi Thị Rùa', 'Vũ Hữu Sĩ', 'Đỗ Thị Tươi', 'Lý Văn Ung',
  'Trương Thị Vui', 'Phan Đức Xanh', 'Chu Thị Yêu', 'Tạ Văn Zính', 'Đinh Thị Ái',
  'Lương Hữu Bền', 'Võ Thị Cúc', 'Nguyễn Minh Dũng', 'Lê Thị Em', 'Trần Văn Phong',
  'Phạm Thị Giang', 'Hoàng Hữu Hiền', 'Ngô Thị Ích', 'Đặng Văn Kiệt', 'Bùi Thị Lam',
  'Vũ Minh Mẫn', 'Đỗ Thị Nhi', 'Lý Hữu Ổn', 'Trương Thị Phẩm', 'Phan Văn Quế',
  'Chu Thị Rực', 'Tạ Đức Sâm', 'Đinh Thị Tím', 'Lương Văn Út', 'Võ Thị Vững',
  'Nguyễn Hữu Xanh', 'Lê Thị Yến', 'Trần Minh Zung', 'Phạm Thị Ân', 'Hoàng Văn Bổn',
  'Ngô Thị Cúng', 'Đặng Hữu Đạo', 'Bùi Thị Én', 'Vũ Văn Phúc', 'Đỗ Thị Gợi'
];

// Hàm tạo email từ tên với logic tránh trùng lặp
const generateUniqueEmail = (name, index, usedEmails) => {
  // Chuyển đổi tên thành email base
  const nameParts = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
    .replace(/đ/g, 'd')
    .split(' ');
  
  const lastName = nameParts[nameParts.length - 1];
  const firstNames = nameParts.slice(1, -1).map(part => part.charAt(0)).join('');
  
  // Tạo email base với index và thêm random suffix nếu cần
  let baseEmail = `${lastName}${firstNames}${String(index + 1000).padStart(4, '0')}`;
  let email = `${baseEmail}@student.ctu.edu.vn`;
  
  // Nếu email đã tồn tại, thêm suffix ngẫu nhiên
  let suffix = 1;
  while (usedEmails.has(email)) {
    email = `${baseEmail}${suffix}@student.ctu.edu.vn`;
    suffix++;
  }
  
  usedEmails.add(email);
  return email;
};

// Hàm tạo ngày sinh ngẫu nhiên (18-25 tuổi)
const generateDateOfBirth = () => {
  const today = new Date();
  const minAge = 18;
  const maxAge = 25;
  
  const birthYear = today.getFullYear() - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1; // Tránh lỗi ngày tháng
  
  return new Date(birthYear, birthMonth, birthDay);
};

// Hàm chọn faculty và major ngẫu nhiên với phân bố đồng đều
const selectFacultyAndMajor = () => {
  // Phân bố đồng đều cho 6 khoa (mỗi khoa ~16.7%)
  const facultyWeights = {
    'cntt': 0.167,        // 16.7% - Khoa Công nghệ Thông tin
    'khtn': 0.167,        // 16.7% - Khoa Khoa học Tự nhiên  
    'kinh_te': 0.167,     // 16.7% - Khoa Kinh tế
    'giao_duc': 0.167,    // 16.7% - Khoa Giáo dục
    'chinh_tri': 0.166,   // 16.6% - Khoa Chính Trị
    'van_hoc': 0.166      // 16.6% - Khoa Văn học
  };

  // Chọn faculty theo trọng số đồng đều
  const rand = Math.random();
  let cumulative = 0;
  let selectedFacultyId = 'cntt'; // Default

  for (const [facultyId, weight] of Object.entries(facultyWeights)) {
    cumulative += weight;
    if (rand <= cumulative) {
      selectedFacultyId = facultyId;
      break;
    }
  }

  // Tìm faculty được chọn từ facultiesAndMajors
  const selectedFaculty = facultiesAndMajors.find(f => f.id === selectedFacultyId);
  
  if (!selectedFaculty) {
    // Fallback nếu không tìm thấy
    const defaultFaculty = facultiesAndMajors[0];
    const randomMajor = defaultFaculty.majors[Math.floor(Math.random() * defaultFaculty.majors.length)];
    return {
      faculty: defaultFaculty.name,
      major: randomMajor.name
    };
  }

  // Chọn major ngẫu nhiên trong faculty
  const randomMajor = selectedFaculty.majors[Math.floor(Math.random() * selectedFaculty.majors.length)];

  return {
    faculty: selectedFaculty.name,
    major: randomMajor.name
  };
};

// Hàm tạo nhiều users
const createUsers = async (numberOfUsers = 1000) => {
  try {
    console.log(`👥 TẠO ${numberOfUsers} STUDENT USERS MỚI`);
    console.log('='*50);

    // Kiểm tra users hiện có
    const existingCount = await User.countDocuments({ role: 'student' });
    console.log(`📊 Số student users hiện có: ${existingCount}`);

    const users = [];
    const usedEmails = new Set();

    // Lấy danh sách email đã tồn tại
    const existingUsers = await User.find({}, 'email');
    existingUsers.forEach(user => usedEmails.add(user.email));

    console.log(`\n🔄 Bắt đầu tạo ${numberOfUsers} student users...`);

    // Mở rộng danh sách tên để đủ cho 1000 users
    const expandedNames = [];
    for (let i = 0; i < numberOfUsers; i++) {
      const baseName = vietnameseNames[i % vietnameseNames.length];
      
      // Tạo biến thể tên nếu cần
      if (i >= vietnameseNames.length) {
        const variants = [' Minh', ' Hoàng', ' Phương', ' Thảo', ' Linh', ' Hương', ' Tuấn', ' Hùng', ' Mai', ' Lan'];
        const variant = variants[Math.floor(i / vietnameseNames.length) % variants.length];
        expandedNames.push(baseName + variant);
      } else {
        expandedNames.push(baseName);
      }
    }

    for (let i = 0; i < numberOfUsers; i++) {
      const name = expandedNames[i];
      const email = generateUniqueEmail(name, i, usedEmails);
      
      const { faculty, major } = selectFacultyAndMajor();
      const dateOfBirth = generateDateOfBirth();

      const userData = {
        name: name,
        email: email,
        password: '123456', // Password đơn giản cho môi trường test
        dateOfBirth: dateOfBirth,
        faculty: faculty,
        major: major,
        role: 'student' // Chỉ tạo student theo yêu cầu
      };

      users.push(userData);

      // Log progress mỗi 50 users
      if ((i + 1) % 50 === 0) {
        console.log(`   ✓ Đã chuẩn bị ${i + 1}/${numberOfUsers} users`);
      }
    }

    console.log(`\n💾 Bắt đầu lưu ${users.length} users vào database...`);

    // Insert users theo batch để tránh quá tải
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      try {
        // Insert với validateBeforeSave: false để tránh middleware hash password
        const insertedUsers = await User.insertMany(batch, { 
          ordered: false,
          validateBeforeSave: false // Bỏ qua middleware pre-save hash
        });
        successCount += batch.length;
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: Đã lưu ${batch.length} users`);
      } catch (error) {
        // Đếm số lượng thành công và thất bại trong batch
        if (error.writeErrors) {
          const batchSuccess = batch.length - error.writeErrors.length;
          successCount += batchSuccess;
          errorCount += error.writeErrors.length;
          console.log(`   ⚠️  Batch ${Math.floor(i/batchSize) + 1}: ${batchSuccess} thành công, ${error.writeErrors.length} lỗi`);
        } else {
          errorCount += batch.length;
          console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1}: Lỗi toàn bộ batch`);
        }
      }
    }

    console.log(`\n📊 KẾT QUÁ TẠO STUDENT USERS:`);
    console.log(`   ✅ Thành công: ${successCount} users`);
    console.log(`   ❌ Thất bại: ${errorCount} users`);
    console.log(`   📈 Tổng student users trong DB: ${existingCount + successCount}`);

    // Hiển thị thống kê faculty đã tạo
    console.log(`\n📋 THỐNG KÊ FACULTY ĐÃ TẠO (phân bố đồng đều):`);
    const facultyCount = {};
    users.forEach(user => {
      facultyCount[user.faculty] = (facultyCount[user.faculty] || 0) + 1;
    });

    Object.entries(facultyCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([faculty, count]) => {
        const percentage = ((count / users.length) * 100).toFixed(1);
        console.log(`   - ${faculty}: ${count} users (${percentage}%)`);
      });

  } catch (error) {
    console.error('❌ Lỗi khi tạo users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu tạo Users...\n');
  
  // Lấy số lượng users từ command line argument hoặc mặc định 1000
  const numberOfUsers = process.argv[2] ? parseInt(process.argv[2]) : 1000;
  
  if (isNaN(numberOfUsers) || numberOfUsers <= 0) {
    console.error('❌ Số lượng users không hợp lệ');
    process.exit(1);
  }

  await connectDB();
  await createUsers(numberOfUsers);
};

main().catch(console.error);
