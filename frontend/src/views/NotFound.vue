<template>
  <div class="not-found-container">
    <div class="error-code">404</div>
    <h1>Không tìm thấy trang</h1>
    <p>Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
    <router-link to="/" class="home-button">
      <i class="fas fa-home"></i> Trở về trang chủ
    </router-link>
  </div>
</template>

<script setup>
// Logic cho component trang Không tìm thấy
</script>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  height: 70vh;
  text-align: center;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  color: #646cff;
  margin-bottom: 1rem;
  line-height: 1;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 500px;
}

.home-button {
  background-color: #646cff;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: #535bf2;
}
</style>
