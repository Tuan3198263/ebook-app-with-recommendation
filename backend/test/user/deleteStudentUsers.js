import mongoose from 'mongoose';
import User from '../../src/models/user.js';
import RecentlyViewed from '../../src/models/recentlyViewed.js';
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

// Hàm xóa tất cả student users và dữ liệu liên quan
const deleteAllStudentUsers = async () => {
  try {
    console.log('🗑️  XÓA TẤT CẢ STUDENT USERS');
    console.log('='.repeat(50));

    // Kiểm tra số lượng student users hiện có
    const studentCount = await User.countDocuments({ role: 'student' });
    const totalCount = await User.countDocuments();
    
    console.log(`📊 Thống kê hiện tại:`);
    console.log(`   - Tổng users: ${totalCount}`);
    console.log(`   - Student users: ${studentCount}`);
    console.log(`   - Non-student users: ${totalCount - studentCount}`);

    if (studentCount === 0) {
      console.log('\n✅ Không có student users nào để xóa');
      return;
    }

    // Xác nhận xóa
    console.log(`\n⚠️  CẢNH BÁO: Sẽ xóa ${studentCount} student users và dữ liệu liên quan!`);
    console.log('   - Xóa student users');
    console.log('   - Xóa recently viewed data của students');
    console.log('   - Giữ nguyên admin/teacher users');

    // Bước 1: Lấy danh sách student user IDs
    console.log(`\n🔍 Lấy danh sách student user IDs...`);
    const studentUsers = await User.find({ role: 'student' }, '_id');
    const studentUserIds = studentUsers.map(user => user._id);
    
    console.log(`   ✓ Tìm thấy ${studentUserIds.length} student user IDs`);

    // Bước 2: Xóa recently viewed data của students
    console.log(`\n🗑️  Xóa recently viewed data...`);
    const recentlyViewedDeleteResult = await RecentlyViewed.deleteMany({
      userId: { $in: studentUserIds }
    });
    console.log(`   ✓ Đã xóa ${recentlyViewedDeleteResult.deletedCount} recently viewed records`);

    // Bước 3: Xóa student users
    console.log(`\n🗑️  Xóa student users...`);
    const userDeleteResult = await User.deleteMany({ role: 'student' });
    console.log(`   ✓ Đã xóa ${userDeleteResult.deletedCount} student users`);

    // Kiểm tra kết quả cuối cùng
    const remainingStudents = await User.countDocuments({ role: 'student' });
    const remainingTotal = await User.countDocuments();
    
    console.log(`\n📊 KẾT QUÁ SAU KHI XÓA:`);
    console.log(`   ✅ Đã xóa student users: ${userDeleteResult.deletedCount}`);
    console.log(`   ✅ Đã xóa recently viewed: ${recentlyViewedDeleteResult.deletedCount}`);
    console.log(`   📈 Student users còn lại: ${remainingStudents}`);
    console.log(`   📈 Tổng users còn lại: ${remainingTotal}`);

    if (remainingStudents === 0) {
      console.log(`\n🎉 XÓA THÀNH CÔNG! Tất cả student users đã được xóa sạch.`);
      console.log(`   - Database đã sẵn sàng để tạo dữ liệu student mới`);
      console.log(`   - Chạy createUsers.js để tạo student users mới`);
      console.log(`   - Chạy createRecentlyViewed.js để tạo interaction data`);
    } else {
      console.log(`\n⚠️  Vẫn còn ${remainingStudents} student users chưa được xóa`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi xóa student users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Hàm xóa với xác nhận
const deleteWithConfirmation = async () => {
  const args = process.argv.slice(2);
  const forceDelete = args.includes('--force') || args.includes('-f');

  if (!forceDelete) {
    console.log('⚠️  Để xóa tất cả student users, chạy lệnh với flag --force:');
    console.log('   node deleteStudentUsers.js --force');
    console.log('\n💡 Lưu ý: Thao tác này sẽ xóa VĨNH VIỄN tất cả student users!');
    process.exit(0);
  }

  await deleteAllStudentUsers();
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu xóa Student Users...\n');
  await connectDB();
  await deleteWithConfirmation();
};

main().catch(console.error);
