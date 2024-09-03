import { createStore } from 'vuex';

export default createStore({
  state: {
    selectedDay: '', // This will store the selected day
  },
  mutations: {
    setSelectedDay(state, day) {
      state.selectedDay = day;
    }
  },
  actions: {
    updateSelectedDay({ commit }, day) {
      commit('setSelectedDay', day);
    }
  },
  getters: {
    getSelectedDay: (state) => state.selectedDay,
  }
});
