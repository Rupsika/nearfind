import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export const AppContext = createContext();

// Haptic feedback wrappers to prevent crashes on unsupported devices/emulators
const triggerHaptic = async (type) => {
  try {
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    // Fail silently if haptics are not available
  }
};

const SEED_PRODUCTS = [
  {
    id: 'maggi',
    name: 'Maggi 2-Min Noodles',
    category: 'Packaged Food',
    image: 'https://images.unsplash.com/photo-1612966608967-3e2b81c5d3f2?w=150', // placeholder URL for display
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 14, stock: 2, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 15, stock: 0, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 13, stock: 10, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'butter',
    name: 'Amul Butter 100g',
    category: 'Dairy & Eggs',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 56, stock: 5, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 55, stock: 8, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 54, stock: 0, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'coke',
    name: 'Coca-Cola 500ml',
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 40, stock: 10, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 38, stock: 15, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 40, stock: 3, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'atta',
    name: 'Aashirvaad Atta 5kg',
    category: 'Grocery & Staples',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 260, stock: 1, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 270, stock: 4, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 255, stock: 12, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'bourbon',
    name: 'Britannia Bourbon 150g',
    category: 'Snacks & Biscuits',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 20, stock: 0, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 20, stock: 2, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 18, stock: 20, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'milk',
    name: 'Amul Taaza Milk 1L',
    category: 'Dairy & Eggs',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 66, stock: 8, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 68, stock: 12, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 65, stock: 2, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'bread',
    name: 'Harvest Gold Bread 400g',
    category: 'Packaged Food',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 45, stock: 4, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 45, stock: 6, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 43, stock: 10, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'lays',
    name: 'Lays Classic Salted',
    category: 'Snacks & Biscuits',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 20, stock: 15, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 20, stock: 20, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 19, stock: 30, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'pepsi',
    name: 'Pepsi Soda 750ml',
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 40, stock: 6, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 40, stock: 10, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 38, stock: 12, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'rice',
    name: 'Fortune Basmati Rice 1kg',
    category: 'Grocery & Staples',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 110, stock: 3, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 105, stock: 5, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 108, stock: 15, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'eggs',
    name: 'Farm Fresh Eggs 6pcs',
    category: 'Dairy & Eggs',
    image: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 42, stock: 12, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 45, stock: 10, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 40, stock: 24, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'chips',
    name: 'Kurkure Masala Munch 90g',
    category: 'Snacks & Biscuits',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 20, stock: 18, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 20, stock: 15, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 18, stock: 40, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'juice',
    name: 'Real Fruit Juice Orange 1L',
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 120, stock: 4, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 115, stock: 6, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 110, stock: 8, rating: 4.5, distance: 2.1 }
    }
  },
  {
    id: 'noodles',
    name: 'Yippee Masala Noodles 280g',
    category: 'Packaged Food',
    image: 'https://images.unsplash.com/photo-1612966608967-3e2b81c5d3f2?w=150',
    retailers: {
      sharma: { name: 'Sharma Kirana Store', price: 48, stock: 9, rating: 4.8, distance: 0.5 },
      quick_mart: { name: 'Quick Mart', price: 50, stock: 5, rating: 4.2, distance: 1.2 },
      super_save: { name: 'Super Save Supermarket', price: 46, stock: 15, rating: 4.5, distance: 2.1 }
    }
  }
];

const DEFAULT_ACCOUNTS = [
  { name: 'John Customer', email: 'customer@nearfind.com', password: 'password', role: 'customer' },
  { name: 'Sharma Kirana Manager', email: 'retailer@nearfind.com', password: 'password', role: 'retailer', retailerId: 'sharma' },
  { name: 'Quick Rider', email: 'delivery@nearfind.com', password: 'password', role: 'delivery' },
  { name: 'System Admin', email: 'admin@nearfind.com', password: 'password', role: 'admin' }
];

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [activeRole, setActiveRole] = useState(null); // home | customer | retailer | delivery | admin
  const [activeRetailerId, setActiveRetailerId] = useState('sharma'); // sharma | quick_mart | super_save
  const [notifications, setNotifications] = useState([]);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [userAccounts, setUserAccounts] = useState(DEFAULT_ACCOUNTS);

  // Persistence keys
  const PERSIST_KEY_PRODUCTS = '@nearfind_products_v1';
  const PERSIST_KEY_ORDERS = '@nearfind_orders_v1';
  const PERSIST_KEY_ROLE = '@nearfind_role_v1';
  const PERSIST_KEY_RETAILER = '@nearfind_retailer_v1';
  const PERSIST_KEY_TRACKING_ORDER_ID = '@nearfind_tracking_order_id_v1';
  const PERSIST_KEY_USER = '@nearfind_user_v1';
  const PERSIST_KEY_ACCOUNTS = '@nearfind_accounts_v1';

  // Load state from local storage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem(PERSIST_KEY_PRODUCTS);
        const storedOrders = await AsyncStorage.getItem(PERSIST_KEY_ORDERS);
        const storedRole = await AsyncStorage.getItem(PERSIST_KEY_ROLE);
        const storedRetailer = await AsyncStorage.getItem(PERSIST_KEY_RETAILER);
        const storedTrackingOrderId = await AsyncStorage.getItem(PERSIST_KEY_TRACKING_ORDER_ID);
        const storedUser = await AsyncStorage.getItem(PERSIST_KEY_USER);
        const storedAccounts = await AsyncStorage.getItem(PERSIST_KEY_ACCOUNTS);

        if (storedProducts) {
          const parsed = JSON.parse(storedProducts);
          const parsedIds = new Set(parsed.map((p) => p.id));
          const missing = SEED_PRODUCTS.filter((p) => !parsedIds.has(p.id));
          if (missing.length > 0) {
            const merged = [...parsed, ...missing];
            setProducts(merged);
            await AsyncStorage.setItem(PERSIST_KEY_PRODUCTS, JSON.stringify(merged));
          } else {
            setProducts(parsed);
          }
        }
        if (storedOrders) setOrders(JSON.parse(storedOrders));
        if (storedRetailer) setActiveRetailerId(storedRetailer);
        if (storedTrackingOrderId) setTrackingOrderId(JSON.parse(storedTrackingOrderId));

        if (storedAccounts) {
          setUserAccounts(JSON.parse(storedAccounts));
        } else {
          await AsyncStorage.setItem(PERSIST_KEY_ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setActiveRole(parsedUser.role === 'customer' ? 'home' : parsedUser.role);
          if (parsedUser.retailerId) {
            setActiveRetailerId(parsedUser.retailerId);
          }
        } else {
          setActiveRole(null); // Unauthenticated triggers Login UI
        }
      } catch (e) {
        console.error('Failed to load local state:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, []);

  // Save changes to local storage helper
  const saveToStorage = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save state for ${key}:`, e);
    }
  };

  // Auth Operations
  const loginUser = useCallback(async (email, password) => {
    const user = userAccounts.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Account not found. Please sign up.' };
    }
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    setCurrentUser(user);
    const defaultRole = user.role === 'customer' ? 'home' : user.role;
    setActiveRole(defaultRole);
    if (user.retailerId) {
      setActiveRetailerId(user.retailerId);
      await saveToStorage(PERSIST_KEY_RETAILER, user.retailerId);
    }

    await saveToStorage(PERSIST_KEY_USER, user);
    await saveToStorage(PERSIST_KEY_ROLE, defaultRole);
    addNotification(`Welcome back, ${user.name}!`, 'success');
    return { success: true };
  }, [userAccounts, addNotification]);

  const registerUser = useCallback(async (name, email, password, role, retailerId = null) => {
    const exists = userAccounts.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'Email already registered.' };
    }

    const newUser = { name, email, password, role, retailerId };
    const updatedAccounts = [...userAccounts, newUser];
    setUserAccounts(updatedAccounts);
    await saveToStorage(PERSIST_KEY_ACCOUNTS, updatedAccounts);

    // Auto-login registered user
    setCurrentUser(newUser);
    const defaultRole = role === 'customer' ? 'home' : role;
    setActiveRole(defaultRole);
    if (retailerId) {
      setActiveRetailerId(retailerId);
      await saveToStorage(PERSIST_KEY_RETAILER, retailerId);
    }

    await saveToStorage(PERSIST_KEY_USER, newUser);
    await saveToStorage(PERSIST_KEY_ROLE, defaultRole);
    addNotification(`Account registered! Welcome, ${name}.`, 'success');
    return { success: true };
  }, [userAccounts, addNotification]);

  const logoutUser = useCallback(async () => {
    setCurrentUser(null);
    setActiveRole(null);
    await AsyncStorage.removeItem(PERSIST_KEY_USER);
    await AsyncStorage.removeItem(PERSIST_KEY_ROLE);
    addNotification('Logged out successfully.', 'info');
  }, [addNotification]);

  // Persist tracking order ID when it changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(PERSIST_KEY_TRACKING_ORDER_ID, trackingOrderId);
    }
  }, [trackingOrderId, isLoaded]);

  // Toast Notification helper
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setNotifications((prev) => [{ id, message, type }, ...prev].slice(0, 5)); // Keep only latest 5 notifications
    triggerHaptic(type === 'error' ? 'error' : type === 'success' ? 'success' : 'medium');
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Place a new customer order
  const placeOrder = useCallback((productId, retailerId, quantity) => {
    let success = false;
    let newOrder = null;

    setProducts((prevProducts) => {
      // Find product
      const productIndex = prevProducts.findIndex((p) => p.id === productId);
      if (productIndex === -1) return prevProducts;

      const product = prevProducts[productIndex];
      const retailerData = product.retailers[retailerId];

      if (!retailerData || retailerData.stock < quantity) {
        return prevProducts; // Out of stock, don't update state
      }

      // Decrement stock
      const updatedProducts = [...prevProducts];
      const updatedProduct = {
        ...product,
        retailers: {
          ...product.retailers,
          [retailerId]: {
            ...retailerData,
            stock: retailerData.stock - quantity
          }
        }
      };
      updatedProducts[productIndex] = updatedProduct;

      // Create new order
      const orderNum = 1000 + Math.floor(Math.random() * 9000);
      newOrder = {
        id: `NF-${orderNum}`,
        productId,
        productName: product.name,
        retailerId,
        retailerName: retailerData.name,
        quantity,
        pricePerUnit: retailerData.price,
        totalPrice: retailerData.price * quantity,
        status: 'Placed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retailerTimeoutAt: Date.now() + 30000, // 30 seconds to accept
        deliveryTimeoutAt: null,
        statusHistory: [{ status: 'Placed', timestamp: Date.now() }]
      };

      success = true;
      saveToStorage(PERSIST_KEY_PRODUCTS, updatedProducts);
      return updatedProducts;
    });

    if (success && newOrder) {
      setOrders((prevOrders) => {
        const updatedOrders = [newOrder, ...prevOrders];
        saveToStorage(PERSIST_KEY_ORDERS, updatedOrders);
        return updatedOrders;
      });

      setTrackingOrderId(newOrder.id);
      addNotification(`Order ${newOrder.id} placed at ${newOrder.retailerName}!`, 'success');
      return { success: true, order: newOrder };
    }

    return { success: false, error: 'Insufficient stock or invalid retailer' };
  }, [addNotification]);

  // Retailer accepts order
  const acceptOrder = useCallback((orderId) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId && order.status === 'Placed') {
          const timestamp = Date.now();
          addNotification(`Order ${orderId} accepted by ${order.retailerName}`, 'success');
          return {
            ...order,
            status: 'Accepted',
            updatedAt: timestamp,
            retailerTimeoutAt: null,
            statusHistory: [...order.statusHistory, { status: 'Accepted', timestamp }]
          };
        }
        return order;
      });
      saveToStorage(PERSIST_KEY_ORDERS, updatedOrders);
      return updatedOrders;
    });
  }, [addNotification]);

  // Retailer rejects order
  const rejectOrder = useCallback((orderId) => {
    let orderToRestore = null;

    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId && order.status === 'Placed') {
          const timestamp = Date.now();
          orderToRestore = order;
          addNotification(`Order ${orderId} rejected by ${order.retailerName}`, 'error');
          return {
            ...order,
            status: 'Rejected',
            updatedAt: timestamp,
            retailerTimeoutAt: null,
            statusHistory: [...order.statusHistory, { status: 'Rejected', timestamp }]
          };
        }
        return order;
      });
      saveToStorage(PERSIST_KEY_ORDERS, updatedOrders);
      return updatedOrders;
    });

    // If order was found and rejected, restore its stock
    if (orderToRestore) {
      setProducts((prevProducts) => {
        const productIndex = prevProducts.findIndex((p) => p.id === orderToRestore.productId);
        if (productIndex === -1) return prevProducts;

        const product = prevProducts[productIndex];
        const retailerId = orderToRestore.retailerId;
        const retailerData = product.retailers[retailerId];

        const updatedProducts = [...prevProducts];
        updatedProducts[productIndex] = {
          ...product,
          retailers: {
            ...product.retailers,
            [retailerId]: {
              ...retailerData,
              stock: retailerData.stock + orderToRestore.quantity
            }
          }
        };
        saveToStorage(PERSIST_KEY_PRODUCTS, updatedProducts);
        return updatedProducts;
      });
    }
  }, [addNotification]);

  // Update order status (Packed -> Ready for Pickup -> Picked Up -> Delivered)
  const updateOrderStatus = useCallback((orderId, nextStatus) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId) {
          const timestamp = Date.now();
          let deliveryTimeoutAt = order.deliveryTimeoutAt;

          // If transitioning to Ready for Pickup, start the 45-second delivery acceptance countdown
          if (nextStatus === 'Ready for Pickup') {
            deliveryTimeoutAt = timestamp + 45000;
            addNotification(`Order ${orderId} is Ready for Pickup! Awaiting a Delivery Partner...`, 'info');
          } else if (nextStatus === 'Picked Up') {
            deliveryTimeoutAt = null; // Accepted, cancel delivery partner timeout
            addNotification(`Order ${orderId} has been Picked Up!`, 'info');
          } else if (nextStatus === 'Delivered') {
            addNotification(`Order ${orderId} has been successfully Delivered! 🥳`, 'success');
          } else if (nextStatus === 'Packed') {
            addNotification(`Order ${orderId} is Packed!`, 'info');
          }

          return {
            ...order,
            status: nextStatus,
            updatedAt: timestamp,
            deliveryTimeoutAt,
            statusHistory: [...order.statusHistory, { status: nextStatus, timestamp }]
          };
        }
        return order;
      });
      saveToStorage(PERSIST_KEY_ORDERS, updatedOrders);
      return updatedOrders;
    });
  }, [addNotification]);

  // Delivery partner accepts order
  const acceptDelivery = useCallback((orderId) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId && order.status === 'Ready for Pickup') {
          const timestamp = Date.now();
          addNotification(`Delivery partner has accepted Order ${orderId}!`, 'success');
          return {
            ...order,
            deliveryAccepted: true,
            updatedAt: timestamp,
            deliveryTimeoutAt: null,
            statusHistory: [...order.statusHistory, { status: 'Accepted for Delivery', timestamp }]
          };
        }
        return order;
      });
      saveToStorage(PERSIST_KEY_ORDERS, updatedOrders);
      return updatedOrders;
    });
  }, [addNotification]);

  // Reset demo data back to default seed state
  const resetSystem = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PERSIST_KEY_PRODUCTS);
      await AsyncStorage.removeItem(PERSIST_KEY_ORDERS);
      await AsyncStorage.removeItem(PERSIST_KEY_TRACKING_ORDER_ID);
      setProducts(SEED_PRODUCTS);
      setOrders([]);
      setTrackingOrderId(null);
      setNotifications([]);
      addNotification('System reset successful. Seed data loaded!', 'info');
    } catch (e) {
      console.error('Reset error:', e);
    }
  }, [addNotification]);

  // Set the current view role and persist it
  const selectRole = useCallback((role) => {
    setActiveRole(role);
    AsyncStorage.setItem(PERSIST_KEY_ROLE, role).catch(() => {});
  }, []);

  // Set active retailer and persist it
  const selectRetailer = useCallback((retailerId) => {
    setActiveRetailerId(retailerId);
    AsyncStorage.setItem(PERSIST_KEY_RETAILER, retailerId).catch(() => {});
  }, []);

  // 1-second Interval simulation loop for timeouts
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let ordersUpdated = false;
      let productsToRestore = [];

      setOrders((prevOrders) => {
        const nextOrders = prevOrders.map((order) => {
          // Check Retailer Timeout (Placed state)
          if (order.status === 'Placed' && order.retailerTimeoutAt && now > order.retailerTimeoutAt) {
            ordersUpdated = true;
            productsToRestore.push(order); // Store order to restore its stock
            addNotification(`Order ${order.id} cancelled: Retailer did not respond in time.`, 'error');
            return {
              ...order,
              status: 'Cancelled (Retailer Timeout)',
              updatedAt: now,
              retailerTimeoutAt: null,
              statusHistory: [...order.statusHistory, { status: 'Cancelled (Retailer Timeout)', timestamp: now }]
            };
          }

          // Check Delivery Partner Timeout (Ready for Pickup state)
          if (order.status === 'Ready for Pickup' && order.deliveryTimeoutAt && now > order.deliveryTimeoutAt) {
            ordersUpdated = true;
            productsToRestore.push(order); // Restore stock on delivery cancel too
            addNotification(`Order ${order.id} cancelled: No delivery partner was available.`, 'error');
            return {
              ...order,
              status: 'Cancelled (No Delivery Partner)',
              updatedAt: now,
              deliveryTimeoutAt: null,
              statusHistory: [...order.statusHistory, { status: 'Cancelled (No Delivery Partner)', timestamp: now }]
            };
          }

          return order;
        });

        if (ordersUpdated) {
          saveToStorage(PERSIST_KEY_ORDERS, nextOrders);
          return nextOrders;
        }
        return prevOrders;
      });

      // Restore stock for auto-cancelled orders
      if (productsToRestore.length > 0) {
        setProducts((prevProducts) => {
          let updatedProducts = [...prevProducts];

          productsToRestore.forEach((order) => {
            const productIndex = updatedProducts.findIndex((p) => p.id === order.productId);
            if (productIndex !== -1) {
              const product = updatedProducts[productIndex];
              const retailerId = order.retailerId;
              const retailerData = product.retailers[retailerId];

              updatedProducts[productIndex] = {
                ...product,
                retailers: {
                  ...product.retailers,
                  [retailerId]: {
                    ...retailerData,
                    stock: retailerData.stock + order.quantity
                  }
                }
              };
            }
          });

          saveToStorage(PERSIST_KEY_PRODUCTS, updatedProducts);
          return updatedProducts;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, addNotification]);

  return (
    <AppContext.Provider
      value={{
        products,
        orders,
        activeRole,
        activeRetailerId,
        notifications,
        isLoaded,
        trackingOrderId,
        setTrackingOrderId,
        placeOrder,
        acceptOrder,
        rejectOrder,
        updateOrderStatus,
        acceptDelivery,
        resetSystem,
        selectRole,
        selectRetailer,
        dismissNotification,
        addNotification,
        currentUser,
        userAccounts,
        loginUser,
        registerUser,
        logoutUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
