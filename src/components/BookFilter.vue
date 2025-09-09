<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { nakRepository } from '@/features/ingest/nak.repository';

const books = ref<Array<{ id: string; title: string; count: number }>>([]);
const selectedBookId = ref<string | null>(null);
const isLoading = ref(false);

const emit = defineEmits<{
  (e: 'filter', bookId: string | null): void;
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
  selectedBookId.value = bookId === selectedBookId.value ? null : bookId;
  emit('filter', selectedBookId.value);
}
</script>

<template>
  <div class="book-filter">
    <h3 class="text-lg font-semibold mb-2">Bücher</h3>
    
    <div v-if="isLoading" class="text-gray-500">
      Bücher werden geladen...
    </div>
    
    <div v-else-if="books.length === 0" class="text-gray-500">
      Keine Bücher gefunden
    </div>
    
    <div v-else class="space-y-2">
      <button
        class="w-full text-left px-3 py-2 rounded-md transition-colors"
        :class="selectedBookId === null ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'"
        @click="selectBook(null)"
      >
        Alle Bücher
      </button>
      
      <button
        v-for="book in books"
        :key="book.id"
        class="w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center"
        :class="selectedBookId === book.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'"
        @click="selectBook(book.id)"
      >
        <span>{{ book.title }}</span>
        <span class="text-sm text-gray-500">{{ book.count }}</span>
      </button>
    </div>
  </div>
</template>
