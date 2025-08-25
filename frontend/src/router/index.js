import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/authStore';

// Tải các routes theo kiểu lazy-loading để cải thiện hiệu suất
const Home = () => import('../views/Home.vue');
const NotFound = () => import('../views/NotFound.vue');
const Login = () => import('../views/auth/Login.vue');
const Register = () => import('../views/auth/Register.vue');
// Profile routes
const ProfileLayout = () => import('../views/profile/ProfileLayout.vue');
const ProfileInfo = () => import('../views/profile/ProfileInfo.vue');
const ProfileAddress = () => import('../views/profile/ProfileAddress.vue');
const ProfileFavorites = () => import('../views/profile/ProfileFavorites.vue');
// const ProfileReviews = () => import('../views/profile/ProfileReviews.vue'); // Tạm thời comment nếu file không tồn tại
const ProfileRecentlyViewed = () => import('../views/profile/ProfileRecentlyViewed.vue');
const ProfileOrders = () => import('../views/profile/ProfileOrders.vue');
const ProfileLicenses = () => import('../views/profile/ProfileLicenses.vue');

// Product/Category routes
const CategoryProducts = () => import('../views/category/CategoryProducts.vue');
const SearchProducts = () => import('../views/search/SearchProducts.vue');
const BookDetail = () => import('../views/book/BookDetail.vue');
const Cart = () => import('../views/cart/Cart.vue');

// Admin routes
const AdminLayout = () => import('../views/admin/AdminLayout.vue');
const AdminDashboard = () => import('../views/admin/Dashboard.vue');
const CategoryManagement = () => import('../views/admin/categories/CategoryManagement.vue');
const AuthorManagement = () => import('../views/admin/authors/AuthorManagement.vue');
const BookManagement = () => import('../views/admin/books/BookManagement.vue');
const AddBook = () => import('../views/admin/books/AddBook.vue');
const EditBook = () => import('../views/admin/books/EditBook.vue');
const OrderManagement = () => import('../views/admin/orders/OrderManagement.vue');
// Payment routes
const PaymentResult = () => import('../views/payment/PaymentResult.vue');
// Reader routes
const BookReader = () => import('../views/reader/BookReader.vue');

const UserManagement = () => import('../views/admin/user/UserManagement.vue');

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Trang chủ' }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { title: 'Đăng nhập' },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        // Nếu đã đăng nhập, chuyển hướng về trang chủ
        next({ name: 'home' });
      } else {
        next();
      }
    }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { title: 'Đăng ký' },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        // Nếu đã đăng nhập, chuyển hướng về trang chủ
        next({ name: 'home' });
      } else {
        next();
      }
    }
  },
  {
    path: '/profile',
    component: ProfileLayout,
    meta: { 
      requiresAuth: true,
      title: 'Thông tin cá nhân'
    },
    children: [
      {
        path: '',
        name: 'profile-info',
        component: ProfileInfo,
        meta: { title: 'Thông tin cá nhân' }
      },      {
        path: 'address',
        name: 'profile-address',
        component: ProfileAddress,
        meta: { title: 'Địa chỉ' }
      },      {
        path: 'orders',
        name: 'profile-orders',
        component: ProfileOrders,
        meta: { title: 'Đơn hàng của tôi' }
      },
      {
        path: 'orders/:id',
        name: 'profile-order-detail',
        component: () => import('@/views/profile/ProfileOrderDetail.vue'),
        meta: { title: 'Chi tiết đơn hàng' }
      },
   
      {
        path: 'favorites',
        name: 'profile-favorites',
        component: ProfileFavorites,
        meta: { title: 'Yêu thích' }
      },
           {
        path: 'recently-viewed',
        name: 'profile-recently-viewed',
        component: ProfileRecentlyViewed,
        meta: { title: 'Đã xem gần đây' }
      },
      {
        path: 'licenses',
        name: 'profile-licenses',
        component: ProfileLicenses,
        meta: { title: 'Bản quyền sách' }
      },
      {
        path: 'licenses/:id',
        name: 'profile-license-detail',
        component: () => import('@/views/profile/ProfileLicenseDetail.vue'),
        meta: { title: 'Chi tiết bản quyền' }
      }
    ]
  },
  {
    path: '/category/:slug',
    name: 'category-products',
    component: CategoryProducts,
    props: true,
    meta: { title: 'Danh mục sản phẩm' }
  },
  {
    path: '/search',
    name: 'search-products',
    component: SearchProducts,
    meta: { title: 'Tìm kiếm sản phẩm' }
  },
  {
    path: '/book/:slug',
    name: 'book-detail',
    component: BookDetail,
    props: true,
    meta: { title: 'Chi tiết sách' }
  },
  {
    path: '/read/:slug',
    name: 'book-reader',
    component: BookReader,
    props: true,
    meta: { 
      requiresAuth: true,
      title: 'Đọc sách',
      layout: 'reader' // Layout đặc biệt cho reader
    }
  },
  {
    path: '/cart',
    name: 'cart',
    component: Cart,
    meta: { 
      requiresAuth: true,
      title: 'Giỏ hàng' 
    }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Quản trị viên'
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { title: 'Bảng điều khiển' }
      },
      {
        path: 'categories',
        name: 'category-management',
        component: CategoryManagement,
        meta: { title: 'Quản lý danh mục' }
      },
      {
        path: 'authors',
        name: 'author-management',
        component: AuthorManagement,
        meta: { title: 'Quản lý tác giả' }
      },
      {
        path: 'books',
        name: 'book-management',
        component: BookManagement,
        meta: { title: 'Quản lý sách' }
      },
      {
        path: 'books/add',
        name: 'add-book',
        component: AddBook,
        meta: { title: 'Thêm sách mới' }
      },      {
        path: 'books/edit/:id',
        name: 'edit-book',
        component: EditBook,
        props: true,
        meta: { title: 'Chỉnh sửa sách' }
      },
      {
        path: 'orders',
        name: 'order-management',
        component: OrderManagement,
        meta: { title: 'Quản lý đơn hàng' }
      },
       {
        path: 'users',
        name: 'user-management',
        component: UserManagement,
        meta: { title: 'Quản lý người dùng' }
      },
    ]
  },
  {
    path: '/payment/result',
    name: 'payment-result',
    component: PaymentResult,
    meta: { 
      requiresAuth: true,
      title: 'Kết quả thanh toán' 
    }
  },
  // Route dạng wildcard cho trang 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { title: 'Không tìm thấy trang' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Cuộn đến vị trí đã lưu nếu có, nếu không thì cuộn lên đầu trang
    return savedPosition || { top: 0 };
  }
});

// Navigation guard để cập nhật tiêu đề trang và kiểm tra xác thực
router.beforeEach((to, from, next) => {
  // Cập nhật tiêu đề trang
  document.title = to.meta.title || 'Thư viện trực tuyến';
  
  // Lấy auth store
  const authStore = useAuthStore();
  
  // Kiểm tra xác thực
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ 
      name: 'login',
      query: { redirect: to.fullPath } 
    });
  } 
  // Kiểm tra quyền admin
  else if (to.meta.requiresAdmin && authStore.role !== 'admin') {
    next({ name: 'home' });
  }
  else {
    next();
  }
});

export default router;
