// Middleware kiểm tra quyền Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, yêu cầu quyền quản trị viên'
    });
  }
};

// Middleware kiểm tra quyền Giáo viên
export const isTeacher = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, yêu cầu quyền giáo viên'
    });
  }
};
