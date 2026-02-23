importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA-n1tc08oL-pk4sQb4dpMDUH4rGMJV2f8',
  authDomain: 'bitbybit-5afe4.firebaseapp.com',
  projectId: 'bitbybit-5afe4',
  storageBucket: 'bitbybit-5afe4.appspot.com',
  messagingSenderId: '835507165219',
  appId: '1:835507165219:web:4f428ca23e35c49d5f3996',
  measurementId: 'G-7K2Z8EEE8R',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const { title, body, icon } = payload.notification || {};
  const notificationOptions = {
    body: body || "Background Message body",
    icon: icon || "/firebase-logo.png",
  };

  // Only show notifications if the page isn't focused
  if (!self.clients) {
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});