<template>
  <footer class="footer mt-auto">
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <h5>Hệ thống sách điện tử CTU</h5>
          <p>
            Website cung cấp sách, giáo trình và tài liệu học tập cho sinh viên,
            giảng viên Đại học Cần Thơ.
          </p>
        </div>
        <div class="col-md-4">
          <h5>Liên kết</h5>
          <ul class="list-unstyled">
            <li><router-link to="/">Trang chủ</router-link></li>
            <li><router-link to="/books">Sách</router-link></li>
            <li><router-link to="/categories">Danh mục</router-link></li>
            <li><router-link to="/about">Giới thiệu</router-link></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h5>Liên hệ</h5>
          <address>
            <p>
              <i class="fas fa-map-marker-alt"></i> 123 Đường Học Vấn, Quận Tri
              Thức
            </p>
            <p><i class="fas fa-phone"></i> (028) 1234 5678</p>
            <p><i class="fas fa-envelope"></i> support@thuvien.edu.vn</p>
          </address>
        </div>
      </div>
      <hr />
      <div class="text-center">
        <p>
          &copy; {{ new Date().getFullYear() }} Hệ thống sách điện tử CTU. Đã
          đăng ký bản quyền.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Logic cho component chân trang
</script>

<style scoped>
.footer {
  background-color: #f8f9fa;
  padding: 3rem 0 1.5rem 0;
  margin-top: 3rem;
}

h5 {
  margin-bottom: 1.2rem;
  font-weight: 600;
  color: #213547;
}

a {
  color: #646cff;
  text-decoration: none;
}

a:hover {
  color: #535bf2;
  text-decoration: underline;
}

address {
  margin-bottom: 0;
}

address p {
  margin-bottom: 0.5rem;
}

address i {
  width: 20px;
  margin-right: 8px;
}

hr {
  margin: 2rem 0;
}
</style>
