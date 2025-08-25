import mongoose from 'mongoose';
import User from '../../src/models/user.js';
import connectToDatabase from '../../src/db.js';

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

// Hàm thống kê users trong database
const getUserStatistics = async () => {
  try {
    console.log('📊 THỐNG KÊ USERS STUDENT TRONG DATABASE');
    console.log('='*50);

    // 1. Đếm tổng số users và students
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    console.log(`\n1️⃣ TỔNG QUAN:`);
    console.log(`   - Tổng số users: ${totalUsers}`);
    console.log(`   - Tổng số students: ${totalStudents}`);

    if (totalStudents === 0) {
      console.log('⚠️  Database chưa có student nào.');
      return;
    }

    // 2. Thống kê theo role (hiển thị tất cả roles)
    console.log(`\n2️⃣ PHÂN BỐ THEO ROLE:`);
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    roleStats.forEach(stat => {
      const percentage = ((stat.count / totalUsers) * 100).toFixed(1);
      console.log(`   - ${stat._id}: ${stat.count} users (${percentage}%)`);
    });

    // 3. Thống kê theo faculty (chỉ students)
    console.log(`\n3️⃣ PHÂN BỐ THEO KHOA (Chỉ Students):`);
    const facultyStats = await User.aggregate([
      {
        $match: {
          role: 'student',
          faculty: { $ne: '' } // Lọc bỏ faculty rỗng
        }
      },
      {
        $group: {
          _id: '$faculty',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    if (facultyStats.length > 0) {
      facultyStats.forEach(stat => {
        const percentage = ((stat.count / totalStudents) * 100).toFixed(1);
        console.log(`   - ${stat._id}: ${stat.count} students (${percentage}%)`);
      });
    } else {
      console.log('   - Chưa có student nào có thông tin faculty');
    }

    // 4. Thống kê theo major (chỉ students)
    console.log(`\n4️⃣ PHÂN BỐ THEO NGÀNH (Chỉ Students):`);
    const majorStats = await User.aggregate([
      {
        $match: {
          role: 'student',
          major: { $ne: '' } // Lọc bỏ major rỗng
        }
      },
      {
        $group: {
          _id: '$major',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 } // Chỉ hiển thị top 10
    ]);

    if (majorStats.length > 0) {
      majorStats.forEach(stat => {
        const percentage = ((stat.count / totalStudents) * 100).toFixed(1);
        console.log(`   - ${stat._id}: ${stat.count} students (${percentage}%)`);
      });
    } else {
      console.log('   - Chưa có student nào có thông tin major');
    }

    // 5. Thống kê students có đầy đủ thông tin
    console.log(`\n5️⃣ THỐNG KÊ THÔNG TIN PROFILE (Chỉ Students):`);
    const completeProfileCount = await User.countDocuments({
      role: 'student',
      faculty: { $ne: '' },
      major: { $ne: '' }
    });
    
    const incompleteProfileCount = totalStudents - completeProfileCount;
    
    console.log(`   - Students có đầy đủ faculty + major: ${completeProfileCount} (${((completeProfileCount/totalStudents)*100).toFixed(1)}%)`);
    console.log(`   - Students thiếu thông tin profile: ${incompleteProfileCount} (${((incompleteProfileCount/totalStudents)*100).toFixed(1)}%)`);

    // 6. Students mới nhất
    console.log(`\n6️⃣ STUDENTS MỚI NHẤT (Top 5):`);
    const recentStudents = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email faculty major role createdAt');

    recentStudents.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Faculty: ${user.faculty || 'Chưa có'}, Major: ${user.major || 'Chưa có'}`);
      console.log(`      Ngày tạo: ${user.createdAt.toLocaleDateString('vi-VN')}`);
    });

    // 7. Thống kê theo tháng đăng ký (chỉ students)
    console.log(`\n7️⃣ THỐNG KÊ THEO THÁNG ĐĂNG KÝ (Chỉ Students):`);
    const monthlyStats = await User.aggregate([
      {
        $match: { role: 'student' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    monthlyStats.forEach(stat => {
      console.log(`   - ${stat._id.month}/${stat._id.year}: ${stat.count} students`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi thống kê users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu thống kê Users...\n');
  await connectDB();
  await getUserStatistics();
};

main().catch(console.error);
