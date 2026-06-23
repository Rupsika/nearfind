import React, { useContext, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, AppContext } from './src/context/AppContext';
import NotificationToast from './src/components/NotificationToast';
import CustomerPortal from './src/screens/CustomerPortal';
import RetailerPortal from './src/screens/RetailerPortal';
import DeliveryPortal from './src/screens/DeliveryPortal';
import AdminDashboard from './src/screens/AdminDashboard';

// Standalone splash screen component — renders as its own full screen (early return)
function SplashScreen({ onDone }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Called by parent when both isLoaded AND min timer have fired
  useEffect(() => {
    // Short breath before starting exit — feels more polished
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.55,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => onDone());
    }, 100);

    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <Animated.View style={[styles.splashScreen, { opacity: fadeAnim }]}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.splashLogoWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('./assets/logo.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.splashTitle}>NearFind</Text>
      <Text style={styles.splashTagline}>Hyperlocal · Fast · Reliable</Text>
    </Animated.View>
  );
}

function MainAppShell() {
  const { activeRole, selectRole, isLoaded, orders } = useContext(AppContext);
  const [showSplash, setShowSplash] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [exitingSplash, setExitingSplash] = useState(false);

  // Minimum display time: 2.5 seconds regardless of load speed
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Once BOTH conditions are met, trigger the exit animation
  useEffect(() => {
    if (isLoaded && minTimePassed && !exitingSplash) {
      setExitingSplash(true);
    }
  }, [isLoaded, minTimePassed]);

  // Notification badge counts
  const retailerPendingCount = orders.filter((o) => o.status === 'Placed').length;
  const deliveryAvailableCount = orders.filter(
    (o) => o.status === 'Ready for Pickup' && !o.deliveryAccepted
  ).length;

  // Show splash as full early return — guaranteed full screen, no overlay issues
  if (showSplash) {
    return exitingSplash ? (
      <SplashScreen onDone={() => setShowSplash(false)} />
    ) : (
      <View style={styles.splashScreen}>
        <StatusBar style="dark" />
        <View style={styles.splashLogoWrapper}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.splashTitle}>NearFind</Text>
        <Text style={styles.splashTagline}>Hyperlocal · Fast · Reliable</Text>
      </View>
    );
  }

  const renderActiveScreen = () => {
    switch (activeRole) {
      case 'customer': return <CustomerPortal />;
      case 'retailer': return <RetailerPortal />;
      case 'delivery': return <DeliveryPortal />;
      case 'admin': return <AdminDashboard />;
      default: return <CustomerPortal />;
    }
  };

  const getRoleColor = (role) => {
    if (activeRole === role) {
      switch (role) {
        case 'customer': return '#4f46e5';
        case 'retailer': return '#0f172a';
        case 'delivery': return '#0284c7';
        case 'admin': return '#475569';
      }
    }
    return '#94a3b8';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <NotificationToast />

      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => selectRole('customer')}>
          <Ionicons name="cart" size={24} color={getRoleColor('customer')} />
          <Text style={[styles.tabLabel, { color: getRoleColor('customer') }]}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => selectRole('retailer')}>
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

        <TouchableOpacity style={styles.tabBtn} onPress={() => selectRole('delivery')}>
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

        <TouchableOpacity style={styles.tabBtn} onPress={() => selectRole('admin')}>
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
  // ── Splash ──────────────────────────────────────────────────────────────────
  splashScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoWrapper: {
    width: 160,
    height: 160,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  splashImage: {
    width: 160,
    height: 160,
  },
  splashTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 1.5,
  },

  // ── App Shell ────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
  },

  // ── Tab Bar ──────────────────────────────────────────────────────────────────
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
