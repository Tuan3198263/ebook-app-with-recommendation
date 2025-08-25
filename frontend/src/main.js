import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router'; // Import router

// Bootstrap và Font Awesome
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.js';

// Thông báo Toast
import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

// Component select tùy chỉnh
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

// Kiểu dáng toàn cục
import './style.css';

// Tạo ứng dụng Vue
const app = createApp(App);

// Cấu hình thông báo toast
app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 2000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 1,
  transition: "Vue-Toastification__fade",
});

// Đăng ký component toàn cục
app.component('v-select', vSelect);

// Sử dụng plugin
app.use(createPinia());
app.use(router);

// Thêm mitt cho event bus
import mitt from 'mitt';
window.emitter = mitt();

// Gắn ứng dụng
app.mount('#app');
