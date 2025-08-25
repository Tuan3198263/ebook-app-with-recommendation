<template>
  <div class="home-container">
    <!-- Banner đẹp -->
    <div class="banner-section">
      <img src="/logo.png" alt="CTU Ebooks" class="banner-logo" />
      <div class="banner-content">
        <h1>Hệ thống sách điện tử CTU</h1>
        <p class="banner-slogan">
          Nền tảng tri thức số dành cho sinh viên và giảng viên Đại học Cần Thơ
        </p>
      </div>
    </div>

    <div class="welcome-section">
      <p>Chào mừng đến với hệ thống sách điện tử CTU!</p>
      <p>
        Khám phá kho sách, giáo trình và tài liệu học tập dành cho sinh viên và
        giảng viên Đại học Cần Thơ.
      </p>
    </div>

    <div class="features-section">
      <div class="feature-card">
        <i class="fas fa-book fa-3x"></i>
        <h3>Tài liệu đa dạng</h3>
        <p>Hàng nghìn sách và tài liệu đa ngành nghề</p>
      </div>

      <div class="feature-card">
        <i class="fas fa-mobile-alt fa-3x"></i>
        <h3>Đọc mọi lúc mọi nơi</h3>
        <p>Truy cập từ mọi thiết bị, học tập mọi lúc</p>
      </div>

      <div class="feature-card">
        <i class="fas fa-graduation-cap fa-3x"></i>
        <h3>Hỗ trợ học tập</h3>
        <p>Tài liệu chất lượng cao cho sinh viên</p>
      </div>
    </div>
    <!-- Book Recommendations Section -->
    <div class="recommendations-wrapper">
      <BookRecommendations />
    </div>
  </div>
</template>

<script setup>
import BookRecommendations from "../components/recommendations/BookRecommendations.vue";

// Logic cho component trang chủ sẽ đặt ở đây
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.banner-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background: linear-gradient(90deg, #e0e7ff 0%, #f8f9fa 100%);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem 2rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(100, 108, 255, 0.08);
}
.banner-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.12);
}
.banner-content {
  text-align: left;
}
.banner-content h1 {
  font-size: 2.8rem;
  font-weight: 700;
  color: #213547;
  margin-bottom: 0.5rem;
}
.banner-slogan {
  font-size: 1.3rem;
  color: #646cff;
  font-weight: 500;
}

.stats-section {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin: 2.5rem 0 2rem 0;
}
.stat-item {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.08);
  padding: 1.5rem 2rem;
  min-width: 140px;
  text-align: center;
}
.stat-item i {
  font-size: 2rem;
  color: #646cff;
  margin-bottom: 0.5rem;
}
.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  color: #213547;
}
.stat-label {
  font-size: 1rem;
  color: #646cff;
}

.welcome-section {
  margin: 2rem 0;
  font-size: 1.2rem;
}

.recommendations-wrapper {
  margin: 2rem 0;
  padding: 2rem;
}

.features-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
}

.feature-card i {
  color: #646cff;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .features-section {
    flex-direction: column;
    align-items: center;
  }

  .feature-card {
    width: 100%;
    max-width: 300px;
  }
}
</style>
