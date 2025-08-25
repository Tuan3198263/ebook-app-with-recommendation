import Cart from '../models/cart.js';
import Book from '../models/book.js';

// Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.book', 'title coverImages slug active ebookOptions');

    if (!cart) {
      // Trả về thông báo người dùng chưa có giỏ hàng thay vì tự động tạo
      return res.status(200).json({
        status: 'success',
        message: 'Người dùng chưa có giỏ hàng',
        data: {
          cart: {
            user: req.user.id,
            items: [],
            totalAmount: 0,
            totalItems: 0,
            lastUpdated: null,
            createdAt: null,
            updatedAt: null
          }
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        cart
      }
    });
  } catch (error) {
    // Xử lý lỗi unique constraint khi tạo cart
    if (error.code === 11000 && error.keyPattern && error.keyPattern.user) {
      return res.status(409).json({
        status: 'error',
        message: 'Người dùng đã có giỏ hàng, vui lòng thử lại',
        error: 'Duplicate cart for user'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy giỏ hàng',
      error: error.message
    });
  }
};

// Thêm sách vào giỏ hàng hoặc cập nhật giá thuê
export const addToCart = async (req, res) => {
  try {
    const { bookId, duration, price } = req.body;

    // Kiểm tra user có tồn tại không
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Người dùng chưa đăng nhập hoặc token không hợp lệ'
      });
    }

    const userId = req.user.id;

    // Kiểm tra sách có tồn tại và đang hoạt động
    const book = await Book.findById(bookId);
    if (!book || !book.active) {
      return res.status(404).json({
        status: 'error',
        message: 'Sách không tồn tại hoặc đã ngưng hoạt động'
      });
    }

    // Kiểm tra giá có hợp lệ với ebookOptions của sách
    const validOption = book.ebookOptions.find(
      option => option.duration === duration && option.price === price
    );
    
    if (!validOption) {
      return res.status(400).json({
        status: 'error',
        message: 'Gói thuê không hợp lệ'
      });
    }

    // Tìm hoặc tạo giỏ hàng với userId đã xác định
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      try {
        cart = new Cart({ 
          user: userId, 
          items: [],
          totalAmount: 0,
          totalItems: 0
        });
      } catch (createError) {
        return res.status(400).json({
          status: 'error',
          message: 'Lỗi khi tạo giỏ hàng mới',
          error: createError.message
        });
      }
    }

    // Kiểm tra xem sách đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex(
      item => item.book.toString() === bookId.toString()
    );

    if (existingItemIndex > -1) {
      // Nếu đã có, cập nhật gói ebook mới
      cart.items[existingItemIndex].ebookOption = {
        duration,
        price
      };
      cart.items[existingItemIndex].addedAt = new Date();
    } else {
      // Nếu chưa có, thêm mới
      cart.items.push({
        book: bookId,
        ebookOption: {
          duration,
          price
        }
      });
    }

    // Lưu cart với xử lý lỗi cụ thể
    try {
      await cart.save();
    } catch (saveError) {
      console.log('Save Error:', saveError); // Debug log
      
      // Xử lý lỗi unique constraint cho user
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.user) {
        return res.status(409).json({
          status: 'error',
          message: 'Người dùng đã có giỏ hàng, vui lòng thử lại'
        });
      }
      
      // Xử lý lỗi validation khác
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map(err => err.message);
        return res.status(400).json({
          status: 'error',
          message: 'Dữ liệu không hợp lệ',
          errors: errors
        });
      }
      
      throw saveError; // Ném lại lỗi khác để catch bên ngoài xử lý
    }

    // Populate thông tin sách trước khi trả về
    await cart.populate('items.book', 'title coverImages slug active');

    res.status(200).json({
      status: 'success',
      message: existingItemIndex > -1 ? 'Đã cập nhật gói thuê sách' : 'Đã thêm sách vào giỏ hàng',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('AddToCart Error:', error); // Log để debug
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi thêm sách vào giỏ hàng',
      error: error.message
    });
  }
};

// Thay đổi giá thuê của sách trong giỏ hàng
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { duration, price } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    // Kiểm tra giá có hợp lệ với ebookOptions của sách
    const book = await Book.findById(item.book);
    const validOption = book.ebookOptions.find(
      option => option.duration === duration && option.price === price
    );
    
    if (!validOption) {
      return res.status(400).json({
        status: 'error',
        message: 'Gói thuê không hợp lệ'
      });
    }

    // Cập nhật gói ebook
    item.ebookOption = {
      duration,
      price
    };
    item.addedAt = new Date();

    await cart.save();
    await cart.populate('items.book', 'title coverImages slug active');

    res.status(200).json({
      status: 'success',
      message: 'Đã cập nhật gói thuê sách',
      data: {
        cart
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi cập nhật giỏ hàng',
      error: error.message
    });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    // Sử dụng phương thức mới để xóa item
    cart.items.pull(itemId);
    await cart.save();

    await cart.populate('items.book', 'title coverImages slug active');

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: {
        cart
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng',
      error: error.message
    });
  }
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa toàn bộ giỏ hàng',
      data: {
        cart
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xóa giỏ hàng',
      error: error.message
    });
  }
};
