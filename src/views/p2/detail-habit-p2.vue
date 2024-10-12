<template>
  <div class="w-full h-full flex flex-col bg-white border-r">
    <!-- Header -->
    <header class="bg-white p-4 flex flex-row relative justify-between">
      <button @click="goBack" class="material-icons">chevron_left</button>
      <h1 class="text-xl text-black font-bold">{{ selectedHabit?.name || 'Habit Details' }}</h1>
      <button class="material-icons disabled:opacity-50">more_horiz</button>
    </header>

    <div class="flex-1 overflow-y-auto px-4">
      <!-- Progress Card -->
      <div class="w-full p-8 mb-4 text-gray-700 bg-white border rounded-lg text-center">
        <h2 class="flex-auto text-xl block mb-2">Progress</h2>
        <h1 class="flex-auto text-5xl">{{ addProgress }}</h1>

        <h2 class="flex-auto text-xl mb-2">/ {{ selectedHabit?.dailyGoal }}</h2>

        <div class="w-full justify-center flex">
          <!-- Minus Button -->
          <button type="button" @click="decreaseGoal" class="material-icons text-gray-700">remove</button>

          <!-- Slider -->
          <input v-if="selectedHabit" 
            type="range" :min="0" :max="selectedHabit.dailyGoal" 
            v-model="addProgress"
            class="range accent-violet-400 w-2/5 mx-2" />

          <!-- Plus Button -->
          <button type="button" @click="increaseGoal" class="material-icons text-gray-700">add</button>
        </div>

        <!-- Reset Progress Button-->
        <button type="button" @click="removeTodayEntries" class="material-icons text-gray-700 mt-4">replay</button>
      </div>

      <!-- Notes and Image -->
      <div v-if="selectedHabit?.imageUrl || selectedHabit?.notes" class="w-full p-4 mb-4 text-gray-700 bg-white border rounded-lg">
        <h2 class="text-xl text-center block mb-2">Notes</h2>
        <p v-if="selectedHabit?.notes" class="text-lg px-4 py-2">{{ selectedHabit?.notes }}</p>
        <div v-if="selectedHabit?.imageUrl">
          <img :src="selectedHabit.imageUrl" alt="Uploaded Image" class="object-cover rounded-md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { db } from "../../firebase"; // Firestore instance
import { collection, query, where, getDocs, deleteDoc, Timestamp, addDoc, orderBy, doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      addProgress: 0,
      existProgress: false,
      docId: '',
    };
  },
  computed: {
    ...mapState(['selectedHabit']),
    selectedHabit() {
      this.addProgress = this.$store.state.selectedHabit.progress;
      return this.$store.state.selectedHabit;
    }
  },
  methods: {
    async removeTodayEntries() {
      try {
        // Get the start and end of today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0); // Beginning of the day

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999); // End of the day

        const habitId = this.selectedHabit.habitId;

        // Query for documents with habitId and timestamp within today
        const q = query(
          collection(db, 'progress'),
          where('habitId', '==', habitId),
          where('timestamp', '>=', Timestamp.fromDate(todayStart)),
          where('timestamp', '<=', Timestamp.fromDate(todayEnd))
        );

        const querySnapshot = await getDocs(q);

        // Delete each document found
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
          console.log(`Deleted document with ID: ${doc.id}`);
        });

        this.$store.dispatch('fetchWeekProgress');
        this.addProgress = 0; // Reset addProgress to 0
        this.$store.state.selectedHabit.progress = 0; // Reset selectedHabit's progress
        this.createProgress();
      } catch (error) {
        console.error("Error removing today's entries: ", error);
        alert('Error removing entries.');
      }
    },
    goBack() {
      this.$router.push('/');
    },
    increaseGoal() {
      if (this.addProgress < this.selectedHabit.dailyGoal) {
        this.addProgress++;
      }
    },
    decreaseGoal() {
      if (this.addProgress > 0) {
        this.addProgress--;
      }
    },
    createProgress() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("User not authenticated. Please log in.");
        }

        const habitRef = addDoc(collection(db, "progress"), {
          habitId: this.selectedHabit.habitId,
          progress: 0,
          timestamp: new Date(),
        });
        
        // Access the ID from the returned promise
        habitRef.then((docRef) => {
          this.existProgress = true;
          this.docId = docRef.id;
          console.log('Document created:', this.docId);
          //start watch for addProgress change
          this.$watch('addProgress', (newVal, oldVal) => {
            if (newVal != oldVal && newVal > 0) {
              this.updateProgress();
            } else if (newVal === 0) {
              this.removeTodayEntries();
            }
          })
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    },
    updateProgress() {
      if (this.docId != '') {
        try {
          const docRef = doc(db, 'progress', this.docId);
          updateDoc(docRef, {
            progress: this.addProgress,
            timestamp: Timestamp.fromDate(new Date()),
          });
          console.log('Updated document:', this.docId);
          this.$store.dispatch('fetchWeekProgress');
        } catch (error) {
          console.error('Error updating document:', error);
        }
      }
    },
    watchProgress() {
      //start watch for addProgress change
      this.$watch('addProgress', (newVal, oldVal) => {
            if (newVal != oldVal && newVal > 0) {
              this.updateProgress();
            } else if (newVal === 0) {
              this.removeTodayEntries();
            }
          })
    },
    checkProgress() {
      //Query for documents with habitId and timestamp within today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // Beginning of the day
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999); // End of the day

      const q = query(
        collection(db, 'progress'),
        where('habitId', '==', this.selectedHabit.habitId),
        where('timestamp', '>=', Timestamp.fromDate(todayStart)),
        where('timestamp', '<=', Timestamp.fromDate(todayEnd)),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = getDocs(q);

      querySnapshot.then((querySnapshot) => {
        if (querySnapshot.empty) {
          console.log('No progress found, creating new document...');
          this.createProgress();
        } else {
          // this.addProgress = querySnapshot.docs[0].data().progress;
          this.docId = querySnapshot.docs[0].id
          console.log('update mode...')
          this.watchProgress();
        }
      });
    },
  },
  mounted() {
    this.checkProgress();
  }
}
</script>
