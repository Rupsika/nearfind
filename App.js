import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, AppContext } from './src/context/AppContext';
import NotificationToast from './src/components/NotificationToast';
import CustomerPortal from './src/screens/CustomerPortal';
import RetailerPortal from './src/screens/RetailerPortal';
import DeliveryPortal from './src/screens/DeliveryPortal';
import AdminDashboard from './src/screens/AdminDashboard';

function MainAppShell() {
  const { activeRole, selectRole, isLoaded, orders, activeRetailerId } = useContext(AppContext);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Initializing NearFind...</Text>
      </View>
    );
  }

  // Calculate dynamic notification badges for the tabs to make demo testing seamless
  // 1. Retailer Badge: count of all 'Placed' orders system-wide
  const retailerPendingCount = orders.filter(
    (o) => o.status === 'Placed'
  ).length;

  // 2. Delivery Badge: count of available 'Ready for Pickup' delivery jobs
  const deliveryAvailableCount = orders.filter(
    (o) => o.status === 'Ready for Pickup' && !o.deliveryAccepted
  ).length;

  // Render active portal
  const renderActiveScreen = () => {
    switch (activeRole) {
      case 'customer':
        return <CustomerPortal />;
      case 'retailer':
        return <RetailerPortal />;
      case 'delivery':
        return <DeliveryPortal />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <CustomerPortal />;
    }
  };

  const getRoleColor = (role) => {
    if (activeRole === role) {
      switch (role) {
        case 'customer': return '#4f46e5'; // Indigo
        case 'retailer': return '#0f172a'; // Slate
        case 'delivery': return '#0284c7'; // Sky
        case 'admin': return '#475569'; // Gray
      }
    }
    return '#94a3b8';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <NotificationToast />
      
      {/* Active Screen Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Custom Bottom Tab Bar Navigation */}
      <View style={styles.tabBar}>
        {/* Customer Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => selectRole('customer')}
        >
          <Ionicons name="cart" size={24} color={getRoleColor('customer')} />
          <Text style={[styles.tabLabel, { color: getRoleColor('customer') }]}>Customer</Text>
        </TouchableOpacity>

        {/* Retailer Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => selectRole('retailer')}
        >
          <View>
            <Ionicons name="storefront" size={24} color={getRoleColor('retailer')} />
            {retailerPendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{retailerPendingCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, { color: getRoleColor('retailer') }]}>Retailer</Text>
        </TouchableOpacity>

        {/* Delivery Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => selectRole('delivery')}
        >
          <View>
            <Ionicons name="bicycle" size={24} color={getRoleColor('delivery')} />
            {deliveryAvailableCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.badgeText}>{deliveryAvailableCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, { color: getRoleColor('delivery') }]}>Delivery</Text>
        </TouchableOpacity>

        {/* Admin Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => selectRole('admin')}
        >
          <Ionicons name="analytics" size={24} color={getRoleColor('admin')} />
          <Text style={[styles.tabLabel, { color: getRoleColor('admin') }]}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 10,
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
