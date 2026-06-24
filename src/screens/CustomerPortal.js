import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function CustomerPortal() {
  const {
    products,
    orders,
    placeOrder,
    selectRole,
    trackingOrderId,
    setTrackingOrderId,
    logoutUser,
    cart,
    userLocation,
    setUserLocation,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    placeCartOrder,
    notifications,
    favorites = [],
    toggleFavorite,
  } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [dismissedOrderId, setDismissedOrderId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('shop');
  const [expandedHistoryOrderId, setExpandedHistoryOrderId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'nearest' | 'cheapest'
  const [deliveryType, setDeliveryType] = useState('now'); // 'now' | 'scheduled'
  const [selectedSlot, setSelectedSlot] = useState('4:00 PM - 6:00 PM');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [selectedFulfillment, setSelectedFulfillment] = useState('nearest');

  // Additional states for location, chat, animated rider, and notifications
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const [bannerNotif, setBannerNotif] = useState(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const riderProgress = useRef(new Animated.Value(0)).current;

  // Banner Notification Effect
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setBannerNotif(latest);
      
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();

      const timeout = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBannerNotif(null);
        });
      }, 3500);

      return () => clearTimeout(timeout);
    }
  }, [notifications]);

  // Map Rider Progress Animation Effect
  const currentTrackingOrder = orders.find((o) => o.id === trackingOrderId);

  useEffect(() => {
    if (currentTrackingOrder && currentTrackingOrder.status === 'Picked Up') {
      Animated.timing(riderProgress, {
        toValue: 1,
        duration: 12000, // 12 seconds smooth ride simulation
        useNativeDriver: false,
      }).start();
    } else if (currentTrackingOrder && currentTrackingOrder.status === 'Delivered') {
      riderProgress.setValue(1);
    } else {
      riderProgress.setValue(0);
    }
  }, [currentTrackingOrder ? currentTrackingOrder.status : null]);

  // Chat message initial seed for tracking
  useEffect(() => {
    if (currentTrackingOrder) {
      setChatMessages([
        {
          id: '1',
          text: `Hello! Thanks for choosing ${currentTrackingOrder.retailerName}. We are processing your order. Let us know if you need anything!`,
          sender: 'store',
          time: 'Just now'
        }
      ]);
    }
  }, [currentTrackingOrder ? currentTrackingOrder.id : null]);

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');

    const userMsg = { id: Date.now().toString(), text, sender: 'user', time: 'Just now' };
    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      if (!currentTrackingOrder) return;
      let botResponse = "Thank you for the message. We are on it!";
      const lower = text.toLowerCase();

      if (['Placed', 'Accepted', 'Packed'].includes(currentTrackingOrder.status)) {
        if (lower.includes('fresh') || lower.includes('quality')) {
          botResponse = "Yes, all items are freshly checked and packed!";
        } else if (lower.includes('cancel') || lower.includes('stop')) {
          botResponse = "We have already accepted the order, please request support if you need to cancel.";
        } else if (lower.includes('fast') || lower.includes('hurry') || lower.includes('quick')) {
          botResponse = "We are packing it as fast as possible. Ready shortly!";
        } else {
          botResponse = "Fulfillment is in progress. We'll hand it over to a rider soon.";
        }
      } else {
        if (lower.includes('where') || lower.includes('time') || lower.includes('how long')) {
          botResponse = "Just crossed the main roundabout. Will arrive in about 3-5 minutes!";
        } else if (lower.includes('hurry') || lower.includes('fast')) {
          botResponse = "Riding safely but as fast as I can. See you very soon!";
        } else if (lower.includes('call') || lower.includes('phone')) {
          botResponse = "I'm driving right now, will call once I reach your gate.";
        } else {
          botResponse = "I have your order and I am navigating to your address.";
        }
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: currentTrackingOrder.status === 'Picked Up' ? 'rider' : 'store',
          time: 'Just now'
        }
      ]);
    }, 1500);
  };

  // Filter products by search query and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Favorites') {
      matchesCategory = (favorites || []).includes(p.id);
    } else {
      matchesCategory = p.category === selectedCategory;
    }
    return matchesSearch && matchesCategory;
  });

  // Calculate metrics and sort products based on selected sort option
  const getProductMetrics = (product) => {
    const carrying = Object.values(product.retailers).filter(r => r.stock > 0);
    const pool = carrying.length > 0 ? carrying : Object.values(product.retailers);
    const minDistance = Math.min(...pool.map(r => r.distance));
    const minPrice = Math.min(...pool.map(r => r.price));
    return { minDistance, minPrice };
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'nearest') {
      const distA = getProductMetrics(a).minDistance;
      const distB = getProductMetrics(b).minDistance;
      return distA - distB;
    }
    if (sortBy === 'cheapest') {
      const priceA = getProductMetrics(a).minPrice;
      const priceB = getProductMetrics(b).minPrice;
      return priceA - priceB;
    }
    return 0; // default (matching backend/seed order)
  });

  // Find the latest order overall
  const latestOrder = orders.length > 0 ? orders[0] : null;
  const isLatestOrderActive = latestOrder && !['Delivered', 'Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(latestOrder.status);

  // Show floating pill if the order is active, OR if it's not active but the customer hasn't dismissed it yet
  const showFloatingPill = latestOrder && (isLatestOrderActive || dismissedOrderId !== latestOrder.id);

  // Countdown timer local state updating every 100ms for smooth UI ticking
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // One-tap reorder
  const handleBuyAgain = (order) => {
    clearCart();
    const itemsToAdd = order.items && order.items.length > 0
      ? order.items
      : [{ productId: order.productId, quantity: order.quantity }];
    itemsToAdd.forEach((itm) => {
      addToCart(itm.productId, itm.quantity);
    });
    setActiveSubTab('cart');
  };

  // Place order wrapper
  const handlePlaceOrder = (productId, retailerId) => {
    const res = placeOrder(productId, retailerId, quantity);
    if (res.success) {
      setTrackingOrderId(res.order.id);
      setSelectedProduct(null);
      setQuantity(1);
    } else {
      alert(res.error || 'Failed to place order.');
    }
  };

  // Optimization Solver
  const calculateOptimization = () => {
    if (cart.length === 0) return null;

    const storeStats = {
      sharma: { id: 'sharma', name: 'Sharma Kirana Store', totalPrice: 0, itemsAvailable: 0, distance: 0.5, itemsList: [] },
      quick_mart: { id: 'quick_mart', name: 'Quick Mart', totalPrice: 0, itemsAvailable: 0, distance: 1.2, itemsList: [] },
      super_save: { id: 'super_save', name: 'Super Save Supermarket', totalPrice: 0, itemsAvailable: 0, distance: 2.1, itemsList: [] }
    };

    const offsets = {
      Default: { sharma: 0.5, quick_mart: 1.2, super_save: 2.1 },
      Downtown: { sharma: 1.8, quick_mart: 0.4, super_save: 1.5 },
      Suburbs: { sharma: 2.5, quick_mart: 3.1, super_save: 0.6 },
      'West Side': { sharma: 0.9, quick_mart: 2.2, super_save: 3.8 }
    }[userLocation] || { sharma: 0.5, quick_mart: 1.2, super_save: 2.1 };

    Object.keys(storeStats).forEach(id => {
      storeStats[id].distance = offsets[id];
    });

    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) return;

      Object.keys(storeStats).forEach(storeId => {
        const rData = p.retailers[storeId];
        if (rData && rData.stock >= item.quantity) {
          storeStats[storeId].totalPrice += rData.price * item.quantity;
          storeStats[storeId].itemsAvailable += 1;
          storeStats[storeId].itemsList.push({ productId: p.id, name: p.name, price: rData.price, quantity: item.quantity });
        }
      });
    });

    const fullStores = Object.values(storeStats).filter(s => s.itemsAvailable === cart.length);

    let cheapestStore = null;
    let nearestStore = null;

    if (fullStores.length > 0) {
      cheapestStore = [...fullStores].sort((a, b) => a.totalPrice - b.totalPrice)[0];
      nearestStore = [...fullStores].sort((a, b) => a.distance - b.distance)[0];
    }

    const splitOrders = [];
    let splitPossible = true;
    let splitTotalPrice = 0;

    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) {
        splitPossible = false;
        return;
      }

      const options = Object.entries(p.retailers)
        .map(([storeId, rData]) => ({
          storeId,
          ...rData,
          distance: offsets[storeId]
        }))
        .filter(o => o.stock >= item.quantity)
        .sort((a, b) => a.distance - b.distance);

      if (options.length > 0) {
        const bestOption = options[0];
        splitTotalPrice += bestOption.price * item.quantity;
        splitOrders.push({
          productId: p.id,
          productName: p.name,
          retailerId: bestOption.storeId,
          retailerName: bestOption.name,
          quantity: item.quantity,
          price: bestOption.price,
          totalPrice: bestOption.price * item.quantity
        });
      } else {
        splitPossible = false;
      }
    });

    return {
      storeStats,
      cheapestStore,
      nearestStore,
      splitOrders,
      splitPossible,
      splitTotalPrice
    };
  };

  const renderCartTab = () => {
    if (cart.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>Your shopping cart is empty</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => setActiveSubTab('shop')}>
            <Text style={styles.browseBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const opt = calculateOptimization();
    if (!opt) return null;

    const { cheapestStore, nearestStore, splitOrders, splitPossible, splitTotalPrice } = opt;
    
    // Resolve active fulfillment dynamically to strictly comply with React hooks rules
    const activeFulfillment = (selectedFulfillment === 'nearest' && !nearestStore)
      ? 'split'
      : (selectedFulfillment === 'cheapest' && !cheapestStore)
        ? 'split'
        : selectedFulfillment;

    const handleCheckout = async () => {
      let itemsToOrder = [];
      if (activeFulfillment === 'cheapest' && cheapestStore) {
        itemsToOrder = cart.map(item => ({
          productId: item.productId,
          retailerId: cheapestStore.id,
          quantity: item.quantity
        }));
      } else if (activeFulfillment === 'nearest' && nearestStore) {
        itemsToOrder = cart.map(item => ({
          productId: item.productId,
          retailerId: nearestStore.id,
          quantity: item.quantity
        }));
      } else if (activeFulfillment === 'split' && splitPossible) {
        itemsToOrder = splitOrders.map(item => ({
          productId: item.productId,
          retailerId: item.retailerId,
          quantity: item.quantity
        }));
      }

      if (itemsToOrder.length === 0) {
        alert('Invalid fulfillment option selected.');
        return;
      }

      const chosenSlot = deliveryType === 'now' ? 'Deliver Now' : `Scheduled: ${selectedSlot}`;
      const res = placeCartOrder(itemsToOrder, chosenSlot);
      if (res.success) {
        setActiveSubTab('orders');
      } else {
        alert(res.error || 'Failed to place cart order.');
      }
    };

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.cartContainer}>
        <Text style={styles.cartSectionTitle}>Items in Cart</Text>
        
        {cart.map((item) => {
          const prod = products.find(p => p.id === item.productId);
          if (!prod) return null;

          return (
            <View key={item.productId} style={styles.cartItemCard}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.cartItemName}>{prod.name}</Text>
                <Text style={styles.cartItemCategory}>{prod.category}</Text>
              </View>
              
              <View style={styles.cartItemActions}>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateCartQty(item.productId, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={14} color="#475569" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      const maxStock = Math.max(...Object.values(prod.retailers).map(r => r.stock));
                      updateCartQty(item.productId, Math.min(maxStock, item.quantity + 1));
                    }}
                  >
                    <Ionicons name="add" size={14} color="#475569" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.cartDeleteBtn}
                  onPress={() => removeFromCart(item.productId)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.cartSectionTitle}>Smart Fulfillment Options</Text>
        <Text style={styles.cartSectionSub}>Optimized for cost, speed, or stock matching</Text>

        {nearestStore ? (
          <TouchableOpacity
            style={[
              styles.optCard,
              activeFulfillment === 'nearest' && styles.optCardActive
            ]}
            onPress={() => setSelectedFulfillment('nearest')}
          >
            <View style={styles.optRadioCol}>
              <Ionicons
                name={activeFulfillment === 'nearest' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={activeFulfillment === 'nearest' ? '#16a34a' : '#94a3b8'}
              />
            </View>
            <View style={styles.optContentCol}>
              <View style={styles.optBadgeRow}>
                <Text style={styles.optStoreName}>{nearestStore.name}</Text>
                <View style={[styles.badgePill, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.badgePillTxt, { color: '#15803d' }]}>Fastest</Text>
                </View>
              </View>
              <Text style={styles.optMeta}>
                Fulfill entire cart • {nearestStore.distance} km away
              </Text>
              <Text style={styles.optPrice}>₹{nearestStore.totalPrice}</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {cheapestStore ? (
          <TouchableOpacity
            style={[
              styles.optCard,
              activeFulfillment === 'cheapest' && styles.optCardActive
            ]}
            onPress={() => setSelectedFulfillment('cheapest')}
          >
            <View style={styles.optRadioCol}>
              <Ionicons
                name={activeFulfillment === 'cheapest' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={activeFulfillment === 'cheapest' ? '#16a34a' : '#94a3b8'}
              />
            </View>
            <View style={styles.optContentCol}>
              <View style={styles.optBadgeRow}>
                <Text style={styles.optStoreName}>{cheapestStore.name}</Text>
                <View style={[styles.badgePill, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.badgePillTxt, { color: '#b45309' }]}>Cheapest</Text>
                </View>
              </View>
              <Text style={styles.optMeta}>
                Fulfill entire cart • {cheapestStore.distance} km away
              </Text>
              <Text style={styles.optPrice}>₹{cheapestStore.totalPrice}</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {splitPossible ? (
          <TouchableOpacity
            style={[
              styles.optCard,
              activeFulfillment === 'split' && styles.optCardActive
            ]}
            onPress={() => setSelectedFulfillment('split')}
          >
            <View style={styles.optRadioCol}>
              <Ionicons
                name={activeFulfillment === 'split' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={activeFulfillment === 'split' ? '#16a34a' : '#94a3b8'}
              />
            </View>
            <View style={styles.optContentCol}>
              <View style={styles.optBadgeRow}>
                <Text style={styles.optStoreName}>Smart Split Delivery</Text>
                <View style={[styles.badgePill, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.badgePillTxt, { color: '#0369a1' }]}>Guaranteed Stock</Text>
                </View>
              </View>
              <Text style={styles.optMeta}>
                Split order across {new Set(splitOrders.map(s => s.retailerId)).size} nearest carrying stores
              </Text>
              <View style={styles.splitBreakdown}>
                {splitOrders.map((sItem, index) => (
                  <Text key={index} style={styles.splitBreakdownTxt}>
                    • {sItem.productName} ({sItem.quantity}x) from {sItem.retailerName} (₹{sItem.totalPrice})
                  </Text>
                ))}
              </View>
              <Text style={styles.optPrice}>Total: ₹{splitTotalPrice}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.splitDisabledCard}>
            <Ionicons name="warning-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.splitDisabledTxt}>Some items are completely out of stock across all stores.</Text>
          </View>
        )}

        {/* Delivery Scheduler Section */}
        <Text style={styles.cartSectionTitle}>Delivery Schedule</Text>
        <Text style={styles.cartSectionSub}>Select your preferred delivery slot</Text>

        <View style={styles.schedulerTypeRow}>
          <TouchableOpacity
            style={[
              styles.schedulerTypeCard,
              deliveryType === 'now' && styles.schedulerTypeCardActive
            ]}
            onPress={() => setDeliveryType('now')}
          >
            <Ionicons
              name="flash-outline"
              size={20}
              color={deliveryType === 'now' ? '#16a34a' : '#64748b'}
            />
            <Text style={[
              styles.schedulerTypeLabel,
              deliveryType === 'now' && styles.schedulerTypeLabelActive
            ]}>
              Deliver Now
            </Text>
            <Text style={styles.schedulerTypeSub}>
              Under 20 mins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.schedulerTypeCard,
              deliveryType === 'scheduled' && styles.schedulerTypeCardActive
            ]}
            onPress={() => setDeliveryType('scheduled')}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={deliveryType === 'scheduled' ? '#16a34a' : '#64748b'}
            />
            <Text style={[
              styles.schedulerTypeLabel,
              deliveryType === 'scheduled' && styles.schedulerTypeLabelActive
            ]}>
              Schedule Later
            </Text>
            <Text style={styles.schedulerTypeSub}>
              Pick a time slot
            </Text>
          </TouchableOpacity>
        </View>

        {deliveryType === 'scheduled' && (
          <View style={styles.slotsWrapper}>
            {['4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM', '8:00 PM - 10:00 PM'].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotChip,
                  selectedSlot === slot && styles.slotChipActive
                ]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Ionicons
                  name="alarm-outline"
                  size={14}
                  color={selectedSlot === slot ? '#ffffff' : '#64748b'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.slotChipText,
                  selectedSlot === slot && styles.slotChipTextActive
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnTxt}>Place Optimized Order</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderTrackingMap = (order) => {
    const leftPos = riderProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [30, width - 32 - 70],
    });

    return (
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Live Delivery Route</Text>
        <View style={styles.mapBox}>
          <View style={styles.roadLine} />

          <View style={[styles.mapNode, { left: 20 }]}>
            <View style={styles.mapNodeIconBgStore}>
              <Ionicons name="storefront" size={16} color="#ffffff" />
            </View>
            <Text style={styles.mapNodeLabel}>Store</Text>
          </View>

          <View style={[styles.mapNode, { right: 20 }]}>
            <View style={styles.mapNodeIconBgHome}>
              <Ionicons name="home" size={16} color="#ffffff" />
            </View>
            <Text style={styles.mapNodeLabel}>Home</Text>
          </View>

          <Animated.View style={[styles.mapRiderNode, { left: leftPos }]}>
            <View style={styles.mapNodeIconBgRider}>
              <Ionicons name="bicycle" size={16} color="#ffffff" />
            </View>
            <Text style={styles.mapRiderLabel}>Rider</Text>
          </Animated.View>
        </View>
        <Text style={styles.mapStatusFooter}>
          {order.status === 'Picked Up'
            ? 'Rider is on the way to your address!'
            : order.status === 'Delivered'
              ? 'Delivery complete!'
              : 'Waiting for rider pickup...'}
        </Text>
      </View>
    );
  };

  const renderTrackingChat = (order) => {
    return (
      <View style={styles.trackingChatBox}>
        <Text style={styles.chatTitle}>Direct Store / Rider Chat</Text>
        <View style={styles.chatLogsContainer}>
          <ScrollView
            style={styles.chatLogsSub}
            contentContainerStyle={{ padding: 10 }}
            nestedScrollEnabled
          >
            {chatMessages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.chatMsgRow,
                    isUser ? styles.chatMsgRowUser : styles.chatMsgRowStore
                  ]}
                >
                  <View
                    style={[
                      styles.chatMsgBubble,
                      isUser ? styles.chatMsgBubbleUser : styles.chatMsgBubbleStore
                    ]}
                  >
                    <Text style={styles.chatMsgSenderLabel}>
                      {isUser ? 'You' : m.sender === 'rider' ? 'Delivery Partner' : order.retailerName}
                    </Text>
                    <Text style={[styles.chatMsgTxt, isUser && styles.chatMsgTxtUser]}>{m.text}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.chatInputBar}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Type message..."
            placeholderTextColor="#94a3b8"
            style={styles.chatTextInput}
            onSubmitEditing={handleSendChat}
          />
          <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat}>
            <Ionicons name="send" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render product detail comparison view
  if (selectedProduct) {
    const product = products.find((p) => p.id === selectedProduct.id);
    const retailersList = Object.entries(product.retailers)
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .sort((a, b) => a.distance - b.distance);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Retailer</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailScrollContent}>
          <View style={styles.detailCard}>
            <LinearGradient colors={['#e2e8f0', '#f1f5f9']} style={styles.detailImageContainer}>
              <Ionicons name="fast-food" size={80} color="#94a3b8" />
            </LinearGradient>
            <View style={styles.detailInfo}>
              <Text style={styles.detailCategory}>{product.category}</Text>
              <Text style={styles.detailName}>{product.name}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Nearby Retailers Carrying This Item</Text>

          {retailersList.map((retailer) => {
            const isOutOfStock = retailer.stock === 0;
            return (
              <View
                key={retailer.id}
                style={[
                  styles.retailerCard,
                  isOutOfStock && styles.retailerCardDisabled,
                ]}
              >
                <View style={styles.retailerTopRow}>
                  <View style={styles.retailerStoreInfo}>
                    <Text style={styles.retailerStoreName}>{retailer.name}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.ratingText}>{retailer.rating}</Text>
                      </View>
                      <Text style={styles.distanceText}>• {retailer.distance} km away</Text>
                    </View>
                  </View>
                  <Text style={styles.retailerPrice}>₹{retailer.price}</Text>
                </View>

                <View style={styles.retailerBottomRow}>
                  <View>
                    <Text style={styles.stockLabel}>Stock Status</Text>
                    {isOutOfStock ? (
                      <Text style={styles.outOfStockText}>Out of stock</Text>
                    ) : (
                      <Text style={styles.inStockText}>{retailer.stock} units available</Text>
                    )}
                  </View>

                  {!isOutOfStock ? (
                    <View style={styles.orderActionsContainer}>
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Ionicons name="remove" size={16} color="#475569" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => setQuantity(Math.min(retailer.stock, quantity + 1))}
                        >
                          <Ionicons name="add" size={16} color="#475569" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.placeOrderBtn}
                        onPress={() => handlePlaceOrder(product.id, retailer.id)}
                      >
                        <Text style={styles.placeOrderBtnText}>Order</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.disabledOrderBadge}>
                      <Text style={styles.disabledOrderBadgeText}>Unavailable</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Render active order tracking view
  if (currentTrackingOrder) {
    const o = currentTrackingOrder;
    const isCompleted = o.status === 'Delivered';
    const isFailed = ['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(o.status);

    // Stepper setup
    const steps = [
      { name: 'Placed', icon: 'cart-outline' },
      { name: 'Accepted', icon: 'storefront-outline' },
      { name: 'Packed', icon: 'cube-outline' },
      { name: 'Ready for Pickup', icon: 'alarm-outline' },
      { name: 'Picked Up', icon: 'bicycle-outline' },
      { name: 'Delivered', icon: 'home-outline' },
    ];

    const getActiveStepIndex = (status) => {
      if (status === 'Placed') return 0;
      if (status === 'Accepted') return 1;
      if (status === 'Packed') return 2;
      if (status === 'Ready for Pickup') return 3;
      if (status === 'Picked Up') return 4;
      if (status === 'Delivered') return 5;
      return -1;
    };

    const activeStepIndex = getActiveStepIndex(o.status);

    // Calculate timeouts
    let timerMessage = null;
    let countdownSecs = 0;

    if (o.status === 'Placed' && o.retailerTimeoutAt) {
      countdownSecs = Math.max(0, Math.ceil((o.retailerTimeoutAt - currentTime) / 1000));
      timerMessage = `Awaiting Retailer Acceptance (${countdownSecs}s)`;
    } else if (o.status === 'Ready for Pickup' && o.deliveryTimeoutAt) {
      countdownSecs = Math.max(0, Math.ceil((o.deliveryTimeoutAt - currentTime) / 1000));
      timerMessage = `Awaiting Delivery Acceptance (${countdownSecs}s)`;
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setTrackingOrderId(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Order</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.trackScrollContent}>
          {/* Main tracking status banner */}
          <LinearGradient
            colors={isFailed ? ['#fef2f2', '#fee2e2'] : isCompleted ? ['#f0fdf4', '#dcfce7'] : ['#e0e7ff', '#c7d2fe']}
            style={styles.statusBanner}
          >
            <View style={styles.statusBannerHeader}>
              <Text style={styles.statusOrderId}>Order #{o.id}</Text>
              <Text style={[
                styles.statusTextValue,
                isFailed ? styles.colorRed : isCompleted ? styles.colorGreen : styles.colorBlue
              ]}>
                {o.status}
              </Text>
            </View>
            <Text style={styles.statusBannerSub}>From {o.retailerName}</Text>
            <Text style={styles.statusBannerItem}>{o.quantity}x {o.productName} • ₹{o.totalPrice}</Text>

            {o.deliverySlot && o.deliverySlot !== 'Deliver Now' && (
              <View style={styles.trackingSlotRow}>
                <Ionicons name="calendar-outline" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={styles.trackingSlotText}>{o.deliverySlot}</Text>
              </View>
            )}

            {timerMessage && (
              <View style={styles.countdownRow}>
                <Ionicons name="timer-outline" size={16} color={countdownSecs < 10 ? '#ef4444' : '#16a34a'} />
                <Text style={[styles.countdownText, countdownSecs < 10 && styles.countdownAlert]}>
                  {timerMessage}
                </Text>
              </View>
            )}
          </LinearGradient>


          {/* Stepper Layout */}
          {!isFailed ? (
            <View style={styles.stepperContainer}>
              {steps.map((step, idx) => {
                const isCompletedStep = idx < activeStepIndex;
                const isActiveStep = idx === activeStepIndex;
                const isPendingStep = idx > activeStepIndex;

                const stepHistory = o.statusHistory.find((h) => h.status === step.name);
                const stepTime = stepHistory
                  ? new Date(stepHistory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '';

                return (
                  <View key={step.name} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View style={[
                        styles.stepDot,
                        isCompletedStep && styles.stepDotCompleted,
                        isActiveStep && styles.stepDotActive,
                        isPendingStep && styles.stepDotPending,
                      ]}>
                        <Ionicons
                          name={step.icon}
                          size={16}
                          color={isCompletedStep ? '#ffffff' : isActiveStep ? '#4f46e5' : '#94a3b8'}
                        />
                      </View>
                      {idx < steps.length - 1 && (
                        <View style={[
                          styles.stepLine,
                          idx < activeStepIndex && styles.stepLineCompleted
                        ]} />
                      )}
                    </View>

                    <View style={styles.stepContentCol}>
                      <Text style={[
                        styles.stepNameText,
                        isActiveStep && styles.stepNameActiveText,
                        isPendingStep && styles.stepNamePendingText,
                      ]}>
                        {step.name}
                      </Text>
                      {stepTime ? (
                        <Text style={styles.stepTimeText}>{stepTime}</Text>
                      ) : isActiveStep ? (
                        <Text style={styles.stepTimeActiveLabel}>In progress...</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.failedTimeline}>
              <View style={styles.failedHeaderRow}>
                <Ionicons name="close-circle-outline" size={32} color="#ef4444" />
                <Text style={styles.failedTitle}>Order Cancelled / Rejected</Text>
              </View>
              <Text style={styles.failedDescription}>
                {o.status === 'Rejected' && `The retailer ${o.retailerName || 'Sharma Kirana Store'} rejected your order. The stock has been restored, and no payment was charged.`}
                {o.status === 'Cancelled (Retailer Timeout)' && `The retailer failed to accept the order within the 60-second window. The order was automatically cancelled.`}
                {o.status === 'Cancelled (No Delivery Partner)' && `No delivery partner accepted the request within 60 seconds. The order was automatically cancelled.`}
              </Text>
              <Text style={styles.failedTimestamp}>
                Time: {new Date(o.updatedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}

          {/* Visual 2D Route Tracking Map */}
          {!isFailed && renderTrackingMap(o)}

          {/* Direct Chat Console */}
          {!isFailed && renderTrackingChat(o)}

          <TouchableOpacity style={styles.shopMoreBtn} onPress={() => setTrackingOrderId(null)}>
            <Text style={styles.shopMoreBtnText}>Back to Product List</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const renderOrderHistoryItem = ({ item }) => {
    const isFailed = ['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(item.status);
    const isCompleted = item.status === 'Delivered';
    const isExpanded = expandedHistoryOrderId === item.id;

    // Stepper setup
    const steps = [
      { name: 'Placed', icon: 'cart-outline' },
      { name: 'Accepted', icon: 'storefront-outline' },
      { name: 'Packed', icon: 'cube-outline' },
      { name: 'Ready for Pickup', icon: 'alarm-outline' },
      { name: 'Picked Up', icon: 'bicycle-outline' },
      { name: 'Delivered', icon: 'home-outline' },
    ];

    const getActiveStepIndex = (status) => {
      if (status === 'Placed') return 0;
      if (status === 'Accepted') return 1;
      if (status === 'Packed') return 2;
      if (status === 'Ready for Pickup') return 3;
      if (status === 'Picked Up') return 4;
      if (status === 'Delivered') return 5;
      return -1;
    };

    const activeStepIndex = getActiveStepIndex(item.status);
    const formattedDate = new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.orderHistoryCard}>
        <TouchableOpacity
          style={styles.orderHistoryHeader}
          onPress={() => setExpandedHistoryOrderId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.historyCardHeaderTop}>
              <Text style={styles.orderHistoryTitle}>Order #{item.id}</Text>
              <View style={[
                styles.historyItemStatusBadge,
                isCompleted ? styles.badgeGreen : isFailed ? styles.badgeRed : styles.badgeBlue
              ]}>
                <Text style={[
                  styles.historyItemStatusText,
                  isCompleted ? styles.textGreen : isFailed ? styles.textRed : styles.textBlue
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.orderHistoryProductText}>{item.quantity}x {item.productName}</Text>
            <Text style={styles.orderHistoryMeta}>
              From {item.retailerName} • ₹{item.totalPrice} {item.deliverySlot && item.deliverySlot !== 'Deliver Now' ? `• ${item.deliverySlot}` : ''}
            </Text>
            <Text style={styles.orderHistoryTime}>
              {formattedDate}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#64748b"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.historyTimelineDivider} />
            
            {/* Live active order tracking shortcut button */}
            {!isCompleted && !isFailed && (
              <TouchableOpacity
                style={styles.trackOverlayBtn}
                onPress={() => setTrackingOrderId(item.id)}
              >
                <Ionicons name="navigate-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.trackOverlayBtnText}>Track Live Status (Full Screen)</Text>
              </TouchableOpacity>
            )}

            {isCompleted && (
              <View style={styles.historyActionRow}>
                <TouchableOpacity
                  style={styles.historyActionBtnSecondary}
                  onPress={() => setSelectedReceiptOrder(item)}
                >
                  <Ionicons name="receipt-outline" size={16} color="#16a34a" style={{ marginRight: 6 }} />
                  <Text style={styles.historyActionBtnSecondaryTxt}>View Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.historyActionBtnPrimary}
                  onPress={() => handleBuyAgain(item)}
                >
                  <Ionicons name="refresh-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.historyActionBtnPrimaryTxt}>Buy Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {isFailed && (
              <View style={[styles.historyActionRow, { marginBottom: 16 }]}>
                <TouchableOpacity
                  style={[styles.historyActionBtnPrimary, { flex: 1 }]}
                  onPress={() => handleBuyAgain(item)}
                >
                  <Ionicons name="refresh-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.historyActionBtnPrimaryTxt}>Reorder Items</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isFailed ? (
              <View style={styles.historyStepperContainer}>
                {steps.map((step, idx) => {
                  const isCompletedStep = idx < activeStepIndex;
                  const isActiveStep = idx === activeStepIndex;
                  const isPendingStep = idx > activeStepIndex;

                  const stepHistory = item.statusHistory?.find((h) => h.status === step.name);
                  const stepTime = stepHistory
                    ? new Date(stepHistory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <View key={step.name} style={styles.historyStepRow}>
                      <View style={styles.historyStepIndicatorCol}>
                        <View style={[
                          styles.historyStepDot,
                          isCompletedStep && styles.historyStepDotCompleted,
                          isActiveStep && styles.historyStepDotActive,
                          isPendingStep && styles.historyStepDotPending,
                        ]}>
                          <Ionicons
                            name={step.icon}
                            size={12}
                            color={isCompletedStep ? '#ffffff' : isActiveStep ? '#4f46e5' : '#94a3b8'}
                          />
                        </View>
                        {idx < steps.length - 1 && (
                          <View style={[
                            styles.historyStepLine,
                            idx < activeStepIndex && styles.historyStepLineCompleted
                          ]} />
                        )}
                      </View>

                      <View style={styles.historyStepContentCol}>
                        <Text style={[
                          styles.historyStepNameText,
                          isActiveStep && styles.historyStepNameActiveText,
                          isPendingStep && styles.historyStepNamePendingText,
                        ]}>
                          {step.name}
                        </Text>
                        {stepTime ? (
                          <Text style={styles.historyStepTimeText}>{stepTime}</Text>
                        ) : isActiveStep ? (
                          <Text style={styles.historyStepTimeActiveLabel}>In progress...</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.historyFailedTimeline}>
                <View style={styles.failedHeaderRow}>
                  <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
                  <Text style={styles.failedTitle}>Order Cancelled / Rejected</Text>
                </View>
                <Text style={styles.failedDescription}>
                  {item.status === 'Rejected' && `The retailer ${item.retailerName || 'Sharma Kirana Store'} rejected your order. The stock has been restored, and no payment was charged.`}
                  {item.status === 'Cancelled (Retailer Timeout)' && `Sharma Kirana failed to accept the order within 60 seconds.`}
                  {item.status === 'Cancelled (No Delivery Partner)' && `No delivery rider accepted within 60 seconds.`}
                </Text>
                <Text style={styles.failedTimestamp}>
                  Ended: {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render primary product browse list view
  return (
    <View style={styles.container}>
      {/* Slide-Down Notification Banner */}
      {bannerNotif && (
        <Animated.View
          style={[
            styles.notifBanner,
            { transform: [{ translateY: slideAnim }] },
            bannerNotif.type === 'error' && styles.notifBannerError,
            bannerNotif.type === 'success' && styles.notifBannerSuccess
          ]}
        >
          <Ionicons
            name={
              bannerNotif.type === 'error'
                ? 'alert-circle'
                : bannerNotif.type === 'success'
                  ? 'checkmark-circle'
                  : 'information-circle'
            }
            size={20}
            color="#ffffff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.notifBannerTxt}>{bannerNotif.message}</Text>
        </Animated.View>
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={isLocationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLocationModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsLocationModalOpen(false)}
        >
          <View style={styles.locationModalContent}>
            <Text style={styles.locationModalTitle}>Select Neighborhood</Text>
            <Text style={styles.locationModalSub}>Store distances will adjust dynamically</Text>
            {['Default', 'Downtown', 'Suburbs', 'West Side'].map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationModalItem,
                  userLocation === loc && styles.locationModalItemActive
                ]}
                onPress={() => {
                  setUserLocation(loc);
                  setIsLocationModalOpen(false);
                }}
              >
                <Ionicons
                  name={userLocation === loc ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={userLocation === loc ? '#16a34a' : '#64748b'}
                  style={{ marginRight: 10 }}
                />
                <Text style={[
                  styles.locationModalText,
                  userLocation === loc && styles.locationModalTextActive
                ]}>
                  {loc} {loc === 'Default' ? '(Sharma closest)' : loc === 'Downtown' ? '(Quick Mart closest)' : loc === 'Suburbs' ? '(Super Save closest)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.topBanner}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>NearFind</Text>
            <TouchableOpacity
              onPress={() => setIsLocationModalOpen(true)}
              style={styles.locationHeaderBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={14} color="#bbf7d0" />
              <Text style={styles.locationHeaderTxt}>{userLocation}</Text>
              <Ionicons name="chevron-down" size={12} color="#bbf7d0" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.appSubtitle}>Hyperlocal discovery & lightning-fast deliveries</Text>

        {activeSubTab === 'shop' && (
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                placeholder="Search noodles, butter, atta, beverages..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {['All', 'Favorites', 'Packaged Food', 'Dairy & Eggs', 'Beverages', 'Grocery & Staples', 'Snacks & Biscuits'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive,
                    cat === 'Favorites' && { flexDirection: 'row', alignItems: 'center' }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  {cat === 'Favorites' && (
                    <Ionicons
                      name="heart"
                      size={12}
                      color={selectedCategory === 'Favorites' ? '#ef4444' : '#e2e8f0'}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.categoryChipTextActive,
                      cat === 'Favorites' && selectedCategory === 'Favorites' && { color: '#ef4444' }
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortScrollContent}
              >
                {[
                  { id: 'default', label: 'Default', icon: 'funnel-outline' },
                  { id: 'nearest', label: 'Nearest Store', icon: 'location-outline' },
                  { id: 'cheapest', label: 'Lowest Price', icon: 'pricetag-outline' }
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.sortChip,
                      sortBy === opt.id && styles.sortChipActive
                    ]}
                    onPress={() => setSortBy(opt.id)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={13}
                      color={sortBy === opt.id ? '#16a34a' : '#bbf7d0'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.sortChipText,
                        sortBy === opt.id && styles.sortChipTextActive
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </LinearGradient>

      {/* Sub Tabs */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          onPress={() => setActiveSubTab('shop')}
          style={[styles.subTabBtn, activeSubTab === 'shop' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'shop' && styles.subTabLabelActive]}>
            Shop Items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('cart')}
          style={[styles.subTabBtn, activeSubTab === 'cart' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'cart' && styles.subTabLabelActive]}>
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('orders')}
          style={[styles.subTabBtn, activeSubTab === 'orders' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'orders' && styles.subTabLabelActive]}>
            My Orders ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'shop' ? (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No items found matching your query</Text>
            </View>
          }
          renderItem={({ item }) => {
            // Calculate overall availability
            const storesWithStock = Object.values(item.retailers).filter((r) => r.stock > 0).length;
            const totalStores = Object.keys(item.retailers).length;
            const bestPrice = Math.min(...Object.values(item.retailers).map((r) => r.price));
            const cartItem = cart.find(c => c.productId === item.id);

            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => setSelectedProduct(item)}
              >
                <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={40} color="#94a3b8" />
                  <TouchableOpacity
                    style={styles.favoriteHeartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                  >
                    <Ionicons
                      name={(favorites || []).includes(item.id) ? "heart" : "heart-outline"}
                      size={18}
                      color={(favorites || []).includes(item.id) ? "#ef4444" : "#64748b"}
                    />
                  </TouchableOpacity>
                </LinearGradient>
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productName}>{item.name}</Text>
                  <View style={styles.productFooter}>
                    <Text style={styles.productPriceLabel}>
                      From <Text style={styles.productPriceText}>₹{bestPrice}</Text>
                    </Text>
                    <View style={styles.availabilityRow}>
                      <View style={[
                        styles.indicatorDot,
                        storesWithStock > 0 ? styles.dotGreen : styles.dotRed
                      ]} />
                      <Text style={styles.availabilityText}>
                        {storesWithStock > 0 ? `${storesWithStock}/${totalStores} stores` : 'Out of stock'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Inline Cart Controls */}
                {storesWithStock > 0 ? (
                  cartItem ? (
                    <View
                      style={styles.inlineQtyContainer}
                      onStartShouldSetResponder={() => true}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      <TouchableOpacity
                        style={styles.inlineQtyBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          updateCartQty(item.id, cartItem.quantity - 1);
                        }}
                      >
                        <Ionicons name="remove" size={12} color="#16a34a" />
                      </TouchableOpacity>
                      <Text style={styles.inlineQtyText}>{cartItem.quantity}</Text>
                      <TouchableOpacity
                        style={styles.inlineQtyBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          const maxStock = Math.max(...Object.values(item.retailers).map(r => r.stock));
                          updateCartQty(item.id, Math.min(maxStock, cartItem.quantity + 1));
                        }}
                      >
                        <Ionicons name="add" size={12} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.inlineAddBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        addToCart(item.id, 1);
                      }}
                    >
                      <Text style={inlineAddBtnTxt => styles.inlineAddBtnTxt}>+ Add</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={styles.inlineOosBadge}>
                    <Text style={styles.inlineOosTxt}>OOS</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      ) : activeSubTab === 'cart' ? (
        renderCartTab()
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
            </View>
          }
          renderItem={renderOrderHistoryItem}
        />
      )}

      {/* Floating live order progress pill */}
      {showFloatingPill && (
        <TouchableOpacity
          style={[
            styles.floatingTrackPill,
            !isLatestOrderActive && (
              latestOrder.status === 'Delivered' ? styles.floatingTrackPillSuccess : styles.floatingTrackPillFailed
            )
          ]}
          onPress={() => setTrackingOrderId(latestOrder.id)}
        >
          <View style={styles.floatingContent}>
            <View style={styles.pulseContainer}>
              <View style={[
                styles.pulseDot,
                !isLatestOrderActive && (
                  latestOrder.status === 'Delivered' ? styles.pulseDotSuccess : styles.pulseDotFailed
                )
              ]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingTitle}>
                {isLatestOrderActive 
                  ? `Active Order #${latestOrder.id}` 
                  : latestOrder.status === 'Delivered' 
                    ? `Order Delivered! 🥳` 
                    : `Order Cancelled / Rejected`}
              </Text>
              <Text style={styles.floatingSubtitle}>
                {isLatestOrderActive 
                  ? `${latestOrder.productName} is ${latestOrder.status}`
                  : `Tap to view details`}
              </Text>
            </View>
            <Ionicons name="eye" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            
            {/* If completed/failed, show a close button to dismiss */}
            {!isLatestOrderActive && (
              <TouchableOpacity
                style={styles.closePillBtn}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent launching the tracking screen
                  setDismissedOrderId(latestOrder.id);
                }}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.75)" style={{ marginLeft: 12 }} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceiptOrder && (
        <Modal
          visible={!!selectedReceiptOrder}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReceiptOrder(null)}
        >
          <View style={styles.receiptModalOverlay}>
            <View style={styles.receiptContainer}>
              <View style={styles.receiptHeader}>
                <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
                <Text style={styles.receiptTitle}>Payment Receipt</Text>
                <Text style={styles.receiptSubtitle}>NearFind Delivery Network</Text>
              </View>

              <View style={styles.receiptDivider} />

              {/* Order Meta Info */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID</Text>
                <Text style={[styles.receiptValue, { fontWeight: '700' }]}>#{selectedReceiptOrder.id}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Merchant</Text>
                <Text style={styles.receiptValue}>{selectedReceiptOrder.retailerName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date</Text>
                <Text style={styles.receiptValue}>
                  {new Date(selectedReceiptOrder.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Slot</Text>
                <Text style={[styles.receiptValue, { color: '#16a34a', fontWeight: '700' }]}>
                  {selectedReceiptOrder.deliverySlot || 'Deliver Now'}
                </Text>
              </View>

              <View style={styles.receiptDivider} />

              {/* Items Table */}
              <Text style={[styles.receiptLabel, { marginBottom: 8, fontWeight: '700' }]}>Items Ordered</Text>
              {selectedReceiptOrder.items && selectedReceiptOrder.items.length > 0 ? (
                selectedReceiptOrder.items.map((item, idx) => (
                  <View key={idx} style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemName}>{item.productName}</Text>
                    <Text style={styles.receiptItemQtyPrice}>{item.quantity} x ₹{item.price}</Text>
                    <Text style={styles.receiptItemTotal}>₹{item.quantity * item.price}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemName}>{selectedReceiptOrder.productName}</Text>
                  <Text style={styles.receiptItemQtyPrice}>{selectedReceiptOrder.quantity} x ₹{selectedReceiptOrder.totalPrice / selectedReceiptOrder.quantity}</Text>
                  <Text style={styles.receiptItemTotal}>₹{selectedReceiptOrder.totalPrice}</Text>
                </View>
              )}

              <View style={styles.receiptDivider} />

              {/* Cost Summary */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Items Subtotal</Text>
                <Text style={styles.receiptValue}>₹{selectedReceiptOrder.totalPrice}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Partner Fee</Text>
                <Text style={styles.receiptValue}>₹30</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Rider Payout (Platform Sponsored)</Text>
                <Text style={[styles.receiptValue, { color: '#16a34a', fontWeight: '600' }]}>₹25 (Incl.)</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Tax & Services</Text>
                <Text style={styles.receiptValue}>₹0</Text>
              </View>

              <View style={styles.receiptDivider} />

              {/* Total Row */}
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Total Amount Paid</Text>
                <Text style={styles.receiptTotalValue}>₹{selectedReceiptOrder.totalPrice + 30}</Text>
              </View>

              {/* Savings Box */}
              <View style={styles.receiptSavingsBox}>
                <Ionicons name="gift-outline" size={16} color="#15803d" style={{ marginRight: 6 }} />
                <Text style={styles.receiptSavingsTxt}>
                  Congratulations! You saved ₹{Math.round(selectedReceiptOrder.totalPrice * 0.15)} on this order.
                </Text>
              </View>

              {/* Barcode Graphic */}
              <View style={styles.barcodeContainer}>
                <View style={styles.barcodeLines}>
                  {[2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4].map((w, idx) => (
                    <View
                      key={idx}
                      style={{
                        width: w,
                        height: 36,
                        backgroundColor: '#0f172a',
                        marginHorizontal: 1,
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeText}>NF-{selectedReceiptOrder.id}</Text>
              </View>

              <TouchableOpacity
                style={styles.receiptCloseBtn}
                onPress={() => setSelectedReceiptOrder(null)}
              >
                <Text style={styles.receiptCloseBtnTxt}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBanner: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#bbf7d0',
    marginTop: 4,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90, // extra spacing for floating pill / nav tab
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  productPriceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  productPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotRed: {
    backgroundColor: '#ef4444',
  },
  availabilityText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingTop: 8,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailScrollContent: {
    padding: 16,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  detailImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
    marginLeft: 16,
  },
  detailCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    marginLeft: 4,
  },
  retailerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 2,
  },
  retailerCardDisabled: {
    opacity: 0.65,
    backgroundColor: '#f1f5f9',
  },
  retailerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  retailerStoreInfo: {
    flex: 1,
  },
  retailerStoreName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    marginLeft: 3,
  },
  distanceText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  retailerPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
  },
  retailerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  stockLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  inStockText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  outOfStockText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
  orderActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginRight: 10,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 8,
  },
  placeOrderBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  placeOrderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledOrderBadge: {
    backgroundColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disabledOrderBadgeText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  trackScrollContent: {
    padding: 16,
  },
  statusBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  statusBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusOrderId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  statusTextValue: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBannerSub: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  statusBannerItem: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 6,
  },
  countdownAlert: {
    color: '#ef4444',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 12,
    color: '#0369a1',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  stepperContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepDotActive: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  stepDotPending: {
    borderColor: '#cbd5e1',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  stepContentCol: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 16,
  },
  stepNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepNameActiveText: {
    color: '#16a34a',
  },
  stepNamePendingText: {
    color: '#94a3b8',
  },
  stepTimeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  stepTimeActiveLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 2,
  },
  failedTimeline: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 16,
  },
  failedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  failedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
    marginLeft: 10,
  },
  failedDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  failedTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
  shopMoreBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopMoreBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingTrackPill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#14532d',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingTrackPillSuccess: {
    backgroundColor: '#065f46',
  },
  floatingTrackPillFailed: {
    backgroundColor: '#991b1b',
  },
  floatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  pulseDotSuccess: {
    backgroundColor: '#34d399',
  },
  pulseDotFailed: {
    backgroundColor: '#f87171',
  },
  closePillBtn: {
    padding: 4,
  },
  floatingTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  colorBlue: {
    color: '#16a34a',
  },
  colorGreen: {
    color: '#10b981',
  },
  colorRed: {
    color: '#ef4444',
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabBtnActive: {
    backgroundColor: '#f0fdf4',
  },
  subTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  subTabLabelActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  orderHistoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 10,
  },
  orderHistoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  orderHistoryProductText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  orderHistoryMeta: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  orderHistoryTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  expandedContent: {
    marginTop: 12,
  },
  historyTimelineDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  trackOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  trackOverlayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  historyStepperContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyStepRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  historyStepIndicatorCol: {
    alignItems: 'center',
    marginRight: 12,
  },
  historyStepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  historyStepDotCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  historyStepDotActive: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  historyStepDotPending: {
    borderColor: '#cbd5e1',
  },
  historyStepLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  historyStepLineCompleted: {
    backgroundColor: '#10b981',
  },
  historyStepContentCol: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 10,
  },
  historyStepNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyStepNameActiveText: {
    color: '#16a34a',
  },
  historyStepNamePendingText: {
    color: '#94a3b8',
  },
  historyStepTimeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  historyStepTimeActiveLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 1,
  },
  historyFailedTimeline: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  historyItemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyItemStatusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgeGreen: {
    backgroundColor: '#f0fdf4',
  },
  textGreen: {
    color: '#10b981',
  },
  badgeRed: {
    backgroundColor: '#fef2f2',
  },
  textRed: {
    color: '#ef4444',
  },
  badgeBlue: {
    backgroundColor: '#f0fdf4',
  },
  textBlue: {
    color: '#16a34a',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  categoryScroll: {
    marginTop: 12,
  },
  categoryScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryChipActive: {
    backgroundColor: '#ffffff',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  categoryChipTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  locationHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationHeaderTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModalContent: {
    width: width - 64,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  locationModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  locationModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  locationModalItemActive: {
    backgroundColor: '#f0fdf4',
  },
  locationModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  locationModalTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  inlineAddBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddBtnTxt: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    padding: 2,
  },
  inlineQtyBtn: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    paddingHorizontal: 6,
  },
  inlineOosBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineOosTxt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  cartContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  cartSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 4,
  },
  cartSectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cartItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cartItemCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartDeleteBtn: {
    marginLeft: 12,
    padding: 6,
  },
  optCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optCardActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  optRadioCol: {
    marginRight: 12,
    justifyContent: 'center',
  },
  optContentCol: {
    flex: 1,
  },
  optBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optStoreName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  optMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  optPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 8,
  },
  splitBreakdown: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  splitBreakdownTxt: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  splitDisabledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  splitDisabledTxt: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  checkoutBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  checkoutBtnTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  browseBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  browseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  notifBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  notifBannerError: {
    backgroundColor: '#ef4444',
  },
  notifBannerSuccess: {
    backgroundColor: '#16a34a',
  },
  notifBannerTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  mapContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 12,
  },
  mapBox: {
    height: 100,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roadLine: {
    position: 'absolute',
    left: 45,
    right: 45,
    height: 4,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 1,
  },
  mapNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
  },
  mapNodeIconBgStore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mapNodeIconBgHome: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mapNodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
  },
  mapRiderNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
    top: 20,
  },
  mapNodeIconBgRider: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapRiderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    marginTop: 2,
  },
  mapStatusFooter: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  trackingChatBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 20,
  },
  chatLogsContainer: {
    height: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  chatLogsSub: {
    flex: 1,
  },
  chatMsgRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chatMsgRowUser: {
    justifyContent: 'flex-end',
  },
  chatMsgRowStore: {
    justifyContent: 'flex-start',
  },
  chatMsgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '85%',
  },
  chatMsgBubbleUser: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 2,
  },
  chatMsgBubbleStore: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderBottomLeftRadius: 2,
  },
  chatMsgSenderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  chatMsgTxt: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  chatMsgTxtUser: {
    color: '#ffffff',
  },
  chatSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 4,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c7d2fe',
    textTransform: 'uppercase',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  sortScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  sortChipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  sortChipTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  favoriteHeartBtn: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 20,
  },
  schedulerTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  schedulerTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center',
  },
  schedulerTypeCardActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  schedulerTypeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  schedulerTypeLabelActive: {
    color: '#16a34a',
  },
  schedulerTypeSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  slotsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  slotChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  slotChipTextActive: {
    color: '#ffffff',
  },
  trackingSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trackingSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  historyActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  historyActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyActionBtnPrimaryTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 10,
  },
  historyActionBtnSecondaryTxt: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
  },
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  receiptSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 1,
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  receiptValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptItemName: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  receiptItemQtyPrice: {
    flex: 1,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  receiptItemTotal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
  },
  receiptSavingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  receiptSavingsTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
    flex: 1,
  },
  barcodeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 36,
  },
  barcodeText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    letterSpacing: 3,
    fontWeight: '600',
  },
  receiptCloseBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  receiptCloseBtnTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
