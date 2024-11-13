<template>
  <div class="w-full h-full flex flex-col">
    <!-- Header -->
    <header class="bg-white p-4 flex items-center relative">
      <button @click="goBack" class="material-icons text-gray-600 mr-4">chevron_left</button>
      <h1 class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl text-black font-bold text-center">
        About Us
      </h1>
    </header>

    <!-- Developer Info -->
    <div class="px-4">
        <h1 class="text-md text-gray-800 font-semibold text-right">هَٰذَا مِن فَضْلِ رَبِّي</h1>
        <h1 class="text-md text-gray-500 font-semibold text-right italic">This is by the Grace of my Lord</h1>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-6">
      
      <!-- Developer Info -->
      <div>
        <h1 class="text-lg text-gray-800 font-semibold">About the Developer</h1>
        <p class="text-gray-700 mt-2 leading-relaxed" style="white-space: pre-wrap;">
          {{ content }}
        </p>
      </div>

      <!-- Contributors Section -->
      <div>
        <h1 class="text-lg text-gray-800 font-semibold">Special thanks to:</h1>
        <ul class="mt-3 space-y-2">
          <li v-for="contributor in contributors" :key="contributor.name" class="flex items-center">
            <span class="material-icons text-gray-700 mr-3">person</span>
            <span class="text-gray-700 font-medium">{{ contributor.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      content: "Assalamu'alaikum and hello, thank you for checking out this app! I’m Ikmal, a full-time engineer with a passion for web and app development.\n\nThis project began on August 10, 2024, as a side project to help users with personal growth. While it’s still a work in progress, I’m continually improving it based on feedback and ideas. My goal is to have it completed by next Ramadhan, insyaAllah.\n\nThank you for your support! Feel free to send me feedback, and I hope this app adds value to your daily life as I work towards making it better.",
      contributors: [
        { name: "My Family (Mama, Abah, Adek)" },
        { name: "Umar" },
        { name: "Atiquh" },
        { name: "Azrul Hakimi" },
        { name: "Abang (Gunslingahh)"},
        { name: "Afa"},
        { name: "Najmi"},
        { name: "And many others..."},
      ]
    };
  },
  methods: {
    goBack() {
      this.$router.push('/settings');
    },
  },
};
</script>

<style scoped>
/* Scoped styles for additional styling */
.shadow-md {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
