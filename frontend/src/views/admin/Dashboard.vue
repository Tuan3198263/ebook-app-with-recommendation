<template>
  <div class="dashboard">
    <h1 class="mb-4">Bảng điều khiển</h1>

    <div class="row">
      <!-- Card tổng quan -->
      <div
        class="col-xl-3 col-md-6 mb-4"
        v-for="(stat, index) in stats"
        :key="index"
      >
        <div
          class="card border-left-primary h-100 py-2"
          :class="`border-left-${stat.color}`"
        >
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div
                  class="text-xs font-weight-bold text-uppercase mb-1"
                  :class="`text-${stat.color}`"
                >
                  {{ stat.title }}
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stat.value }}
                </div>
                <div class="small text-muted mt-2">{{ stat.change }}</div>
              </div>
              <div class="col-auto">
                <i :class="`fas fa-${stat.icon} fa-2x text-gray-300`"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <!-- Thống kê phân bố user theo vai trò -->
      <div class="col-md-4 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Phân bố user theo vai trò
            </h6>
          </div>
          <div class="card-body">
            <ul class="list-group">
              <li
                v-for="role in userStats.roleStats"
                :key="role._id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ role._id === "admin" ? "Admin" : "Student" }}</span>
                <span class="badge bg-primary rounded-pill">{{
                  role.count
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <!-- Thống kê trạng thái đơn hàng -->
      <div class="col-md-4 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Trạng thái đơn hàng
            </h6>
          </div>
          <div class="card-body">
            <ul class="list-group">
              <li
                v-for="status in orderStats.statusStats"
                :key="status._id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ status._id }}</span>
                <span class="badge bg-info rounded-pill">{{
                  status.count
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <!-- Phân bố sách theo danh mục -->
      <div class="col-md-4 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Phân bố sách theo danh mục
            </h6>
          </div>
          <div class="card-body">
            <ul class="list-group">
              <li
                v-for="cat in bookStats.categoryStats"
                :key="cat._id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ cat.categoryName || cat._id }}</span>
                <span class="badge bg-success rounded-pill">{{
                  cat.count
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <!-- Top user hoạt động -->
      <div class="col-md-6 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Top user hoạt động (đơn hàng)
            </h6>
          </div>
          <div class="card-body">
            <table class="table table-borderless">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Số đơn hàng</th>
                  <th>Tổng giá trị</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in topOrderUsers" :key="user._id">
                  <td>{{ user.name || "--" }}</td>
                  <td>{{ user.email || "--" }}</td>
                  <td>{{ user.orderCount }}</td>
                  <td>{{ user.totalAmount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Top user yêu thích sách -->
      <div class="col-md-6 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Top user yêu thích sách
            </h6>
          </div>
          <div class="card-body">
            <table class="table table-borderless">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Lượt yêu thích</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in topFavoriteUsers" :key="user._id">
                  <td>{{ user.name || "--" }}</td>
                  <td>{{ user.email || "--" }}</td>
                  <td>{{ user.favoriteCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <!-- Top sách được mua nhiều nhất -->
      <div class="col-md-6 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Top sách được mua nhiều nhất
            </h6>
          </div>
          <div class="card-body">
            <table class="table table-borderless">
              <thead>
                <tr>
                  <th>Hình bìa</th>
                  <th>Tên sách</th>
                  <th>Danh mục</th>
                  <th>Lượt mua</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="book in topOrderBooks" :key="book._id">
                  <td>
                    <img
                      v-if="book.coverImage"
                      :src="book.coverImage"
                      alt="cover"
                      style="
                        width: 40px;
                        height: 60px;
                        object-fit: cover;
                        border-radius: 4px;
                      "
                    />
                  </td>
                  <td>{{ book.title }}</td>
                  <td>{{ book.categoryName }}</td>
                  <td>{{ book.orderCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <!-- Top sách được yêu thích nhất -->
      <div class="col-md-6 mb-4">
        <div class="card shadow h-100">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">
              Top sách được yêu thích nhất
            </h6>
          </div>
          <div class="card-body">
            <table class="table table-borderless">
              <thead>
                <tr>
                  <th>Hình bìa</th>
                  <th>Tên sách</th>
                  <th>Danh mục</th>
                  <th>Lượt yêu thích</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="book in topFavoriteBooks" :key="book._id">
                  <td>
                    <img
                      v-if="book.coverImage"
                      :src="book.coverImage"
                      alt="cover"
                      style="
                        width: 40px;
                        height: 60px;
                        object-fit: cover;
                        border-radius: 4px;
                      "
                    />
                  </td>
                  <td>{{ book.title }}</td>
                  <td>{{ book.categoryName }}</td>
                  <td>{{ book.favoriteCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import dashboardService from "../../services/dashboardService";

const stats = ref([]);
const activities = ref([]);
const latestBooks = ref([]);
const loading = ref(true);
const overview = ref({});
const bookStats = ref({});
const userStats = ref({});
const orderStats = ref({});
const categoryStats = ref({});
const authorStats = ref({});

// Thêm các biến cho top bảng
const topOrderUsers = ref([]);
const topFavoriteUsers = ref([]);
const topOrderBooks = ref([]);
const topFavoriteBooks = ref([]);

onMounted(async () => {
  loading.value = true;
  try {
    // Tổng quan
    const overviewRes = await dashboardService.getOverview();
    overview.value = overviewRes.data;

    // Sách
    const bookRes = await dashboardService.getBookStats();
    bookStats.value = bookRes.data;

    // User
    const userRes = await dashboardService.getUserStats();
    userStats.value = userRes.data;

    // Đơn hàng
    const orderRes = await dashboardService.getOrderStats();
    orderStats.value = orderRes.data;

    // Danh mục
    const categoryRes = await dashboardService.getCategoryStats();
    categoryStats.value = categoryRes.data;

    // Tác giả
    const authorRes = await dashboardService.getAuthorStats();
    authorStats.value = authorRes.data;

    // Top user hoạt động (đơn hàng)
    const topOrderUsersRes = await dashboardService.getTopOrderUsers();
    topOrderUsers.value = topOrderUsersRes.data.topOrderUsers || [];

    // Top user yêu thích sách
    const topActiveUsersRes = await dashboardService.getTopActiveUsers();
    topFavoriteUsers.value = topActiveUsersRes.data.topFavoriteUsers || [];

    // Top sách
    const topBooksRes = await dashboardService.getTopBooks();
    topOrderBooks.value = topBooksRes.data.topOrderBooks || [];
    topFavoriteBooks.value = topBooksRes.data.topFavoriteBooks || [];

    // Hoạt động gần đây: có thể lấy từ các API khác hoặc để trống nếu chưa có
    activities.value = [];

    // Chuẩn bị dữ liệu cho card tổng quan
    stats.value = [
      {
        title: "TỔNG SỐ USER",
        value: overview.value.totalUsers,
        icon: "users",
        color: "primary",
      },
      {
        title: "TỔNG SỐ SÁCH",
        value: overview.value.totalBooks,
        icon: "book",
        color: "success",
      },
      {
        title: "TỔNG ĐƠN HÀNG",
        value: overview.value.totalOrders,
        icon: "shopping-cart",
        color: "info",
      },
      {
        title: "DOANH THU",
        value: overview.value.totalRevenue,
        icon: "money-bill",
        color: "warning",
      },
      {
        title: "DANH MỤC",
        value: categoryStats.value.totalCategories,
        icon: "list",
        color: "primary",
      },
      {
        title: "TÁC GIẢ",
        value: authorStats.value.totalAuthors,
        icon: "user-edit",
        color: "success",
      },
    ];
  } catch (err) {
    // Xử lý lỗi
    console.error("Lỗi tải dữ liệu dashboard:", err);
  }
  loading.value = false;
});
</script>

<style scoped>
.dashboard h1 {
  color: #3c4b64;
  font-weight: 600;
}

.card {
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
}

.card-header {
  background-color: #f8f9fc;
  border-bottom: 1px solid #e3e6f0;
}

.border-left-primary {
  border-left: 0.25rem solid #4e73df !important;
}

.border-left-success {
  border-left: 0.25rem solid #1cc88a !important;
}

.border-left-info {
  border-left: 0.25rem solid #36b9cc !important;
}

.border-left-warning {
  border-left: 0.25rem solid #f6c23e !important;
}

.text-primary {
  color: #4e73df !important;
}

.text-success {
  color: #1cc88a !important;
}

.text-info {
  color: #36b9cc !important;
}

.text-warning {
  color: #f6c23e !important;
}

.text-xs {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.chart-area,
.chart-pie {
  height: 20rem;
  position: relative;
}

.activity-feed {
  padding: 0.5rem;
}

.activity-item {
  display: flex;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

table {
  font-size: 0.9rem;
}
</style>
