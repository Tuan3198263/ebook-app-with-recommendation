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

// Hàm reset password cho tất cả users
const resetAllPasswords = async () => {
  try {
    console.log('🔑 RESET PASSWORD CHO TẤT CẢ USERS');
    console.log('='*50);

    // Đếm số users hiện có
    const totalUsers = await User.countDocuments();
    console.log(`📊 Tổng số users trong database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('⚠️  Không có users nào trong database');
      return;
    }

    // Cập nhật password trực tiếp mà không qua middleware hash
    console.log('\n🔄 Bắt đầu reset password...');
    
    const result = await User.updateMany(
      {}, // Match tất cả users
      { 
        $set: { 
          password: '123456' // Set password trực tiếp không hash
        }
      }
    );

    console.log('\n📊 KẾT QUẢ RESET PASSWORD:');
    console.log(`   ✅ Đã cập nhật: ${result.modifiedCount} users`);
    console.log(`   📝 Password mới: 123456 (không hash)`);
    
    if (result.modifiedCount === totalUsers) {
      console.log('   🎉 Tất cả users đã được reset password thành công!');
    } else {
      console.log(`   ⚠️  Một số users có thể không được cập nhật`);
    }

    // Verify bằng cách lấy vài users sample
    console.log('\n🔍 KIỂM TRA MẪU:');
    const sampleUsers = await User.find({})
      .select('name email password')
      .limit(3);

    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Password: ${user.password === '123456' ? '✅ 123456 (không hash)' : '❌ Vẫn bị hash'}`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi reset password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Hàm reset password cho users cụ thể (optional)
const resetPasswordByRole = async (role = 'student') => {
  try {
    console.log(`🔑 RESET PASSWORD CHO USERS ROLE: ${role.toUpperCase()}`);
    console.log('='*50);

    const result = await User.updateMany(
      { role: role },
      { 
        $set: { 
          password: '123456'
        }
      }
    );

    console.log(`✅ Đã reset password cho ${result.modifiedCount} users có role '${role}'`);

  } catch (error) {
    console.error('❌ Lỗi khi reset password theo role:', error);
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu reset password...\n');
  
  // Kiểm tra argument để xác định chế độ chạy
  const mode = process.argv[2];
  const roleFilter = process.argv[3];

  await connectDB();

  if (mode === 'role' && roleFilter) {
    await resetPasswordByRole(roleFilter);
  } else {
    await resetAllPasswords();
  }
};

main().catch(console.error);
