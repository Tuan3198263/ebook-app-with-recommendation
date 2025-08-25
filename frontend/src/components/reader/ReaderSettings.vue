<template>
  <div class="reader-settings" :class="{ 'settings-open': isOpen }">
    <div class="settings-overlay" @click="$emit('close')" v-if="isOpen"></div>

    <div class="settings-panel">
      <div class="settings-header">
        <h3><i class="fas fa-cog"></i> Cài đặt đọc sách</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="settings-content">
        <!-- Display Settings -->
        <div class="setting-group">
          <h4><i class="fas fa-display"></i> Hiển thị</h4>

          <!-- Font Size -->
          <div class="setting-item">
            <label>Cỡ chữ</label>
            <div class="font-size-controls">
              <button @click="decreaseFontSize" class="size-btn">
                <i class="fas fa-minus"></i>
              </button>
              <span class="font-size-display">{{ settings.fontSize }}px</span>
              <button @click="increaseFontSize" class="size-btn">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <!-- Font Family -->
          <div class="setting-item">
            <label>Font chữ</label>
            <select v-model="settings.fontFamily" @change="updateSettings">
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Merriweather', serif">Merriweather</option>
            </select>
          </div>
        </div>

        <!-- Theme Settings -->
        <div class="setting-group">
          <h4><i class="fas fa-palette"></i> Giao diện</h4>

          <!-- Theme -->
          <div class="setting-item">
            <label>Chủ đề</label>
            <div class="theme-options">
              <button
                v-for="theme in themeOptions"
                :key="theme.value"
                @click="setTheme(theme.value)"
                class="theme-btn"
                :class="{ active: settings.theme === theme.value }"
                :style="{
                  background: theme.background,
                  color: theme.color,
                  border:
                    settings.theme === theme.value
                      ? '2px solid #007bff'
                      : '2px solid #ddd',
                }"
              >
                {{ theme.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Reading Settings -->
        <div class="setting-group">
          <h4><i class="fas fa-book-reader"></i> Đọc sách</h4>

          <!-- Placeholder for future reading settings -->
          <div class="setting-item">
            <p class="placeholder-text">
              Các tính năng đọc sách khác sẽ được phát triển trong tương lai.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from "vue";

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["close", "settings-change"]);

// Reactive data
const settings = reactive({
  fontSize: 16,
  fontFamily: "Arial, sans-serif",
  theme: "light",
});

const minFontSize = 12;
const maxFontSize = 24;

const themeOptions = [
  {
    value: "light",
    label: "Sáng",
    background: "#ffffff",
    color: "#333333",
  },
  {
    value: "sepia",
    label: "Sepia",
    background: "#f4f1e8",
    color: "#5c4b37",
  },
  {
    value: "dark",
    label: "Tối",
    background: "#1a1a1a",
    color: "#e0e0e0",
  },
];

// Methods
const loadSettings = () => {
  const savedSettings = localStorage.getItem("readerSettings");
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings));
  }
  applySettings();
};

const updateSettings = () => {
  saveSettings();
  applySettings();
  emit("settings-change", settings);
};

const saveSettings = () => {
  localStorage.setItem("readerSettings", JSON.stringify(settings));
};

const applySettings = () => {
  // Apply settings to the document/reader
  nextTick(() => {
    emit("settings-change", settings);
  });
};

const increaseFontSize = () => {
  if (settings.fontSize < maxFontSize) {
    settings.fontSize += 1;
    updateSettings();
  }
};

const decreaseFontSize = () => {
  if (settings.fontSize > minFontSize) {
    settings.fontSize -= 1;
    updateSettings();
  }
};

const setTheme = (theme) => {
  settings.theme = theme;
  updateSettings();
};

// Lifecycle
onMounted(() => {
  loadSettings();
});
</script>

<style scoped src="./ReaderSettings.css"></style>
