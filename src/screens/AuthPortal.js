import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function AuthPortal() {
  const { loginUser, registerUser } = useContext(AppContext);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // customer | retailer | delivery
  const [retailerId, setRetailerId] = useState('sharma'); // sharma | quick_mart | super_save
  const [errorMsg, setErrorMsg] = useState('');

  // Password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleAuthAction = async () => {
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all credentials.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const res = await registerUser(
          name.trim(),
          email.trim(),
          password,
          role,
          role === 'retailer' ? retailerId : null
        );
        if (!res.success) {
          setErrorMsg(res.error);
        }
      } else {
        const res = await loginUser(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error);
        }
      }
    } catch (e) {
      setErrorMsg('An unexpected error occurred. Try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Login helper
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await loginUser(demoEmail, demoPassword);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (e) {
      setErrorMsg('Quick login failed.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#16a34a', '#14532d']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="location" size={44} color="#16a34a" />
            </View>
            <Text style={styles.logoText}>NearFind</Text>
            <Text style={styles.logoSubtext}>Hyperlocal role-based commerce</Text>
          </View>

          {/* Form Card */}
          <View style={styles.authCard}>
            <Text style={styles.cardTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            {isSignUp && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { marginRight: 32 }]}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.visibilityToggle}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Role Choices */}
            {isSignUp && (
              <View style={styles.roleSelectionContainer}>
                <Text style={styles.roleHeaderLabel}>Select Your Role</Text>
                <View style={styles.roleTabsRow}>
                  <TouchableOpacity
                    style={[styles.roleTabBtn, role === 'customer' && styles.roleTabBtnActive]}
                    onPress={() => setRole('customer')}
                  >
                    <Ionicons name="cart" size={16} color={role === 'customer' ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.roleTabLabel, role === 'customer' && styles.roleTabLabelActive]}>Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleTabBtn, role === 'retailer' && styles.roleTabBtnActive]}
                    onPress={() => setRole('retailer')}
                  >
                    <Ionicons name="storefront" size={16} color={role === 'retailer' ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.roleTabLabel, role === 'retailer' && styles.roleTabLabelActive]}>Retailer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleTabBtn, role === 'delivery' && styles.roleTabBtnActive]}
                    onPress={() => setRole('delivery')}
                  >
                    <Ionicons name="bicycle" size={16} color={role === 'delivery' ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.roleTabLabel, role === 'delivery' && styles.roleTabLabelActive]}>Rider</Text>
                  </TouchableOpacity>
                </View>

                {role === 'retailer' && (
                  <View style={styles.storeSelectionContainer}>
                    <Text style={styles.roleHeaderLabel}>Select Your Store</Text>
                    <View style={styles.storeChipsRow}>
                      <TouchableOpacity
                        style={[styles.storeChip, retailerId === 'sharma' && styles.storeChipActive]}
                        onPress={() => setRetailerId('sharma')}
                      >
                        <Text style={[styles.storeChipText, retailerId === 'sharma' && styles.storeChipTextActive]}>Sharma Kirana</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.storeChip, retailerId === 'quick_mart' && styles.storeChipActive]}
                        onPress={() => setRetailerId('quick_mart')}
                      >
                        <Text style={[styles.storeChipText, retailerId === 'quick_mart' && styles.storeChipTextActive]}>Quick Mart</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.storeChip, retailerId === 'super_save' && styles.storeChipActive]}
                        onPress={() => setRetailerId('super_save')}
                      >
                        <Text style={[styles.storeChipText, retailerId === 'super_save' && styles.storeChipTextActive]}>Super Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAuthAction}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign In/Up */}
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              disabled={isLoading}
            >
              <Text style={styles.toggleBtnText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Logins Panel */}
          <View style={styles.demoPanel}>
            <Text style={styles.demoHeader}>Quick Demo Access</Text>
            <Text style={styles.demoSub}>Tap a role below to auto-fill credentials and log in instantly</Text>
            
            <View style={styles.demoButtonsGrid}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickLogin('customer@nearfind.com', 'password')}
                disabled={isLoading}
              >
                <Ionicons name="cart" size={18} color="#16a34a" style={{ marginBottom: 4 }} />
                <Text style={styles.demoBtnTitle}>Customer</Text>
                <Text style={styles.demoBtnDesc}>Shop catalog</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickLogin('retailer@nearfind.com', 'password')}
                disabled={isLoading}
              >
                <Ionicons name="storefront" size={18} color="#10b981" style={{ marginBottom: 4 }} />
                <Text style={styles.demoBtnTitle}>Retailer</Text>
                <Text style={styles.demoBtnDesc}>Manage store</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickLogin('delivery@nearfind.com', 'password')}
                disabled={isLoading}
              >
                <Ionicons name="bicycle" size={18} color="#0284c7" style={{ marginBottom: 4 }} />
                <Text style={styles.demoBtnTitle}>Delivery</Text>
                <Text style={styles.demoBtnDesc}>Accept runs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickLogin('admin@nearfind.com', 'password')}
                disabled={isLoading}
              >
                <Ionicons name="shield-checkmark" size={18} color="#475569" style={{ marginBottom: 4 }} />
                <Text style={styles.demoBtnTitle}>Admin</Text>
                <Text style={styles.demoBtnDesc}>System controls</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  logoSubtext: {
    fontSize: 12,
    color: '#bbf7d0',
    marginTop: 4,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 14,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },
  visibilityToggle: {
    position: 'absolute',
    right: 14,
  },
  roleSelectionContainer: {
    marginTop: 8,
    marginBottom: 14,
  },
  roleHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 4,
  },
  roleTabBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  roleTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  roleTabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  storeSelectionContainer: {
    marginTop: 14,
  },
  storeChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  storeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  storeChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  storeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  storeChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  toggleBtnText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  
  // Demo accounts panel
  demoPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  demoHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  demoSub: {
    fontSize: 11,
    color: '#bbf7d0',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  demoButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  demoBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    width: (width - 48 - 40 - 10) / 2, // dynamic sizing to fit 2-column grid inside screen padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  demoBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  demoBtnDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
});
