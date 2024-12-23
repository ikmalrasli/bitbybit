import { getToken, onMessage } from "firebase/messaging";
import { db, messaging, vapidKey } from '../firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

// Use a unique deviceId (e.g., navigator.userAgent or a UUID)
const deviceId = generateDeviceId();

// Check for Notification and Service Worker support
export function getNotifications(vuex, toast) {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      initializeFCM(vuex, toast);
    } else {
      console.warn('Notification permission denied.');
    }
  }).catch((err) => {
    console.error('Error requesting notification permission:', err);
  });
  } else {
    console.warn('Notifications or Service Workers are not supported in this browser.');
  }
}

function initializeFCM(vuex, toast) {
  getToken(messaging, { vapidKey }).then((currentToken) => {
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      saveTokenToFirestore(vuex.state.user.uid, currentToken, vuex, toast);
    } else {
      console.log('No registration token available.');
    }
  }).catch((err) => {
    console.error('Error retrieving FCM token:', err);
  });

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    // Handle the message in the app (e.g., show a toast or update the UI)
  });
}

async function saveTokenToFirestore(userId, token, vuex, toast) {
  if (!userId || !token) return;

  const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "iOS" :
                   /Android/.test(navigator.userAgent) ? "Android" : "Web";

  const tokenRef = doc(db, `users/${userId}/tokens/${deviceId}`);

  try {
    await setDoc(tokenRef, {
      token,
      platform,
      lastActive: serverTimestamp(),
    });

    if (!vuex.state.pushNotiGranted){
      toast.info({
        message: "Notifications enabled!",
        duration: 2000,
      });

      vuex.commit('setPushNotiGranted', true);
    }
    
  } catch (error) {
    console.error("Error saving token:", error);
  }
}

export async function removeTokenFromFirestore(userId) {
  const tokenRef = doc(db, `users/${userId}/tokens/${deviceId}`);

  try {
    await deleteDoc(tokenRef);
    console.log("Token removed successfully");
  } catch (error) {
    console.error("Error removing token:", error);
  }
}

function generateDeviceId() {
  const userAgent = navigator.userAgent || "default-device";
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(); 
}