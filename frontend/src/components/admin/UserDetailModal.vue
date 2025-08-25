<template>
  <div
    v-if="show"
    class="modal fade show"
    style="display: block"
    tabindex="-1"
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Chi tiết người dùng</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body" v-if="user">
          <div class="mb-2"><strong>Tên:</strong> {{ user.name }}</div>
          <div class="mb-2"><strong>Email:</strong> {{ user.email }}</div>
          <div class="mb-2">
            <strong>Vai trò:</strong>
            <span
              class="badge"
              :class="user.role === 'admin' ? 'bg-success' : 'bg-secondary'"
              >{{ user.role }}</span
            >
          </div>
          <div class="mb-2">
            <strong>Khoa:</strong> {{ user.faculty || "-" }}
          </div>
          <div class="mb-2">
            <strong>Ngành:</strong> {{ user.major || "-" }}
          </div>
          <div class="mb-2">
            <strong>Ngày tạo:</strong> {{ formatDate(user.createdAt) }}
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import userService from "../../services/userService";
const props = defineProps({ userId: String, show: Boolean });
const user = ref(null);

const fetchUserDetail = async () => {
  if (!props.userId) return;
  const response = await userService.getUserDetail(props.userId);
  if (response.success) user.value = response.data;
  else user.value = null;
};
watch(() => props.userId, fetchUserDetail, { immediate: true });
watch(
  () => props.show,
  (val) => {
    if (!val) user.value = null;
  }
);
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("vi-VN");
};
</script>

<style scoped>
.modal.show {
  display: block;
  background: rgba(0, 0, 0, 0.3);
}
</style>
