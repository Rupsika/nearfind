import React, { useContext, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

const ToastItem = ({ item, onDismiss }) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(item.id);
    });
  };

  // Select colors and icons based on type
  const getTheme = () => {
    switch (item.type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.95)', // emerald
          border: '#34d399',
          icon: 'checkmark-circle',
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.95)', // rose/red
          border: '#f87171',
          icon: 'alert-circle',
        };
      case 'info':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.95)', // blue
          border: '#60a5fa',
          icon: 'information-circle',
        };
    }
  };

  const theme = getTheme();

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={theme.icon} size={22} color="#ffffff" style={styles.icon} />
        <Text style={styles.toastText} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Ionicons name="close" size={18} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationToast() {
  const { notifications, dismissNotification } = useContext(AppContext);

  if (notifications.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={dismissNotification} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width - 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    opacity: 0.8,
  },
});
