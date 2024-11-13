// stores/useDialogStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDialogStore = defineStore('dialog', () => {
  const isVisible = ref(false);
  const title = ref('');
  const content = ref(null);
  const confirmCallback = ref(null);
  const dialogType = ref('default');
  const confirmText = ref('Confirm');
  const confirmTextClass = ref('');

  function openDialog(dialogTitle, dialogContent, type = 'default', onConfirm, dialogConfirm = 'Confirm', dialogConfirmClass = '') {
    title.value = dialogTitle;
    content.value = dialogContent;
    confirmCallback.value = onConfirm;
    confirmText.value = dialogConfirm;
    confirmTextClass.value = dialogConfirmClass;
    isVisible.value = true;
    dialogType.value = type;
  }

  function closeDialog() {
    isVisible.value = false;
    title.value = '';
    content.value = null;
    confirmCallback.value = null;
    dialogType.value = 'default';
  }

  function openAddMemoDialog(type = 'add-memo') {
    isVisible.value = true;
    dialogType.value = type;
  }

  function openSortHabitsDialog(type = 'sort-habits') {
    isVisible.value = true;
    dialogType.value = type;
  }

  function confirmAction() {
    if (confirmCallback.value) confirmCallback.value();
    closeDialog();
  }

  return { isVisible, title, content, dialogType, confirmText, confirmTextClass, 
    openDialog, closeDialog, confirmAction, openAddMemoDialog, openSortHabitsDialog };
});
