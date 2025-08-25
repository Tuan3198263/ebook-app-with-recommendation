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

// Kiểm tra chi tiết users
const checkUsers = async () => {
  try {
    console.log('🔍 KIỂM TRA CHI TIẾT USERS');
    console.log('='*50);

    // 1. Đếm tổng số users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Tổng số users: ${totalUsers}`);

    // 2. Đếm theo role
    const roles = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`\n📋 Phân bố role:`);
    roles.forEach(role => {
      console.log(`   - ${role._id}: ${role.count} users`);
    });

    // 3. Kiểm tra users có faculty/major trống
    const emptyProfile = await User.find({
      $or: [
        { faculty: { $in: ['', null] } },
        { major: { $in: ['', null] } }
      ]
    }, 'name email faculty major role').limit(10);

    if (emptyProfile.length > 0) {
      console.log(`\n⚠️  Users có thông tin thiếu (${emptyProfile.length}):`);
      emptyProfile.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      Role: ${user.role}, Faculty: "${user.faculty}", Major: "${user.major}"`);
      });
    } else {
      console.log(`\n✅ Tất cả users đều có đầy đủ faculty + major`);
    }

    // 4. Kiểm tra users được tạo hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayUsers = await User.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    console.log(`\n📅 Users được tạo hôm nay: ${todayUsers}`);

    // 5. Sample một vài users gần đây
    console.log(`\n📋 Sample 5 users gần đây:`);
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email faculty major role createdAt');

    recentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.role})`);
      console.log(`      Faculty: ${user.faculty}`);
      console.log(`      Major: ${user.major}`);
      console.log(`      Created: ${user.createdAt.toLocaleString('vi-VN')}\n`);
    });

    // 6. Kiểm tra trùng email
    const duplicateEmails = await User.aggregate([
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          users: { $push: { name: '$name', role: '$role' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicateEmails.length > 0) {
      console.log(`\n⚠️  Email trùng lặp (${duplicateEmails.length}):`);
      duplicateEmails.forEach(dup => {
        console.log(`   - ${dup._id}: ${dup.count} users`);
        dup.users.forEach(user => {
          console.log(`     • ${user.name} (${user.role})`);
        });
      });
    } else {
      console.log(`\n✅ Không có email trùng lặp`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Đã đóng kết nối database');
  }
};

// Chạy script
const main = async () => {
  console.log('🚀 Bắt đầu kiểm tra Users...\n');
  await connectDB();
  await checkUsers();
};

main().catch(console.error);
