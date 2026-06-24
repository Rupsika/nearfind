import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Animated, Dimensions, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

// ── Animated Bar ────────────────────────────────────────────────────────────────
function AnimatedBar({ pct, colors, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width }]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={barStyles.gradient} />
      </Animated.View>
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, overflow: 'hidden' },
  gradient: { flex: 1 },
});

// ── Pulse Dot ───────────────────────────────────────────────────────────────────
function PulseDot({ color = '#22c55e' }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: anim, transform: [{ scale: anim }] }} />
    </View>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon, colors, sub }) {
  return (
    <LinearGradient colors={colors} style={styles.kpiCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.kpiIconCircle}>
        <Ionicons name={icon} size={18} color="#ffffff" />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub !== undefined && <Text style={styles.kpiSub}>{sub}</Text>}
    </LinearGradient>
  );
}

export default function AdminDashboard() {
  const { orders, products, resetSystem, logoutUser } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Delivered');
  const activeOrders = orders.filter((o) =>
    ['Placed', 'Accepted', 'Packed', 'Ready for Pickup', 'Picked Up'].includes(o.status)
  );
  const cancelledOrders = orders.filter((o) =>
    ['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(o.status)
  );
  const totalRevenue = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
  const total = totalOrdersCount || 1;
  const deliveredPct = Math.round((completedOrders.length / total) * 100);
  const activePct = Math.round((activeOrders.length / total) * 100);
  const cancelledPct = Math.round((cancelledOrders.length / total) * 100);

  const salesByStore = { sharma: 0, quick_mart: 0, super_save: 0 };
  completedOrders.forEach((o) => { if (salesByStore[o.retailerId] !== undefined) salesByStore[o.retailerId] += o.totalPrice; });
  const totalSalesVal = totalRevenue || 1;
  const sharmaPct = Math.round((salesByStore.sharma / totalSalesVal) * 100);
  const quickMartPct = Math.round((salesByStore.quick_mart / totalSalesVal) * 100);
  const superSavePct = Math.round((salesByStore.super_save / totalSalesVal) * 100);

  const formatTs = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const statusColor = (s) => {
    if (s === 'Delivered') return '#22c55e';
    if (['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(s)) return '#ef4444';
    if (['Placed', 'Accepted', 'Packed'].includes(s)) return '#3b82f6';
    return '#f59e0b';
  };

  const stockInfo = (stock) => {
    if (stock === 0) return { label: 'Out', color: '#ef4444', pct: 0 };
    if (stock <= 2) return { label: `${stock}`, color: '#f59e0b', pct: Math.min(stock * 20, 100) };
    return { label: `${stock}`, color: '#22c55e', pct: Math.min(stock * 15, 100) };
  };

  const TABS = [
    { key: 'overview', icon: 'grid-outline', label: 'Overview' },
    { key: 'analytics', icon: 'bar-chart-outline', label: 'Analytics' },
    { key: 'orders', icon: 'list-outline', label: 'Orders' },
    { key: 'inventory', icon: 'cube-outline', label: 'Stock' },
  ];

  return (
    <View style={styles.container}>
      {/* ── Premium Dark Header ── */}
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSub}>NearFind</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={styles.headerTopRight}>
            <TouchableOpacity onPress={logoutUser} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
            <View style={styles.liveChip}>
              <PulseDot color="#22c55e" />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatVal}>₹{totalRevenue}</Text>
            <Text style={styles.quickStatLabel}>Revenue</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatVal}>{totalOrdersCount}</Text>
            <Text style={styles.quickStatLabel}>Orders</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={[styles.quickStatVal, activeOrders.length > 0 && { color: '#fbbf24' }]}>
              {activeOrders.length}
            </Text>
            <Text style={styles.quickStatLabel}>Active</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatVal}>{completedOrders.length}</Text>
            <Text style={styles.quickStatLabel}>Done</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Sub-Tab Bar ── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons name={t.icon} size={16} color={activeTab === t.key ? '#6366f1' : '#94a3b8'} />
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ═══════════════════════════════════ OVERVIEW ═══════════════════════════════════ */}
        {activeTab === 'overview' && (
          <View>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <KPICard label="Total Orders" value={totalOrdersCount} icon="receipt-outline" colors={['#6366f1', '#4f46e5']} />
              <KPICard label="Revenue" value={`₹${totalRevenue}`} icon="wallet-outline" colors={['#059669', '#10b981']} sub={completedOrders.length > 0 ? `${completedOrders.length} deliveries` : 'No deliveries yet'} />
              <KPICard label="Active Runs" value={activeOrders.length} icon="bicycle-outline" colors={['#0284c7', '#0ea5e9']} sub={activeOrders.length > 0 ? 'In progress' : 'All clear'} />
              <KPICard label="Cancelled" value={cancelledOrders.length} icon="close-circle-outline" colors={['#dc2626', '#ef4444']} />
            </View>

            {/* System Health Card */}
            <View style={styles.healthCard}>
              <Text style={styles.sectionTitle}>System Health</Text>
              <View style={styles.healthRow}>
                <View style={styles.healthDotGreen} />
                <Text style={styles.healthLabel}>Order Pipeline</Text>
                <Text style={styles.healthStatus}>Operational</Text>
              </View>
              <View style={styles.healthRow}>
                <View style={[styles.healthDotGreen, { backgroundColor: activeOrders.length > 0 ? '#f59e0b' : '#22c55e' }]} />
                <Text style={styles.healthLabel}>Active Deliveries</Text>
                <Text style={[styles.healthStatus, activeOrders.length > 0 && { color: '#f59e0b' }]}>
                  {activeOrders.length > 0 ? `${activeOrders.length} in flight` : 'Idle'}
                </Text>
              </View>
              <View style={styles.healthRow}>
                <View style={styles.healthDotGreen} />
                <Text style={styles.healthLabel}>Inventory System</Text>
                <Text style={styles.healthStatus}>Live</Text>
              </View>
              <View style={[styles.healthRow, { borderBottomWidth: 0 }]}>
                <View style={styles.healthDotGreen} />
                <Text style={styles.healthLabel}>Merchant Network</Text>
                <Text style={styles.healthStatus}>3 stores online</Text>
              </View>
            </View>

            {/* Active Orders Quick View */}
            {activeOrders.length > 0 && (
              <View style={styles.activeOrdersCard}>
                <View style={styles.activeOrdersHeader}>
                  <PulseDot color="#f59e0b" />
                  <Text style={styles.activeOrdersTitle}>Active Orders</Text>
                </View>
                {activeOrders.map((o) => (
                  <View key={o.id} style={styles.activeOrderRow}>
                    <View style={[styles.activeOrderDot, { backgroundColor: statusColor(o.status) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activeOrderText}>{o.quantity}x {o.productName}</Text>
                      <Text style={styles.activeOrderMeta}>{o.retailerName} · {o.status}</Text>
                    </View>
                    <Text style={styles.activeOrderPrice}>₹{o.totalPrice}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Gemini API Configuration */}
            <GeminiConfigCard />

            {/* Reset */}
            <ResetCard onReset={resetSystem} />
          </View>
        )}

        {/* ═══════════════════════════════════ ANALYTICS ═══════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <View>
            {totalOrdersCount === 0 ? (
              <EmptyState icon="bar-chart-outline" title="No data yet" sub="Place orders to see analytics" />
            ) : (
              <>
                {/* Order Status Distribution */}
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsCardTitle}>Order Status Distribution</Text>

                  <View style={styles.chartRow}>
                    <View style={styles.chartMeta}>
                      <View style={[styles.chartDot, { backgroundColor: '#22c55e' }]} />
                      <Text style={styles.chartLabel}>Delivered</Text>
                      <Text style={styles.chartPct}>{deliveredPct}%</Text>
                    </View>
                    <AnimatedBar pct={deliveredPct} colors={['#34d399', '#22c55e']} delay={0} />
                  </View>

                  <View style={styles.chartRow}>
                    <View style={styles.chartMeta}>
                      <View style={[styles.chartDot, { backgroundColor: '#3b82f6' }]} />
                      <Text style={styles.chartLabel}>Active</Text>
                      <Text style={styles.chartPct}>{activePct}%</Text>
                    </View>
                    <AnimatedBar pct={activePct} colors={['#60a5fa', '#3b82f6']} delay={150} />
                  </View>

                  <View style={styles.chartRow}>
                    <View style={styles.chartMeta}>
                      <View style={[styles.chartDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={styles.chartLabel}>Cancelled</Text>
                      <Text style={styles.chartPct}>{cancelledPct}%</Text>
                    </View>
                    <AnimatedBar pct={cancelledPct} colors={['#f87171', '#ef4444']} delay={300} />
                  </View>

                  {/* Count summary */}
                  <View style={styles.countRow}>
                    <View style={styles.countChip}><Text style={[styles.countVal, { color: '#22c55e' }]}>{completedOrders.length}</Text><Text style={styles.countLabel}>Done</Text></View>
                    <View style={styles.countChip}><Text style={[styles.countVal, { color: '#3b82f6' }]}>{activeOrders.length}</Text><Text style={styles.countLabel}>Active</Text></View>
                    <View style={styles.countChip}><Text style={[styles.countVal, { color: '#ef4444' }]}>{cancelledOrders.length}</Text><Text style={styles.countLabel}>Failed</Text></View>
                    <View style={styles.countChip}><Text style={[styles.countVal, { color: '#f59e0b' }]}>{totalOrdersCount}</Text><Text style={styles.countLabel}>Total</Text></View>
                  </View>
                </View>

                {/* Store Revenue */}
                {totalRevenue > 0 && (
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsCardTitle}>Store Revenue Split · ₹{totalRevenue}</Text>

                    {/* Segmented bar */}
                    <View style={styles.segBar}>
                      {salesByStore.sharma > 0 && <View style={[styles.seg, { flex: sharmaPct, backgroundColor: '#6366f1' }]} />}
                      {salesByStore.quick_mart > 0 && <View style={[styles.seg, { flex: quickMartPct, backgroundColor: '#22c55e' }]} />}
                      {salesByStore.super_save > 0 && <View style={[styles.seg, { flex: superSavePct, backgroundColor: '#f59e0b' }]} />}
                    </View>

                    {/* Per-store animated bars */}
                    <View style={styles.chartRow}>
                      <View style={styles.chartMeta}>
                        <View style={[styles.chartDot, { backgroundColor: '#6366f1' }]} />
                        <Text style={styles.chartLabel}>Sharma Kirana</Text>
                        <Text style={styles.chartPct}>₹{salesByStore.sharma}</Text>
                      </View>
                      <AnimatedBar pct={sharmaPct} colors={['#a5b4fc', '#6366f1']} delay={0} />
                    </View>
                    <View style={styles.chartRow}>
                      <View style={styles.chartMeta}>
                        <View style={[styles.chartDot, { backgroundColor: '#22c55e' }]} />
                        <Text style={styles.chartLabel}>Quick Mart</Text>
                        <Text style={styles.chartPct}>₹{salesByStore.quick_mart}</Text>
                      </View>
                      <AnimatedBar pct={quickMartPct} colors={['#6ee7b7', '#22c55e']} delay={150} />
                    </View>
                    <View style={styles.chartRow}>
                      <View style={styles.chartMeta}>
                        <View style={[styles.chartDot, { backgroundColor: '#f59e0b' }]} />
                        <Text style={styles.chartLabel}>Super Save</Text>
                        <Text style={styles.chartPct}>₹{salesByStore.super_save}</Text>
                      </View>
                      <AnimatedBar pct={superSavePct} colors={['#fcd34d', '#f59e0b']} delay={300} />
                    </View>
                  </View>
                )}

                {/* Avg order value */}
                {completedOrders.length > 0 && (
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsCardTitle}>Performance Metrics</Text>
                    <View style={styles.metricsRow}>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricVal}>₹{Math.round(totalRevenue / completedOrders.length)}</Text>
                        <Text style={styles.metricLabel}>Avg Order Value</Text>
                      </View>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricVal}>{deliveredPct}%</Text>
                        <Text style={styles.metricLabel}>Fulfillment Rate</Text>
                      </View>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricVal}>{cancelledPct}%</Text>
                        <Text style={styles.metricLabel}>Cancellation Rate</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
            <ResetCard onReset={resetSystem} />
          </View>
        )}

        {/* ═══════════════════════════════════ ORDERS ═══════════════════════════════════ */}
        {activeTab === 'orders' && (
          <View>
            {orders.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No orders yet" sub="Place an order under Customer tab" />
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const sColor = statusColor(order.status);
                const isFailed = ['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(order.status);
                const isDone = order.status === 'Delivered';

                return (
                  <View key={order.id} style={[styles.orderCard, { borderLeftColor: sColor }]}>
                    <TouchableOpacity onPress={() => setExpandedOrderId(isExpanded ? null : order.id)} activeOpacity={0.7}>
                      <View style={styles.orderCardTop}>
                        <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                        <View style={{ flex: 1 }}>
                          <View style={styles.orderIdRow}>
                            <Text style={styles.orderId}>Order #{order.id}</Text>
                            <Text style={styles.orderTime}>{formatTs(order.createdAt)}</Text>
                          </View>
                          <Text style={styles.orderItem}>{order.quantity}× {order.productName} · ₹{order.totalPrice}</Text>
                          <Text style={styles.orderRetailer}>{order.retailerName}</Text>
                        </View>
                        <View style={styles.orderRight}>
                          <View style={[styles.statusBadge, { backgroundColor: isDone ? '#f0fdf4' : isFailed ? '#fef2f2' : '#eff6ff' }]}>
                            <Text style={[styles.statusBadgeText, { color: sColor }]}>{order.status}</Text>
                          </View>
                          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" style={{ marginTop: 6 }} />
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.orderExpanded}>
                        <Text style={styles.timelineHeading}>State Transition Log</Text>
                        {order.statusHistory.map((h, idx) => (
                          <View key={idx} style={styles.tlRow}>
                            <View style={styles.tlMarker}>
                              <View style={[styles.tlNode, { backgroundColor: statusColor(h.status) }]} />
                              {idx < order.statusHistory.length - 1 && <View style={styles.tlLine} />}
                            </View>
                            <View style={styles.tlContent}>
                              <Text style={styles.tlStatus}>{h.status}</Text>
                              <Text style={styles.tlTime}>{formatTs(h.timestamp)}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
            <ResetCard onReset={resetSystem} />
          </View>
        )}

        {/* ═══════════════════════════════════ INVENTORY ═══════════════════════════════════ */}
        {activeTab === 'inventory' && (
          <View>
            {products.map((prod) => (
              <View key={prod.id} style={styles.inventoryCard}>
                <Text style={styles.inventoryProductName}>{prod.name}</Text>
                <Text style={styles.inventoryCategory}>{prod.category}</Text>
                {Object.entries(prod.retailers).map(([rid, meta]) => {
                  const si = stockInfo(meta.stock);
                  const storeName = rid === 'sharma' ? 'Sharma Kirana' : rid === 'quick_mart' ? 'Quick Mart' : 'Super Save';
                  const storeColor = rid === 'sharma' ? '#6366f1' : rid === 'quick_mart' ? '#22c55e' : '#f59e0b';
                  return (
                    <View key={rid} style={styles.stockRow}>
                      <View style={[styles.storeTag, { backgroundColor: storeColor + '18', borderColor: storeColor + '40' }]}>
                        <Text style={[styles.storeTagText, { color: storeColor }]}>{storeName}</Text>
                      </View>
                      <View style={styles.stockBarArea}>
                        <View style={styles.stockBarTrack}>
                          <View style={[styles.stockBarFill, { width: `${si.pct}%`, backgroundColor: si.color }]} />
                        </View>
                        <Text style={[styles.stockCount, { color: si.color }]}>{si.label}</Text>
                      </View>
                      <Text style={styles.stockPrice}>₹{meta.price}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
            <ResetCard onReset={resetSystem} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={52} color="#334155" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

function ResetCard({ onReset }) {
  return (
    <View style={styles.resetCard}>
      <View style={styles.resetLeft}>
        <Ionicons name="warning-outline" size={20} color="#f59e0b" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.resetTitle}>Demo Controls</Text>
          <Text style={styles.resetSub}>Reset all orders & restore stock</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Ionicons name="refresh" size={14} color="#ffffff" style={{ marginRight: 4 }} />
        <Text style={styles.resetBtnText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

function GeminiConfigCard() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load existing key
    AsyncStorage.getItem('@nearfind_gemini_api_key').then((val) => {
      if (val) {
        setApiKey(val);
        setIsSaved(true);
      }
    });
  }, []);

  const handleSave = async () => {
    if (apiKey.trim()) {
      await AsyncStorage.setItem('@nearfind_gemini_api_key', apiKey.trim());
      setIsSaved(true);
      alert('Gemini API Key saved successfully! The Home Portal AI chatbot will now use live Gemini Flash.');
    } else {
      await AsyncStorage.removeItem('@nearfind_gemini_api_key');
      setIsSaved(false);
      alert('Gemini API Key removed. The chatbot will fall back to local rule-based responses.');
    }
  };

  return (
    <View style={styles.apiCard}>
      <View style={styles.apiHeaderRow}>
        <Ionicons name="logo-google" size={16} color="#6366f1" />
        <Text style={styles.apiCardTitle}>Configure Gemini AI Key</Text>
      </View>
      <Text style={styles.apiCardSub}>
        Paste your Gemini API Key here to enable live LLM assistant capabilities on this device. Leave blank to fall back to the offline rule-based generator.
      </Text>
      <View style={styles.apiInputRow}>
        <TextInput
          secureTextEntry
          placeholder="Enter Gemini API Key..."
          placeholderTextColor="#64748b"
          value={apiKey}
          onChangeText={(text) => {
            setApiKey(text);
            setIsSaved(false);
          }}
          style={styles.apiTextInput}
        />
        <TouchableOpacity
          style={[styles.apiSaveBtn, isSaved && styles.apiSaveBtnActive]}
          onPress={handleSave}
        >
          <Text style={styles.apiSaveBtnTxt}>{isSaved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },

  // Header
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: { padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 8 },
  headerSub: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  liveChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff10', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4, borderWidth: 1, borderColor: '#ffffff15' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#22c55e', letterSpacing: 1 },
  quickStatsRow: { flexDirection: 'row', backgroundColor: '#ffffff08', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#ffffff10' },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatVal: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  quickStatLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },
  quickStatDivider: { width: 1, backgroundColor: '#ffffff15', marginHorizontal: 4 },

  // Sub-tabs
  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  tabLabelActive: { color: '#6366f1', fontWeight: '700' },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 90, backgroundColor: '#0a0f1e' },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  kpiCard: { width: CARD_W, borderRadius: 16, padding: 14, minHeight: 100 },
  kpiIconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  kpiLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  kpiSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // Health
  healthCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  healthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  healthDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 10 },
  healthLabel: { flex: 1, fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  healthStatus: { fontSize: 12, color: '#22c55e', fontWeight: '700' },

  // Active Orders
  activeOrdersCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f59e0b40' },
  activeOrdersHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  activeOrdersTitle: { fontSize: 14, fontWeight: '800', color: '#f59e0b' },
  activeOrderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 10 },
  activeOrderDot: { width: 8, height: 8, borderRadius: 4 },
  activeOrderText: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  activeOrderMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  activeOrderPrice: { fontSize: 13, fontWeight: '800', color: '#22c55e' },

  // Analytics
  analyticsCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  analyticsCardTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  chartRow: { marginBottom: 16 },
  chartMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chartDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  chartLabel: { flex: 1, fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  chartPct: { fontSize: 12, fontWeight: '800', color: '#e2e8f0' },
  countRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  countChip: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, padding: 10, alignItems: 'center' },
  countVal: { fontSize: 18, fontWeight: '800' },
  countLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },
  segBar: { height: 14, backgroundColor: '#1e293b', borderRadius: 7, flexDirection: 'row', overflow: 'hidden', marginBottom: 16 },
  seg: { height: '100%' },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#e2e8f0' },
  metricLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 3, textAlign: 'center' },

  // Orders
  orderCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', borderLeftWidth: 4, marginBottom: 10, overflow: 'hidden' },
  orderCardTop: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  orderId: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  orderTime: { fontSize: 10, color: '#475569' },
  orderItem: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  orderRetailer: { fontSize: 11, color: '#475569', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  orderExpanded: { backgroundColor: '#060c1a', borderTopWidth: 1, borderTopColor: '#1e293b', padding: 14 },
  timelineHeading: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  tlRow: { flexDirection: 'row', minHeight: 36 },
  tlMarker: { alignItems: 'center', marginRight: 12 },
  tlNode: { width: 10, height: 10, borderRadius: 5 },
  tlLine: { width: 1.5, flex: 1, backgroundColor: '#1e293b', marginVertical: 2 },
  tlContent: { flex: 1, paddingBottom: 8 },
  tlStatus: { fontSize: 12, fontWeight: '700', color: '#cbd5e1' },
  tlTime: { fontSize: 10, color: '#475569', marginTop: 1 },

  // Inventory
  inventoryCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  inventoryProductName: { fontSize: 15, fontWeight: '800', color: '#e2e8f0', marginBottom: 2 },
  inventoryCategory: { fontSize: 10, color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  storeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, minWidth: 88 },
  storeTagText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  stockBarArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBarTrack: { flex: 1, height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: 3 },
  stockCount: { fontSize: 11, fontWeight: '800', minWidth: 20, textAlign: 'right' },
  stockPrice: { fontSize: 11, fontWeight: '700', color: '#64748b', minWidth: 32, textAlign: 'right' },

  // Empty
  emptyCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#475569', marginTop: 14 },
  emptySub: { fontSize: 12, color: '#334155', marginTop: 4, textAlign: 'center' },

  // Reset
  resetCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#f59e0b30', padding: 14, marginTop: 8 },
  resetLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  resetTitle: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  resetSub: { fontSize: 11, color: '#475569', marginTop: 1 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  resetBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // Section title (shared)
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#e2e8f0', marginBottom: 12 },
  apiCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
  },
  apiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  apiCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  apiCardSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 14,
  },
  apiInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  apiTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
  },
  apiSaveBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  apiSaveBtnActive: {
    backgroundColor: '#059669',
  },
  apiSaveBtnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
