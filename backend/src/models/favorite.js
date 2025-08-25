import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID người dùng là bắt buộc']
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'ID sách là bắt buộc']
  }
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Tạo index phức hợp để đảm bảo mỗi người dùng không thể yêu thích một sách nhiều lần
favoriteSchema.index({ user: 1, book: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
