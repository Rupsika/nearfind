import React, { useContext, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppProvider, AppContext } from './src/context/AppContext';
import NotificationToast from './src/components/NotificationToast';
import CustomerPortal from './src/screens/CustomerPortal';
import RetailerPortal from './src/screens/RetailerPortal';
import DeliveryPortal from './src/screens/DeliveryPortal';
import AdminDashboard from './src/screens/AdminDashboard';

// ── NearFind Splash Screen ────────────────────────────────────────────────────
const SPLASH_BG = '#f0fdf4';       // Light mint — fresh NearFind brand
const SPLASH_ACCENT = '#10b981';   // Emerald green — fresh, delivery-feel

function SplashScreen({ onDone }) {
  // Each element slides up independently (staggered)
  const logoY    = useRef(new Animated.Value(40)).current;
  const logoOp   = useRef(new Animated.Value(0)).current;
  const nameY    = useRef(new Animated.Value(30)).current;
  const nameOp   = useRef(new Animated.Value(0)).current;
  const barW     = useRef(new Animated.Value(0)).current;
  const tagOp    = useRef(new Animated.Value(0)).current;
  const tagY     = useRef(new Animated.Value(16)).current;
  const exitOp   = useRef(new Animated.Value(1)).current;

  const slide = (y, op, delay) => Animated.parallel([
    Animated.timing(y,  { toValue: 0,   duration: 480, delay, useNativeDriver: true }),
    Animated.timing(op, { toValue: 1,   duration: 400, delay, useNativeDriver: true }),
  ]);

  useEffect(() => {
    // Staggered slide-up: logo → name → bar → tagline
    Animated.sequence([
      slide(logoY, logoOp, 0),
      slide(nameY, nameOp, 80),
      Animated.timing(barW, { toValue: 1, duration: 1600, delay: 100, useNativeDriver: false }),
    ]).start();

    // Tagline fades in after 300ms
    Animated.parallel([
      Animated.timing(tagOp, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(tagY,  { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();

    // Exit: fade everything out at 2.8s
    const exitTimer = setTimeout(() => {
      Animated.timing(exitOp, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 2800);

    return () => clearTimeout(exitTimer);
  }, []);

  const barWidth = barW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.splashRoot, { opacity: exitOp }]}>
      <StatusBar style="dark" />

      {/* Subtle radial glow behind logo */}
      <View style={styles.splashGlow} />

      {/* Center: logo + name + bar */}
      <View style={styles.splashCenter}>
        <Animated.View style={{ opacity: logoOp, transform: [{ translateY: logoY }] }}>
          <View style={styles.splashLogoBox}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.splashLogoImg}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.splashAppName, { opacity: nameOp, transform: [{ translateY: nameY }] }]}>
          NearFind
        </Animated.Text>

        <View style={styles.splashProgressTrack}>
          <Animated.View style={[styles.splashProgressFill, { width: barWidth }]} />
        </View>
      </View>

      {/* Bottom tagline */}
      <Animated.View style={[styles.splashBottom, { opacity: tagOp, transform: [{ translateY: tagY }] }]}>
        <Text style={styles.splashTagline}>Hyperlocal discovery &amp; lightning-fast deliveries</Text>
      </Animated.View>
    </Animated.View>
  );
}


function MainAppShell() {
  const { activeRole, selectRole, isLoaded, orders } = useContext(AppContext);
  const [showSplash, setShowSplash] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [exitingSplash, setExitingSplash] = useState(false);

  // Minimum display time: 2.8 seconds (progress bar runs 2.2s + buffer)
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Once BOTH isLoaded + min timer done, trigger exit
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

  // Show splash as full early return — guaranteed full screen
  if (showSplash) {
    return exitingSplash ? (
      <SplashScreen onDone={() => setShowSplash(false)} />
    ) : (
      // Static (waiting) — pure dark, no animation yet
      <View style={styles.splashRoot}>
        <StatusBar style="dark" />
        <View style={styles.splashGlow} />
        <View style={styles.splashCenter}>
          <View style={styles.splashLogoBox}>
            <Image source={require('./assets/logo.png')} style={styles.splashLogoImg} resizeMode="contain" />
          </View>
          <Text style={styles.splashAppName}>NearFind</Text>
          <View style={styles.splashProgressTrack}>
            <View style={[styles.splashProgressFill, { width: '0%' }]} />
          </View>
        </View>
        <View style={styles.splashBottom}>
          <Text style={styles.splashTagline}>Hyperlocal discovery &amp; lightning-fast deliveries</Text>
        </View>
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
  // ── Splash — NearFind light green theme ─────────────────────────────────────
  splashRoot: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  // Soft mint circle glow behind the logo
  splashGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#bbf7d060',
    top: '22%',
    alignSelf: 'center',
  },
  splashCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoBox: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#6ee7b7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  splashLogoImg: {
    width: 84,
    height: 84,
  },
  splashAppName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 1,
    marginBottom: 24,
  },
  splashProgressTrack: {
    width: 120,
    height: 3,
    backgroundColor: '#d1fae5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  splashProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  splashBottom: {
    paddingBottom: 56,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  splashTagline: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
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
