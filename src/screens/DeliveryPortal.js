import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function DeliveryPortal() {
  const { orders, acceptDelivery, updateOrderStatus, logoutUser } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('available'); // available | active | stats

  const riderProgress = useRef(new Animated.Value(0)).current;

  // Payout per delivery
  const PAYOUT_AMOUNT = 40;

  // Filter available orders (Ready for Pickup and NOT yet accepted by a rider)
  const availableJobs = orders.filter((o) => o.status === 'Ready for Pickup' && !o.deliveryAccepted);

  // Filter active jobs (either accepted but not picked up, or picked up but not delivered)
  const activeJobs = orders.filter((o) =>
    (o.status === 'Ready for Pickup' && o.deliveryAccepted) || o.status === 'Picked Up'
  );
  const currentActiveJob = activeJobs.length > 0 ? activeJobs[0] : null;

  // Filter completed jobs by delivery partner
  const completedJobs = orders.filter((o) => o.status === 'Delivered');

  // Earnings calculation
  const totalEarnings = completedJobs.length * PAYOUT_AMOUNT;

  // Time ticking state for countdown rendering
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Map Rider Progress Animation Effect for Active Delivery Run
  useEffect(() => {
    if (currentActiveJob && currentActiveJob.status === 'Picked Up') {
      Animated.timing(riderProgress, {
        toValue: 1,
        duration: 12000, // 12 seconds smooth ride simulation
        useNativeDriver: false,
      }).start();
    } else if (currentActiveJob && currentActiveJob.status === 'Delivered') {
      riderProgress.setValue(1);
    } else {
      riderProgress.setValue(0);
    }
  }, [currentActiveJob ? currentActiveJob.status : null]);

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render available delivery job card
  const renderAvailableItem = ({ item }) => {
    const countdownSecs = Math.max(0, Math.ceil((item.deliveryTimeoutAt - currentTime) / 1000));
    const isCritical = countdownSecs <= 10;

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.storeCol}>
            <Text style={styles.storeLabel}>Pick Up From</Text>
            <Text style={styles.storeName}>{item.retailerName}</Text>
          </View>
          <View style={styles.payoutBadge}>
            <Text style={styles.payoutAmount}>₹{PAYOUT_AMOUNT}</Text>
            <Text style={styles.payoutSub}>Payout</Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>{item.quantity}x {item.productName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>Deliver to: Priya's House (1.5 km)</Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View style={[styles.timerBadge, isCritical && styles.timerBadgeCritical]}>
            <Ionicons name="timer-outline" size={14} color={isCritical ? '#ffffff' : '#f59e0b'} style={{ marginRight: 4 }} />
            <Text style={[styles.timerText, isCritical && styles.timerTextCritical]}>
              Expires in {countdownSecs}s
            </Text>
          </View>

          <TouchableOpacity
            style={styles.acceptJobBtn}
            onPress={() => acceptDelivery(item.id)}
          >
            <Text style={styles.acceptJobBtnText}>Accept Job</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render visual navigation map for active run
  const renderActiveMap = () => {
    if (!currentActiveJob) return null;

    const leftPos = riderProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [10, width - 64 - 24 - 50], // bounds matching card boundaries
    });

    return (
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Live Navigation Route</Text>
        <View style={styles.mapBox}>
          <View style={styles.roadLine} />

          <View style={[styles.mapNode, { left: 10 }]}>
            <View style={styles.mapNodeIconBgStore}>
              <Ionicons name="storefront" size={12} color="#ffffff" />
            </View>
            <Text style={styles.mapNodeLabel}>Store</Text>
          </View>

          <View style={[styles.mapNode, { right: 10 }]}>
            <View style={styles.mapNodeIconBgHome}>
              <Ionicons name="home" size={12} color="#ffffff" />
            </View>
            <Text style={styles.mapNodeLabel}>Customer</Text>
          </View>

          <Animated.View style={[styles.mapRiderNode, { left: leftPos }]}>
            <View style={styles.mapNodeIconBgRider}>
              <Ionicons name="bicycle" size={12} color="#ffffff" />
            </View>
            <Text style={styles.mapRiderLabel}>You</Text>
          </Animated.View>
        </View>
        <Text style={styles.mapStatusFooter}>
          {currentActiveJob.status === 'Picked Up'
            ? "Navigating to Priya's House (1.5 km)..."
            : 'Proceed to store to collect order.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Delivery Stats Header */}
      <LinearGradient colors={['#0284c7', '#0369a1']} style={styles.topBanner}>
        <View style={styles.headerTopRow}>
          <Text style={styles.riderLabel}>Delivery Partner Network</Text>
          <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color="#e0f2fe" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{totalEarnings}</Text>
            <Text style={styles.statTitle}>Total Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{completedJobs.length}</Text>
            <Text style={styles.statTitle}>Completed Runs</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sub Tabs */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          onPress={() => setActiveSubTab('available')}
          style={[styles.subTabBtn, activeSubTab === 'available' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'available' && styles.subTabLabelActive]}>
            Available ({availableJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('active')}
          style={[styles.subTabBtn, activeSubTab === 'active' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'active' && styles.subTabLabelActive]}>
            Active Run {currentActiveJob ? '•' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('stats')}
          style={[styles.subTabBtn, activeSubTab === 'stats' && styles.subTabBtnActive]}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'stats' && styles.subTabLabelActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content area */}
      {activeSubTab === 'available' && (
        <FlatList
          data={availableJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No delivery jobs available right now</Text>
              <Text style={styles.emptySubText}>Pending retailer items marked 'Ready for Pickup' appear here.</Text>
            </View>
          }
          renderItem={renderAvailableItem}
        />
      )}

      {activeSubTab === 'active' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.activeContainer}>
          {currentActiveJob ? (
            <View style={styles.activeJobCard}>
              <View style={styles.activeHeader}>
                <Text style={styles.activeTitle}>Current Delivery Run</Text>
                <Text style={styles.activeOrderId}>#{currentActiveJob.id}</Text>
              </View>

              <View style={styles.activeStepper}>
                {/* Step 1: Pick Up */}
                <View style={styles.activeStepRow}>
                  <View style={styles.activeStepIndicator}>
                    <View style={[
                      styles.activeStepDot,
                      currentActiveJob.status === 'Picked Up' ? styles.dotChecked : styles.dotActive
                    ]}>
                      {currentActiveJob.status === 'Picked Up' ? (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      ) : (
                        <Text style={styles.dotText}>1</Text>
                      )}
                    </View>
                    <View style={[
                      styles.activeStepLine,
                      currentActiveJob.status === 'Picked Up' && styles.lineChecked
                    ]} />
                  </View>
                  <View style={styles.activeStepContent}>
                    <Text style={styles.activeStepTitle}>Pick up from Store</Text>
                    <Text style={styles.activeStoreText}>{currentActiveJob.retailerName}</Text>
                    <Text style={styles.activeItemText}>{currentActiveJob.quantity}x {currentActiveJob.productName}</Text>
                  </View>
                </View>

                {/* Step 2: Deliver */}
                <View style={styles.activeStepRow}>
                  <View style={styles.activeStepIndicator}>
                    <View style={[
                      styles.activeStepDot,
                      currentActiveJob.status === 'Picked Up' ? styles.dotActive : styles.dotPending
                    ]}>
                      <Text style={[
                        styles.dotText,
                        currentActiveJob.status === 'Picked Up' ? styles.dotTextActive : styles.dotTextPending
                      ]}>2</Text>
                    </View>
                  </View>
                  <View style={styles.activeStepContent}>
                    <Text style={styles.activeStepTitle}>Deliver to Customer</Text>
                    <Text style={styles.activeAddressText}>Priya's House (1.5 km)</Text>
                    <Text style={styles.activeInstructionsText}>Leave at door / ring bell</Text>
                  </View>
                </View>
              </View>

              {/* Visual 2D Navigation Map */}
              {renderActiveMap()}

              {/* Action buttons based on current state */}
              {currentActiveJob.status === 'Ready for Pickup' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.pickupBtn]}
                  onPress={() => updateOrderStatus(currentActiveJob.id, 'Picked Up')}
                >
                  <Ionicons name="cube" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>Confirm Package Picked Up</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deliverBtn]}
                  onPress={() => updateOrderStatus(currentActiveJob.id, 'Delivered')}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>Confirm Package Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No active delivery run</Text>
              <Text style={styles.emptySubText}>Accept an order in the 'Available' tab to start a run.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeSubTab === 'stats' && (
        <FlatList
          data={completedJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No completed trips yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyOrderId}>Order #{item.id}</Text>
                <Text style={styles.historyPrice}>+₹{PAYOUT_AMOUNT}</Text>
              </View>
              <Text style={styles.historyDetails}>
                Picked from {item.retailerName} • Delivered to Priya
              </Text>
              <Text style={styles.historyTime}>
                Completed at {formatTime(item.updatedAt)}
              </Text>
            </View>
          )}
        />
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  riderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e0f2fe',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  statTitle: {
    fontSize: 11,
    color: '#bae6fd',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  storeCol: {
    flex: 1,
  },
  storeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  payoutBadge: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
  payoutSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  jobDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerBadgeCritical: {
    backgroundColor: '#ef4444',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  timerTextCritical: {
    color: '#ffffff',
  },
  acceptJobBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptJobBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  activeContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  activeJobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0284c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 16,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  activeOrderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeStepper: {
    marginBottom: 20,
  },
  activeStepRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  activeStepIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  activeStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  dotActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  dotChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dotPending: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  dotText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotTextActive: {
    color: '#0284c7',
  },
  dotTextPending: {
    color: '#94a3b8',
  },
  activeStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 4,
  },
  lineChecked: {
    backgroundColor: '#10b981',
  },
  activeStepContent: {
    flex: 1,
    paddingTop: 2,
  },
  activeStepTitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activeStoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  activeItemText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginTop: 1,
  },
  activeAddressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  activeInstructionsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupBtn: {
    backgroundColor: '#0284c7',
  },
  deliverBtn: {
    backgroundColor: '#10b981',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyOrderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  historyDetails: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  mapContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  mapBox: {
    height: 70,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roadLine: {
    position: 'absolute',
    left: 45,
    right: 45,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 1,
  },
  mapNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 50,
  },
  mapNodeIconBgStore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mapNodeIconBgHome: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mapNodeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  mapRiderNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 50,
    top: 10,
  },
  mapNodeIconBgRider: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mapRiderLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fbbf24',
    marginTop: 1,
  },
  mapStatusFooter: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
});
