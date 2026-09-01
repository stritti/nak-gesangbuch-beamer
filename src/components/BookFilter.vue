<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { nakRepository } from '@/features/ingest/nak.repository';
import { getBookName } from '@/features/songs/book-names';

interface Props {
  modelValue: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null
});

const books = ref<Array<{ id: string; title: string; count: number }>>([]);
const isLoading = ref(false);
const isOpen = ref(false);

const emit = defineEmits<{
  (e: 'update:modelValue', bookId: string | null): void;
}>();

onMounted(async () => {
  await loadBooks();
});

async function loadBooks() {
  isLoading.value = true;
  try {
    books.value = await nakRepository.getBooks();
  } catch (error) {
    console.error('Fehler beim Laden der Bücher:', error);
  } finally {
    isLoading.value = false;
  }
}

function selectBook(bookId: string | null) {
  emit('update:modelValue', bookId);
  isOpen.value = false;
}

function toggleOpen() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="book-filter">
    <button
      type="button"
      class="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
      @click="toggleOpen"
    >
      <span class="font-medium">
        {{ props.modelValue ? getBookName(props.modelValue) + ' (' + props.modelValue + ')' : 'Alle Bücher' }}
      </span>
      <span class="text-sm text-gray-500">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <Transition name="slide-fade">
      <div v-show="isOpen" class="mt-1 border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-10">
        <div v-if="isLoading" class="p-3 text-gray-500 text-center">
          Bücher werden geladen...
        </div>
        <div v-else-if="books.length === 0" class="p-3 text-gray-500 text-center">
          Keine Bücher gefunden
        </div>
        <div v-else class="py-1">
          <button
            class="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
            :class="props.modelValue === null ? 'bg-blue-50 text-blue-700' : ''"
            @click="selectBook(null)"
          >
            Alle Bücher
          </button>
          <hr class="my-1 border-gray-200" />
          <button
            v-for="book in books"
            :key="book.id"
            class="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex justify-between items-center"
            :class="props.modelValue === book.id ? 'bg-blue-50 text-blue-700' : ''"
            @click="selectBook(book.id)"
          >
            <span>{{ getBookName(book.id) }} ({{ book.id }})</span>
            <span class="text-sm text-gray-500">{{ book.count }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
