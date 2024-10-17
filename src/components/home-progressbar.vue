<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';

// Define component props
const props = defineProps({
    color: {
        type: String,
        default: 'bg-purple-300'
    },
    text: {
        type: String,
        default: ""
    },
    percent: {
        type: Number,
        default: 0
    },
    timesdone: {
        type: String,
        default: '0/0'
    }
});

// References for the text and progress done span elements
const textRef = ref(null);
const timesdoneRef = ref(null);

// Reactive variables to track text colors
const textColor = ref('text-black');
const timesdoneColor = ref('text-black');

// Function to check if progress bar covers the text or timesdone
const updateTextColor = () => {
    nextTick(() => {
        const containerWidth = textRef.value?.parentElement?.offsetWidth || 0; // Get total container width
        const textWidth = textRef.value?.offsetWidth || 0; // Get the width of the task text
        const timesdoneWidth = timesdoneRef.value?.offsetWidth || 0; // Get the width of the timesdone text
        const progressBarWidth = (props.percent / 100) * containerWidth; // Get progress bar width

        // If the progress bar width is larger than the text width, change task text color to white
        textColor.value = progressBarWidth >= textWidth ? 'text-white' : 'text-black';

        // Calculate remaining space on the right side and compare it to timesdone text width
        const remainingSpaceRight = containerWidth - progressBarWidth;
        timesdoneColor.value = remainingSpaceRight < timesdoneWidth ? 'text-white' : 'text-black';
    });
};

// Watch props for changes and trigger update function
watch([() => props.percent, () => props.text, () => props.timesdone], () => {
    updateTextColor();
});

// Call the function on mount to handle the initial state
onMounted(() => {
    updateTextColor();
});
</script>

<template>
    <div class="progress h-14 bg-gray-200">
        <!-- Progress bar fill -->
        <div :class="[color, 'progress__fill']" :style="{ width: `${props.percent}%` }"></div>

        <!-- Task Text with dynamically bound class for color -->
        <span :class="['p-2', textColor]" class="progress__task" ref="textRef">{{ props.text }}</span>
        
        <!-- Times Done with dynamically bound class for color -->
        <span :class="['p-2', timesdoneColor]" class="progress__timesdone" ref="timesdoneRef">
            <!-- Show check mark if progress is 100%, else show timesdone -->
            <div v-if="props.percent === 100">
                <span class="material-icons text-white">check</span>
            </div>
            <div v-else>{{ props.timesdone }}</div>
        </span>
    </div>
</template>

<style scoped>
.progress {
    width: 100%;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
}

.progress__fill {
    height: 100%;
}

.progress__task {
    position: absolute;
    top: 50%;
    left: 4px;
    transform: translateY(-50%);
}

.progress__timesdone {
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
}
</style>
