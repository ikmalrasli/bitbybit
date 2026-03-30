This is a smart way to approach it. By breaking this into phases, you ensure that if one part (like the sync logic) gets complicated, your basic "Add Habit" functionality still works perfectly.

Here is a structured plan-prompt you can feed to an AI agent. 

---

# AI Implementation Plan: Local-First Habit Photo System

**Goal:** Transition the current Firebase-first photo logic to an Offline-First model using IndexedDB (Dexie) for local storage/caching and Firebase for background backup and multi-device sync.

---

### Phase 1: The Local Foundation (Version 1.0)
**Objective:** Store photos locally and show them in the UI without needing an internet connection.

* **Task 1 (Database):** Update `db.js` (Dexie) to include a `photos` table. Fields needed: `id` (UUID), `habitId`, `blob` (The actual image), `syncStatus` (pending/synced), and `timestamp`.
* **Task 2 (UUID Generation):** Modify the "Add Habit" logic so that a `habitId` is generated immediately when the page opens (using `crypto.randomUUID()`), rather than waiting for a Firebase response.
* **Task 3 (Local Selection):** Modify `handlePhotoSelect` to:
    1.  Convert the selected file into a `Blob`.
    2.  Save it to the Dexie `photos` table immediately with `syncStatus: 'pending'`.
    3.  Generate a local `URL.createObjectURL(blob)` for the UI preview.
* **Task 4 (Local Display):** Update the photo preview logic to read from the Dexie `photos` table based on the current `habitId`.

---

### Phase 2: The Outbound Sync (Version 1.1)
**Objective:** Silently back up local photos to the cloud when the user is online.

* **Task 1 (Storage Upload):** Create a background service (or Pinia action) that finds all photos in Dexie with `syncStatus: 'pending'`.
* **Task 2 (Firebase Integration):** For each pending photo:
    1.  Upload the `Blob` to Firebase Storage.
    2.  Upon success, get the `downloadURL`.
    3.  Update the photo record in Dexie with the URL and change status to `synced`.
* **Task 3 (Firestore Update):** Update the habit document in Firestore to include an array of photo metadata (the ID and the Firebase URL).

---

### Phase 3: The Multi-Device "Pull" (Version 1.2)
**Objective:** Ensure other devices download and cache photos from the cloud.

* **Task 1 (Sync-Down Logic):** Modify the habit fetching logic in the store. When a habit is pulled from Firestore:
    1.  Check the `photoMetadata` array.
    2.  Compare the photo IDs in Firestore with the photo IDs in the local Dexie `photos` table.
* **Task 2 (The Cache-Miss Handler):** If a photo ID exists in Firestore but NOT in Dexie:
    1.  Fetch the image from the Firebase URL.
    2.  Convert it to a `Blob`.
    3.  Store it in Dexie so that it is available offline on this device too.

---

### Phase 4: Optimization & Performance (Version 1.3)
**Objective:** Keep the app fast and prevent storage limits.

* **Task 1 (Compression):** Integrate an image compression step (e.g., using a canvas or `browser-image-compression`) before the photo is saved to Dexie in Phase 1.
* **Task 2 (Cleanup):** Implement a cleanup check to revoke old `Blob URLs` to prevent memory leaks while the app is running.