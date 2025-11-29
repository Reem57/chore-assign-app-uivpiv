
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemedStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useChoreData } from '@/hooks/useChoreData';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const { addPerson } = useChoreData();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const triggerButtonAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    // Trigger animation
    triggerButtonAnimation();

    setLoading(true);
    const success = await login(username.trim(), password);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)/' as any);
    } else {
      Alert.alert('Error', 'Invalid username or password');
    }
  };

  const handleSignup = async () => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    // Trigger animation
    triggerButtonAnimation();

    setLoading(true);
    const success = await signup(username.trim(), password, name.trim());
    setLoading(false);

    if (success) {
      // Add the person to the people list
      await addPerson(name.trim());
      router.replace('/(tabs)/' as any);
    } else {
      Alert.alert('Error', 'Sign up failed. Username may already exist or contain invalid characters.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <IconSymbol name="house.fill" color={colors.primary} size={64} />
            </View>
            <Text style={styles.title}>Chore Manager</Text>
            <Text style={styles.subtitle}>
              {isSignup ? 'Create your account' : 'Welcome back!'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignup && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <IconSymbol name="person.fill" color={colors.textSecondary} size={20} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="at" color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="lock.fill" color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Pressable
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={isSignup ? handleSignup : handleLogin}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable
              style={styles.switchButton}
              onPress={() => {
                setIsSignup(!isSignup);
                setUsername('');
                setPassword('');
                setName('');
              }}
            >
              <Text style={styles.switchButtonText}>
                {isSignup
                  ? 'Already have an account? Log in'
                  : "Don't have an account? Sign up"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
  
  function getStyles(colors: any) {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 4,
  },
  passwordToggle: {
    padding: 12,
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  switchButton: {
    padding: 12,
    alignItems: 'center',
  },
      switchButtonText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
      },
    });
  }
}
