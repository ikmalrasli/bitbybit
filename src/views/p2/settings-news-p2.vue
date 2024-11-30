<template>
  <div class="w-full h-full flex flex-col">
    <!-- Header -->
    <header class="bg-white p-4 flex items-center relative">
      <button @click="goBack" class="material-icons text-gray-600 mr-4">chevron_left</button>
      <h1 class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl text-black font-bold text-center">
        News
      </h1>
    </header>

    <!-- News Cards -->
    <div class="flex-grow h-96 scrollbar-hide p-4 space-y-4 overflow-y-auto">
      <div
        v-for="(news, index) in newsList"
        :key="index"
        class="bg-white p-6 rounded-lg border space-y-2"
      >
        <!-- Category -->
        <p class="text-sm font-medium text-violet-600 uppercase">{{ news.category }}</p>

        <!-- News Title and Date -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800">{{ news.title }}</h2>
          <p class="text-gray-600 text-sm">{{ formatDate(news.date) }}</p>
        </div>

        <!-- News Content -->
        <div class="text-gray-700 leading-relaxed">
          <p>{{ news.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default {
  data() {
    return {
      newsList: [],
    };
  },
  methods: {
    async fetchNews() {
      try {
        const newsQuery = query(collection(db, "news"), orderBy("date", "desc"));
        const newsSnapshot = await getDocs(newsQuery);
        this.newsList = newsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          date: doc.data().date.toDate(),
        }));
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    },
    goBack() {
      this.$router.push("/settings");
    },
    formatDate(date) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
  mounted() {
    this.fetchNews();
  },
};
</script>

<style scoped>
.shadow-md {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
