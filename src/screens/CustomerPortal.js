import React, { useState, useContext, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function CustomerPortal() {
  const { products, orders, placeOrder, selectRole, trackingOrderId, setTrackingOrderId } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [dismissedOrderId, setDismissedOrderId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('shop');
  const [expandedHistoryOrderId, setExpandedHistoryOrderId] = useState(null);

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the latest order overall
  const latestOrder = orders.length > 0 ? orders[0] : null;
  const isLatestOrderActive = latestOrder && !['Delivered', 'Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(latestOrder.status);

  // Show floating pill if the order is active, OR if it's not active but the customer hasn't dismissed it yet
  const showFloatingPill = latestOrder && (isLatestOrderActive || dismissedOrderId !== latestOrder.id);

  const currentTrackingOrder = orders.find((o) => o.id === trackingOrderId);

  // Countdown timer local state updating every 100ms for smooth UI ticking
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 200);
    return () => clearInterval(timer);
  }, []);

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

  // Render product detail comparison view
  if (selectedProduct) {
    const product = products.find((p) => p.id === selectedProduct.id);
    const retailersList = Object.entries(product.retailers).map(([id, data]) => ({
      id,
      ...data,
    }));

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

            {timerMessage && (
              <View style={styles.countdownRow}>
                <Ionicons name="timer-outline" size={16} color={countdownSecs < 10 ? '#ef4444' : '#4f46e5'} />
                <Text style={[styles.countdownText, countdownSecs < 10 && styles.countdownAlert]}>
                  {timerMessage}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Role switcher alert helper */}
          {!isCompleted && !isFailed && (
            <View style={styles.instructionBanner}>
              <Ionicons name="bulb-outline" size={18} color="#0284c7" style={{ marginRight: 6 }} />
              <Text style={styles.instructionText}>
                {o.status === 'Placed' && `Tap the 'Retailer' tab at the bottom to accept/reject this order as Sharma Kirana.`}
                {['Accepted', 'Packed'].includes(o.status) && `Go to the 'Retailer' tab to mark the order Packed and Ready.`}
                {o.status === 'Ready for Pickup' && `Tap the 'Delivery' tab at the bottom to accept and pick up the order as a delivery partner.`}
                {o.status === 'Picked Up' && `Go to the 'Delivery' tab to mark the order as Delivered.`}
              </Text>
            </View>
          )}

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
                {o.status === 'Rejected' && `The retailer Sharma Kirana rejected your order. The stock has been restored, and no payment was charged.`}
                {o.status === 'Cancelled (Retailer Timeout)' && `The retailer failed to accept the order within the 30-second window. The order was automatically cancelled.`}
                {o.status === 'Cancelled (No Delivery Partner)' && `No delivery partner accepted the request within 45 seconds. The order was automatically cancelled.`}
              </Text>
              <Text style={styles.failedTimestamp}>
                Time: {new Date(o.updatedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}

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
              From {item.retailerName} • ₹{item.totalPrice}
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
                  {item.status === 'Rejected' && `The retailer Sharma Kirana rejected your order. The stock has been restored, and no payment was charged.`}
                  {item.status === 'Cancelled (Retailer Timeout)' && `Sharma Kirana failed to accept the order within 30 seconds.`}
                  {item.status === 'Cancelled (No Delivery Partner)' && `No delivery rider accepted within 45 seconds.`}
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
      <LinearGradient colors={['#4f46e5', '#3730a3']} style={styles.topBanner}>
        <Text style={styles.appTitle}>NearFind</Text>
        <Text style={styles.appSubtitle}>Hyperlocal discovery & lightning-fast deliveries</Text>

        {activeSubTab === 'shop' && (
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
          data={filteredProducts}
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

            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => setSelectedProduct(item)}
              >
                <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={40} color="#94a3b8" />
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
                        {storesWithStock > 0 ? `${storesWithStock}/${totalStores} stores in stock` : 'Out of stock'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" style={styles.arrowIcon} />
              </TouchableOpacity>
            );
          }}
        />
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
    shadowColor: '#4f46e5',
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
    color: '#c7d2fe',
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
    color: '#6366f1',
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
    color: '#4f46e5',
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
    color: '#4f46e5',
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
    backgroundColor: '#4f46e5',
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
    borderColor: 'rgba(79, 70, 229, 0.1)',
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
    color: '#4f46e5',
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
    borderColor: '#4f46e5',
    backgroundColor: '#e0e7ff',
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
    color: '#4f46e5',
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
    color: '#818cf8',
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
    backgroundColor: '#312e81',
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
    color: '#4f46e5',
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
    backgroundColor: '#eef2ff',
  },
  subTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  subTabLabelActive: {
    color: '#4f46e5',
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
    backgroundColor: '#4f46e5',
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
    borderColor: '#4f46e5',
    backgroundColor: '#e0e7ff',
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
    color: '#4f46e5',
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
    color: '#818cf8',
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
    backgroundColor: '#eff6ff',
  },
  textBlue: {
    color: '#3b82f6',
  },
});
