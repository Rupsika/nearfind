import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function RetailerPortal() {
  const {
    orders,
    activeRetailerId,
    selectRetailer,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    currentUser,
    logoutUser,
  } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('pending'); // pending | active | history

  const isRetailerRestricted = currentUser && currentUser.role === 'retailer' && currentUser.retailerId;

  // Auto-select retailer store based on user profile restrictions
  useEffect(() => {
    if (isRetailerRestricted && activeRetailerId !== currentUser.retailerId) {
      selectRetailer(currentUser.retailerId);
    }
  }, [isRetailerRestricted, currentUser, activeRetailerId]);

  // Retailer metadata mapping
  const retailers = {
    sharma: { name: 'Sharma Kirana Store', icon: 'storefront' },
    quick_mart: { name: 'Quick Mart', icon: 'flash' },
    super_save: { name: 'Super Save Supermarket', icon: 'cart' },
  };

  // Filter orders for the selected retailer
  const retailerOrders = orders.filter((o) => o.retailerId === activeRetailerId);

  // Split orders into queues
  const pendingQueue = retailerOrders.filter((o) => o.status === 'Placed');
  const activeQueue = retailerOrders.filter((o) => ['Accepted', 'Packed'].includes(o.status));
  const historyQueue = retailerOrders.filter((o) =>
    ['Ready for Pickup', 'Picked Up', 'Delivered', 'Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(o.status)
  );

  // Time ticking state for countdown rendering
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Helper to format timestamps
  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Render a pending order card
  const renderPendingItem = ({ item }) => {
    const countdownSecs = Math.max(0, Math.ceil((item.retailerTimeoutAt - currentTime) / 1000));
    const isCritical = countdownSecs <= 10;

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={[styles.timerPill, isCritical && styles.timerPillCritical]}>
            <Ionicons name="timer-outline" size={14} color={isCritical ? '#ffffff' : '#e11d48'} style={{ marginRight: 4 }} />
            <Text style={[styles.timerText, isCritical && styles.timerTextCritical]}>
              Auto-Cancels in {countdownSecs}s
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemQuantity}>{item.quantity}x <Text style={styles.itemName}>{item.productName}</Text></Text>
          <Text style={styles.totalPrice}>Amount: ₹{item.totalPrice}</Text>
          <Text style={styles.timestampText}>Placed at {formatTime(item.createdAt)}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => rejectOrder(item.id)}
          >
            <Ionicons name="close-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => acceptOrder(item.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render an active order card
  const renderActiveItem = ({ item }) => {
    const isAccepted = item.status === 'Accepted';

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemQuantity}>{item.quantity}x <Text style={styles.itemName}>{item.productName}</Text></Text>
          <Text style={styles.totalPrice}>Amount: ₹{item.totalPrice}</Text>
          <Text style={styles.timestampText}>Updated at {formatTime(item.updatedAt)}</Text>
        </View>

        <View style={styles.cardActions}>
          {isAccepted ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.processBtn]}
              onPress={() => updateOrderStatus(item.id, 'Packed')}
            >
              <Ionicons name="cube-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Mark Packed</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.readyBtn]}
              onPress={() => updateOrderStatus(item.id, 'Ready for Pickup')}
            >
              <Ionicons name="rocket-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Ready for Pickup</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render history queue card
  const renderHistoryItem = ({ item }) => {
    const isCancelled = item.status.includes('Cancelled');
    const isRejected = item.status === 'Rejected';
    const isDelivered = item.status === 'Delivered';

    return (
      <View style={[styles.orderCard, styles.historyCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={[
            styles.historyOutcomeText,
            isDelivered ? styles.colorGreen : isRejected ? styles.colorRed : styles.colorGray
          ]}>
            {item.status}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemQuantity}>{item.quantity}x <Text style={styles.itemName}>{item.productName}</Text></Text>
          <Text style={styles.totalPrice}>Amount: ₹{item.totalPrice}</Text>
          <Text style={styles.timestampText}>Completed at {formatTime(item.updatedAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Retailer Selector Banner */}
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.topBanner}>
        <View style={styles.headerTopRow}>
          <Text style={styles.merchantLabel}>Merchant Hub</Text>
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.selectorContainer}>
          {Object.entries(retailers)
            .filter(([id]) => !isRetailerRestricted || id === currentUser.retailerId)
            .map(([id, meta]) => {
              const isSelected = activeRetailerId === id;
              const hasPending = orders.some((o) => o.status === 'Placed' && o.retailerId === id);
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => selectRetailer(id)}
                  style={[
                    styles.selectorTab,
                    isSelected && styles.selectorTabActive,
                  ]}
                  disabled={!!isRetailerRestricted}
                >
                  <View>
                    <Ionicons
                      name={meta.icon}
                      size={18}
                      color={isSelected ? '#0f172a' : '#94a3b8'}
                      style={{ marginBottom: 4 }}
                    />
                    {hasPending && (
                      <View style={styles.dotBadge} />
                    )}
                  </View>
                  <Text style={[styles.selectorText, isSelected && styles.selectorTextActive]} numberOfLines={1}>
                    {id === 'sharma' ? 'Sharma Kirana' : id === 'quick_mart' ? 'Quick Mart' : 'Super Save'}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </LinearGradient>

      {/* Queue tabs */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          onPress={() => setActiveSubTab('pending')}
          style={[styles.subTabBtn, activeSubTab === 'pending' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'pending' && styles.subTabLabelActive]}>
            Pending ({pendingQueue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('active')}
          style={[styles.subTabBtn, activeSubTab === 'active' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'active' && styles.subTabLabelActive]}>
            Active ({activeQueue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('history')}
          style={[styles.subTabBtn, activeSubTab === 'history' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'history' && styles.subTabLabelActive]}>
            History ({historyQueue.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Queue Views */}
      <FlatList
        data={activeSubTab === 'pending' ? pendingQueue : activeSubTab === 'active' ? activeQueue : historyQueue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No orders in this queue</Text>
          </View>
        }
        renderItem={
          activeSubTab === 'pending'
            ? renderPendingItem
            : activeSubTab === 'active'
            ? renderActiveItem
            : renderHistoryItem
        }
      />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  merchantLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 4,
  },
  selectorTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectorTabActive: {
    backgroundColor: '#ffffff',
  },
  selectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  selectorTextActive: {
    color: '#0f172a',
    fontWeight: '700',
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
    backgroundColor: '#f1f5f9',
  },
  subTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  subTabLabelActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  orderCard: {
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
  historyCard: {
    borderColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerPillCritical: {
    backgroundColor: '#e11d48',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  timerTextCritical: {
    color: '#ffffff',
  },
  statusBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  cardBody: {
    marginBottom: 12,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  itemName: {
    color: '#0f172a',
    fontWeight: '700',
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#10b981',
    flex: 1.5,
  },
  processBtn: {
    backgroundColor: '#4f46e5',
    width: '100%',
  },
  readyBtn: {
    backgroundColor: '#0284c7',
    width: '100%',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyOutcomeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 10,
    fontWeight: '500',
  },
  colorGreen: {
    color: '#10b981',
  },
  colorRed: {
    color: '#ef4444',
  },
  colorGray: {
    color: '#64748b',
  },
  dotBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#ef4444',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoutBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
});
