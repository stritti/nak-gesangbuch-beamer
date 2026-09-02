import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import { useThemeStore } from '@/features/theme/theme.store';
import './styles/tailwind.css';

// Pinia mit Persistenz-Plugin initialisieren
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(router);

// Theme-Store initialisieren (Dark-Mode basierend auf System-Preference)
const themeStore = useThemeStore();
themeStore.init();

// App initialisieren
app.mount('#app');
