# NearFind - Hyperlocal Product Discovery & Delivery

NearFind is a hyperlocal product discovery and delivery platform connecting customers, local retailers, and delivery partners. This repository contains the React Native Android application built for the NearFind Internship Assessment.

The project is packaged as a **single standalone APK** containing an integrated role switcher, allowing evaluators to simulate the entire end-to-end loop (Customer 🛍️ → Retailer 🏪 → Delivery Partner 🚴 → Admin ⚙️) on a single device or emulator with real-time state synchronization.

---

## 📱 Sideloading the APK
The compiled installable Android APK file is located in the root of this project:
📁 **`NearFind-Debug.apk`** (located at [NearFind-Debug.apk](file:///c:/Users/rupsi/OneDrive/Desktop/Projects/nearfind/NearFind-Debug.apk))

### Installation Steps:
1. Copy `NearFind-Debug.apk` to your Android device or drag-and-drop it into an Android Emulator.
2. Open the file manager on your device, locate the APK, and tap it.
3. If prompted, enable "Install from Unknown Sources" in your device settings.
4. Click **Install**, launch **nearfind**, and explore the app!

---

## 🔄 Simulating the End-to-End Walkthrough (The Maggi Noodles Case)
Use the bottom tab bar to switch between roles in real-time. Follow this path to verify the core scope:

1. **Customer Tab:** Search for "Maggi noodles".
   - Select the item to view comparisons: **Sharma Kirana Store** shows ₹14 (2 in stock), while **Quick Mart** shows ₹15 (Out of Stock).
   - Place an order for **2 packets** from Sharma Kirana Store. The order status goes to `Placed`.
2. **Retailer Tab:** Select **Sharma Kirana Store** from the selector.
   - Go to the **Pending** tab. You will see the incoming order with a ticking **30-second countdown**.
   - Click **Accept**. The status changes to `Accepted`.
   - Go to the **Active** tab, click **Mark Packed** (status: `Packed`), and then **Ready for Pickup** (status: `Ready for Pickup`).
3. **Delivery Tab:** You will see the order appear in the **Available** queue with a ticking **45-second countdown**.
   - Click **Accept Job** (locks the job to the partner, status transitions).
   - Go to the **Active Run** tab. Tap **Confirm Package Picked Up** once collected (status: `Picked Up`).
   - Tap **Confirm Package Delivered** once reached (status: `Delivered`).
4. **Admin Tab:** Tap this tab at any point to view system-wide logs, real-time inventory counts (which update dynamically as stock is bought/restored), and chronological status histories with timestamps. Tap the **Reset System Data** button to clear all transactions and reload default stock levels for another walkthrough!

---

## ⚠️ Edge Cases Handled
- **Retailer Timeout (Auto-Cancel):** If a retailer does not respond to a `Placed` order within **30 seconds**, the background context auto-cancels the order (`Cancelled (Retailer Timeout)`), restores the product stock, and triggers a system-wide alert.
- **Out of Stock:** Quick Mart displays Maggi as "Out of stock" with a greyed-out layout. The checkout actions are disabled for out-of-stock items, but the retailer remains visible in searches for transparency.
- **Retailer Rejection:** Clicking **Reject** on a pending order immediately cancels it and restores the product's inventory levels.
- **No Delivery Partner (Timeout):** If no driver accepts a `Ready for Pickup` order within **45 seconds**, the order is auto-cancelled (`Cancelled (No Delivery Partner)`), notifying both store and customer, and restoring stock.

---

## 📂 Project Architecture
The project is structured cleanly as follows:
- **`App.js`:** The root navigator and layout shell containing the bottom navigation bar and dynamic event-status badges.
- **`src/context/AppContext.js`:** Central state provider managing products, orders, roles, haptic notifications, and the 1-second interval loops simulating timeouts.
- **`src/components/NotificationToast.js`:** Animated overlay toast banners indicating background alerts.
- **`src/screens/`**
  - **`CustomerPortal.js`:** Product search lists, retailer comparisons, and step-by-step progress tracking.
  - **`RetailerPortal.js`:** Order queue split (Pending, Active, Completed) and merchant status actions.
  - **`DeliveryPortal.js`:** Earnings tracker, unclaimed delivery queues, and pickup-delivery guides.
  - **`AdminDashboard.js`:** System analytics, live stock tables, and timestamped audit logs.

---

## 📝 Write-up: Tradeoffs & Future Scope (179 words)

**Tradeoff & Future Scope Write-up:**
For this 48-hour build, I chose to implement a single consolidated React Native app containing a unified state provider (`AppContext`) and an in-app role switcher, rather than three separate apps or a full client-server backend. This tradeoff was made to maximize testing usability: it allows a single evaluator to simulate the entire customer-retailer-driver-admin transaction loop in real-time on one device/emulator without dealing with multiple APK installs or server syncing lags. While local React state is persistent via `AsyncStorage` and sufficient for the demo, it is not production-grade.

With more time, I would first implement a lightweight Node.js/WebSockets server or a Firebase backend to establish genuine real-time message syncing between distributed clients, replacing the local simulated timer ticks. Secondly, I would integrate the Expo Location API to calculate actual geodesic distances and route delivery partners using Google Maps SDK instead of mock values, and implement push notifications (via Firebase Cloud Messaging) to alert inactive retailers/drivers of new orders.
