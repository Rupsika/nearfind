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

// ── DigiLocker-style Splash Screen ──────────────────────────────────────────────
function SplashScreen({ onDone }) {
  // Entry animations (logo + text fade+scale in on mount)
  const entryFade = useRef(new Animated.Value(0)).current;
  const entryScale = useRef(new Animated.Value(0.75)).current;
  // Progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Exit animation
  const exitFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo scales + fades in (0 → 300ms)
    Animated.parallel([
      Animated.timing(entryFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(entryScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    // 2. Progress bar runs 0→100% over 2.2s
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();

    // 3. Exit fade at 2.5s mark
    const exitTimer = setTimeout(() => {
      Animated.timing(exitFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 2500);

    return () => clearTimeout(exitTimer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.splashRoot, { opacity: exitFade }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#4f46e5', '#6366f1', '#818cf8']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Center Content */}
      <View style={styles.splashCenter}>
        <Animated.View style={{ opacity: entryFade, transform: [{ scale: entryScale }], alignItems: 'center' }}>
          <View style={styles.splashLogoBox}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.splashLogoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.splashAppName}>NearFind</Text>

          {/* Thin animated progress bar */}
          <View style={styles.splashProgressTrack}>
            <Animated.View style={[styles.splashProgressFill, { width: progressWidth }]} />
          </View>
        </Animated.View>
      </View>

      {/* Bottom tagline */}
      <Animated.View style={[styles.splashBottom, { opacity: entryFade }]}>
        <Text style={styles.splashTagline}>Hyperlocal discovery &</Text>
        <Text style={styles.splashTagline}>lightning-fast deliveries</Text>
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
      // Static version while waiting (before exit is triggered)
      <View style={styles.splashRoot}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#4f46e5', '#6366f1', '#818cf8']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
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
          <Text style={styles.splashTagline}>Hyperlocal discovery &</Text>
          <Text style={styles.splashTagline}>lightning-fast deliveries</Text>
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
  // ── Splash (DigiLocker-style) ─────────────────────────────────────────────────
  splashRoot: {
    flex: 1,
    backgroundColor: '#4f46e5',   // fallback if gradient not loaded
  },
  splashCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoBox: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  splashLogoImg: {
    width: 80,
    height: 80,
  },
  splashAppName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  splashProgressTrack: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  splashProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  splashBottom: {
    paddingBottom: 52,
    alignItems: 'center',
  },
  splashTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
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
