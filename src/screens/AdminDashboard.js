import React, { useContext, useState } from 'react';
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

export default function AdminDashboard() {
  const { orders, products, resetSystem } = useContext(AppContext);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Statistics calculation
  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Delivered');
  const activeOrdersCount = orders.filter((o) =>
    ['Placed', 'Accepted', 'Packed', 'Ready for Pickup', 'Picked Up'].includes(o.status)
  ).length;
  const cancelledOrdersCount = orders.filter((o) =>
    ['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(o.status)
  ).length;

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const toggleExpandOrder = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // Helper styles for order states in logs
  const getStatusColor = (status) => {
    if (status === 'Delivered') return '#10b981';
    if (['Rejected', 'Cancelled (Retailer Timeout)', 'Cancelled (No Delivery Partner)'].includes(status)) return '#ef4444';
    if (['Placed', 'Accepted', 'Packed', 'Ready for Pickup'].includes(status)) return '#3b82f6';
    return '#f59e0b';
  };

  // Stock status rendering helper
  const getStockStyle = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: '#ef4444', bg: '#fef2f2' };
    if (stock <= 2) return { text: `Low (${stock})`, color: '#d97706', bg: '#fffbeb' };
    return { text: `${stock} units`, color: '#10b981', bg: '#f0fdf4' };
  };

  return (
    <View style={styles.container}>
      {/* Header banner */}
      <LinearGradient colors={['#475569', '#334155']} style={styles.topBanner}>
        <Text style={styles.dashboardLabel}>Admin Controller</Text>
        <Text style={styles.dashboardTitle}>NearFind System Stats</Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalOrdersCount}</Text>
            <Text style={styles.kpiLabel}>Total Orders</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>₹{totalRevenue}</Text>
            <Text style={styles.kpiLabel}>Net Revenue</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>{activeOrdersCount}</Text>
            <Text style={styles.kpiLabel}>Active Runs</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{cancelledOrdersCount}</Text>
            <Text style={styles.kpiLabel}>Cancelled/Rej</Text>
          </View>
        </View>

        {/* Real-time Inventory Tracker */}
        <View style={styles.sectionHeaderContainer}>
          <Ionicons name="cube-outline" size={18} color="#475569" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Real-time Merchant Stock Tracker</Text>
        </View>

        <View style={styles.inventoryCard}>
          {products.map((prod) => (
            <View key={prod.id} style={styles.inventoryRow}>
              <Text style={styles.inventoryProductName} numberOfLines={1}>{prod.name}</Text>
              <View style={styles.inventoryStoresContainer}>
                {Object.entries(prod.retailers).map(([id, meta]) => {
                  const stockInfo = getStockStyle(meta.stock);
                  return (
                    <View key={id} style={styles.storeStockPill}>
                      <Text style={styles.storeLabelAbbrev}>
                        {id === 'sharma' ? 'Sharma' : id === 'quick_mart' ? 'QuickM' : 'SuperS'}
                      </Text>
                      <View style={[styles.stockBadge, { backgroundColor: stockInfo.bg }]}>
                        <Text style={[styles.stockBadgeText, { color: stockInfo.color }]}>
                          {stockInfo.text}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* System Order Feed logs */}
        <View style={styles.sectionHeaderContainer}>
          <Ionicons name="list-outline" size={18} color="#475569" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Global Orders Feed</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No orders registered in system yet.</Text>
            <Text style={styles.emptySub}>Place an order under 'Customer' tab to see logs.</Text>
          </View>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusColor = getStatusColor(order.status);

            return (
              <View key={order.id} style={styles.orderLogCard}>
                <TouchableOpacity
                  style={styles.orderLogHeader}
                  onPress={() => toggleExpandOrder(order.id)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.orderLogIdRow}>
                      <Text style={styles.orderLogId}>Order {order.id}</Text>
                      <Text style={styles.orderLogTime}>{formatTimestamp(order.createdAt)}</Text>
                    </View>
                    <Text style={styles.orderLogItemText}>
                      {order.quantity}x {order.productName} • ₹{order.totalPrice}
                    </Text>
                  </View>
                  <View style={styles.orderLogStatusCol}>
                    <View style={[styles.statusIndicatorCircle, { backgroundColor: statusColor }]} />
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#94a3b8"
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.orderDetailLogs}>
                    <View style={styles.orderDetailMeta}>
                      <Text style={styles.metaLabelText}>Retailer: <Text style={styles.metaValText}>{order.retailerName}</Text></Text>
                      <Text style={styles.metaLabelText}>Current Status: <Text style={[styles.metaValText, { color: statusColor, fontWeight: '700' }]}>{order.status}</Text></Text>
                    </View>

                    <Text style={styles.timelineLabel}>State Transition Timeline:</Text>
                    <View style={styles.timelineContainer}>
                      {order.statusHistory.map((history, idx) => (
                        <View key={idx} style={styles.timelineRow}>
                          <View style={styles.timelineMarkerCol}>
                            <View style={[styles.timelineNode, { backgroundColor: getStatusColor(history.status) }]} />
                            {idx < order.statusHistory.length - 1 && (
                              <View style={styles.timelineLine} />
                            )}
                          </View>
                          <View style={styles.timelineContentCol}>
                            <Text style={styles.timelineStatusText}>{history.status}</Text>
                            <Text style={styles.timelineTimeText}>{formatTimestamp(history.timestamp)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* System Reset Container */}
        <View style={styles.resetContainer}>
          <Text style={styles.resetWarningTitle}>Demo Administration Controls</Text>
          <Text style={styles.resetWarningText}>
            Clears all logged orders, notifications and restores initial stock levels to mock stores.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetSystem}>
            <Ionicons name="refresh-circle-outline" size={20} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.resetBtnText}>Reset System Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  dashboardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  inventoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  inventoryRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  inventoryProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  inventoryStoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  storeStockPill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storeLabelAbbrev: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  orderLogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  orderLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  orderLogIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  orderLogId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderLogTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  orderLogItemText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  orderLogStatusCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicatorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  orderDetailLogs: {
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 12,
  },
  orderDetailMeta: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 10,
    gap: 2,
  },
  metaLabelText: {
    fontSize: 12,
    color: '#64748b',
  },
  metaValText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  timelineLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timelineContainer: {
    paddingLeft: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 40,
  },
  timelineMarkerCol: {
    alignItems: 'center',
    marginRight: 10,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 2,
  },
  timelineContentCol: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  timelineTimeText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  resetContainer: {
    marginTop: 24,
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 16,
    alignItems: 'center',
  },
  resetWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  resetWarningText: {
    fontSize: 11,
    color: '#d97706',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  resetBtn: {
    backgroundColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
