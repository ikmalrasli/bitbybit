Since I already have data in the cloud, we’re essentially performing a **"Lazy Migration."** Instead of trying to convert everything at once, your app will migrate each habit the moment it is loaded or synced.

Here is the plan-prompt designed to help your AI agent reconcile these two different data structures.

---

# AI Implementation Plan: Phase 3 (Migration & Sync-Down)

**Goal:** Reconcile the legacy Firestore imageUrls (Array of Strings) with the new IndexedDB imageUrls (Array of Objects) and cache the actual image data locally.

---

### Phase 3.1: The Schema Bridge
**Objective:** Create a utility that detects which data format a habit is using and "upgrades" it.

* **Task 1 (Detection Logic):** Create a function standardizeImageData(habit) that:
    * Checks if habit.imageUrls contains **Strings** (Legacy) or **Objects** (New).
    * If it’s Strings: It treats them as remote-only and flags them for "download & cache."
    * If it’s Objects: It checks if a corresponding Blob exists in the local photos table.
* **Task 2 (UUID Mapping):** For legacy string URLs, generate a consistent id (hash or UUID) so that the same URL doesn't get downloaded twice on the same device.

---

### Phase 3.2: The "Pull & Cache" Service
**Objective:** Background processing to turn remote URLs into local Blobs.

* **Task 1 (Download Utility):** Implement a downloadToCache(url, habitId) function:
    1.  Perform a fetch(url) to get the image data.
    2.  Convert the response to a Blob.
    3.  Generate an object: { id: uuid, fileName: extractName(url), blob: blob }.
    4.  Save the blob into the Dexie photos table.
    5.  Return the metadata object (without the blob) to be stored in the habit entry.
* **Task 2 (Batch Processing):** When habits are fetched from Firestore, map through the string array and trigger the download utility for any image not yet in the local photos table.

---

### Phase 3.3: Updating the Local Habit Entry
**Objective:** Save the "Migrated" state to IndexedDB so the download only happens once.

* **Task 1 (The Local Swap):** Once the images are cached, update the habit entry in IndexedDB:
    * **Old:** imageUrls: ["url1", "url2"] 
    * **New:** imageUrls: [{ id: "123", fileName: "photo.jpg" }, ...] 
* **Task 2 (The Sync Flag):** Add a localMigrationComplete: true flag to the local habit record to prevent the app from checking the "String vs Object" logic every time the page loads.

---

### Phase 3.4: UI Resilience (The Fallback)
**Objective:** Ensure the Vue component doesn't crash if the migration is still in progress.

* **Task 1 (Computed Property):** Create a computed property resolvedPhotos in the habit component:
    * **Priority 1:** If ID exists, look for a Blob URL in the local photos table.
    * **Priority 2:** If no local Blob is found (still downloading), fall back to the remote Firebase URL string.
* **Task 2 (Loading State):** Show a subtle "Downloading..." overlay or blur on photo thumbnails that are currently being cached from the cloud.

---

### Summary of the Data Transformation:

| Source (Firestore) | Interim (During Download) | Final (IndexedDB) |
| :--- | :--- | :--- |
| ["url1.jpg"] | UI shows url1.jpg directly | [{ id: "abc", fileName: "pic.jpg" }] |
| (Remote Only) | (Fetching Blob...) | (Blob stored in photos table) |

---