<template>
  <div v-if="dialogStore.isVisible && dialogStore.dialogType === 'reminder-dialog'" 
    class="p-4 fixed inset-0 z-40 bg-gray-600 bg-opacity-50 flex items-center justify-center"
    @click.self="closeDialog">
    <div class="bg-white rounded-3xl p-6 w-[320px] shadow-xl">
      <h2 class="text-lg mb-4 text-gray-700">Add a reminder</h2>

      <div class="flex items-center justify-center space-x-2 mb-4">
        <!-- hour section -->
        <div class="flex flex-col items-center">
          <button @click="incrementHour">
            <i class="fa-solid fa-caret-up text-gray-500"></i>
          </button>
          
          <input type="number" pattern="\d*" v-model="hour" class="w-20 h-16 text-3xl p-2 border border-gray-300 rounded-md text-center"/>
          <button @click="decrementHour">
            <i class="fa-solid fa-caret-down text-gray-500"></i>
          </button>
        </div>

        <!-- separator -->
        <span class="text-3xl text-gray-500">:</span>

        <!-- minute section -->
        <div class="flex flex-col items-center">
          <button @click="incrementMinute">
            <i class="fa-solid fa-caret-up text-gray-500"></i>
          </button>
          <input type="number" pattern="\d*" v-model="formattedMinute" class="w-20 h-16 text-3xl p-2 border border-gray-300 rounded-md text-center"/>
          <button @click="decrementMinute">
            <i class="fa-solid fa-caret-down text-gray-500"></i>
          </button>
        </div>
        
        <!-- AM/PM Toggle -->
        <div class="flex flex-col ml-2">
          <button 
            class="px-3 py-2 rounded-t-lg text-sm font-medium"
            :class="[period === 'AM' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500']"
            @click="setPeriod('AM')"
          >
            AM
          </button>
          <button 
            class="px-3 py-2 rounded-b-lg text-sm font-medium"
            :class="[period === 'PM' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500']"
            @click="setPeriod('PM')"
          >
            PM
          </button>
        </div>
      </div>

      <div class="flex items-center justify-center">
        <div class="space-x-4">
          <button
            @click="closeDialog"
            class="text-gray-500 font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            @click="saveReminders"
            class="text-purple-600 font-medium px-4 py-2 rounded-lg hover:bg-purple-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useDialogStore } from '../../store/dialogStore';

export default {
  props:{
    currentTime: Date
  },
  data() {
    return {
      dialogStore: useDialogStore(),
      hour: 12,
      minute: 0,
      period: 'AM',
      isHourActive: true,
      isMinuteActive: false
    };
  },
  computed: {
    formattedMinute() {
      return String(this.minute).padStart(2, '0');  // Ensure minutes are always two digits
    },
  },
  methods: {
    incrementHour() {
      this.hour = (this.hour % 12) + 1;
    },
    decrementHour() {
      this.hour = this.hour - 1 || 12;
    },
    incrementMinute() {
      this.minute = (this.minute + 1) % 60;
    },
    decrementMinute() {
      this.minute = (this.minute - 1 + 60) % 60;
    },
    setPeriod(newPeriod) {
      this.period = newPeriod;
    },
    saveReminders() {
      // Validate hour and minute
      if (this.hour < 1 || this.hour > 12) {
        this.$toast.info({
          message: 'Hour must be between 1 and 12.',
          duration: 2000
        });
        return;
      }

      if (this.formattedMinute < 0 || this.formattedMinute > 59) {
        this.$toast.info({
          message: 'Minute must be between 0 and 59.',
          duration: 2000
        });
        return;
      }

      // Validate period
      if (this.period !== 'AM' && this.period !== 'PM') {
        this.$toast.info({
          message: 'Invalid period. Please select AM or PM.',
          duration: 2000
        });
        return;
      }

      // Generate the formatted time
      const formattedTime = this.convertTo24HourFormat();
      console.log(formattedTime);

      // If all validations pass, save the reminder
      this.$emit('saveReminders', formattedTime);
      this.closeDialog();
    },
    convertTo24HourFormat() {
      let hour24 = this.hour;
      if (this.period === 'PM' && this.hour !== 12) {
        hour24 += 12;
      }
      if (this.period === 'AM' && this.hour === 12) {
        hour24 = 0;
      }
      return `${String(hour24).padStart(2, '0')}:${this.formattedMinute}`;
    },
    closeDialog() {
      this.dialogStore.closeDialog();
    },
  },
};
</script>
