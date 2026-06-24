# NearFind - Hyperlocal Product Discovery & Delivery

NearFind is a hyperlocal product discovery and delivery platform connecting customers, local retailers, and delivery partners. This repository contains the React Native Android application built for the NearFind Assessment.

The project is packaged as a **single standalone APK** containing an integrated role switcher, allowing evaluators to simulate the entire end-to-end loop (Customer 🛍️ → Retailer 🏪 → Delivery Partner 🚴 → Admin ⚙️) on a single device or emulator with real-time state synchronization.

---

## 📱 Sideloading the APK
The compiled installable Android APK file is located in the root of this project:
📁 **`NearFind-Release.apk`** (located at [NearFind-Release.apk](file:///c:/Users/rupsi/OneDrive/Desktop/Projects/nearfind/NearFind-Release.apk))

### Installation Steps:
1. Copy `NearFind-Release.apk` to your Android device or drag-and-drop it into an Android Emulator.
2. Open the file manager on your device, locate the APK, and tap it.
3. If prompted, enable "Install from Unknown Sources" in your device settings.
4. Click **Install**, launch **nearfind**, and explore the app!

---

## 🔄 Simulating the End-to-End Walkthrough
Use the bottom tab bar to switch between roles in real-time. Follow this path to verify the core scope:

1. **Home Tab (AI Shopping & Support Chatbot):**
   * **Prompts & Queries:** Tap the *Home* tab. Select any of the suggested prompt pills (e.g., `"How do I cancel my order?"`, `"Support for delayed orders"`, `"Is Maggi in stock?"`) or type custom support queries (e.g., about delays, payment options, wrong items, stock availability). The AI assistant queries inventory data and responds instantly.
2. **Customer Tab (Shop):** 
   * **Neighborhood Selector:** Tap the neighborhood selector at the top header (e.g. "Default", "Downtown", "Suburbs"). Distances of carrying stores will recalculate dynamically.
   * **Add Items & Favorites:** Tap the heart icon on "Milk" or "Maggi" to bookmark them. Select the `❤️ Favorites` category chip to filter the catalog. Press `+ Add` to add multiple items to your cart.
   * **Checkout Optimizer:** Go to the **Cart** tab. Review the smart optimization options (**Fastest**, **Cheapest**, or **Smart Split Delivery**).
   * **Delivery Scheduler:** Select "Schedule for Later" and pick a time slot (e.g., `6:00 PM - 8:00 PM`). Click **Place Optimized Order**.
3. **Retailer Tab:** Select the merchant store from the top selector.
   * Go to the **Pending** tab. Accept the incoming order within the **60-second ticking window** (the order will automatically cancel and restore stock if not accepted in time).
   * Go to the **Active** tab, click **Mark Packed**, and then **Ready for Pickup**.
4. **Delivery Tab:** Tap the delivery portal.
   * Accept the unclaimed delivery job from the **Available** queue (under a 60-second acceptance countdown; the order will automatically cancel and restore stock if no partner accepts in time).
   * Under the **Active Run** tab, click **Confirm Package Picked Up** once collected.
   * Watch the customer's live 2D route map animate the rider icon.
   * Click **Confirm Package Delivered** once completed.
5. **Customer Tab (Active Tracking & My Orders):**
   * **Live 2D Map Tracking:** While the order is in progress (Accepted or Picked Up), expand the active order card in the Customer tab to watch a beautifully animated 2D route map tracing the rider's live coordinates moving from the retailer store to the customer destination in real-time.
   * **Direct Chat with Rider:** Tap the **Chat with Rider** button on the active tracking card. Type and send custom messages to coordinate delivery instructions, and the delivery rider will reply instantly with realistic simulated responses.
   * **View Receipt:** Once marked as *Delivered*, tap **View Receipt** to inspect the styled digital receipt modal detailing item tables, fees, platform driver payouts, savings highlights, and a dynamically styled barcode.
   * **Buy Again (One-Tap Reorder):** Tap **Buy Again** to instantly refill your cart with those exact items and navigate back to the checkout tab.
6. **Admin Tab:** Tap this tab at any point to view system-wide logs, real-time inventory counts (which update dynamically as stock is bought/restored), and chronological status histories with timestamps. Tap the **Reset System Data** button to clear all transactions and reload default stock levels for another walkthrough!

---

## 📂 Project Architecture & Code Structure
The application code is organized clearly:
* **`App.js`:** The root navigator and layout shell containing the bottom navigation bar and dynamic event-status badges.
* **`src/context/AppContext.js`:** Central state provider managing products, orders, shopping cart, favorites, location coordinates, notifications, and background interval loops simulating timeouts.
* **`src/screens/`**
  * **`HomePortal.js`:** Image carousel banner slides, role quick navigators, and the customer service AI support chatbot.
  * **`CustomerPortal.js`:** Custom browse list, favorites chip, inline cart controllers, delivery slot picker, live tracking map, simulated direct chat console, order history list, and the digital receipt modal.
  * **`RetailerPortal.js`:** Order queues split (Pending, Active, Completed) and status actions.
  * **`DeliveryPortal.js`:** Earnings tracker, available delivery runs, and status checkpoints.
  * **`AdminDashboard.js`:** System analytics, live stock tables, and timestamped audit logs.

---

## 📝 Tradeoffs & Future Scope (220 words)

**Tradeoff & Future Scope Write-up:**  
For this hyper-local application, I chose to implement all four user interfaces (Customer, Retailer, Delivery, Admin) in a single React Native application sharing a unified memory context (`AppContext`), instead of building three separate apps with a real-time web server. This tradeoff was selected to provide an extremely smooth testing experience: an evaluator can simulate a multi-item order optimization, accept it as a retailer, claim it as a delivery rider, and review the receipt as a customer in under two minutes on a single device without state synchronization delays. 

For customer support queries, we designed a **Hybrid AI Chatbot Architecture** featuring a local fallback mechanism: if a Gemini API Key is configured securely in the Admin Dashboard, the button actions query the live Gemini-Flash REST endpoint; otherwise, it falls back gracefully to an offline rule-based heuristic engine to ensure zero-downtime, local-only responsiveness.

The future scope of this application includes implementing bidirectional chat synchronization between the Customer and Delivery/Retailer portals using a real-time WebSocket backend (e.g. Socket.io) or Firebase, resolving the current constraint where active customer chats are contextually simulated locally rather than routing to the delivery partner's screen. Additionally, we plan to integrate voice-activated search and ordering for accessibility, replace selection-only chatbot questions with free-form typing once production API authorization is established, and build dedicated inventory forecasting dashboards for retailers.
