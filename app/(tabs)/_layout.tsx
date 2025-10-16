
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { isAdmin } = useAuth();

  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Home',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      label: 'Profile',
    },
  ];

  // Add admin tab if user is admin
  if (isAdmin()) {
    tabs.splice(1, 0, {
      name: 'admin',
      route: '/(tabs)/admin',
      icon: 'chart.bar.fill',
      label: 'Admin',
    });
  }

  // Use NativeTabs for iOS, custom FloatingTabBar for Android and Web
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <Icon sf="house.fill" drawable="ic_home" color={colors.text} />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        {isAdmin() && (
          <NativeTabs.Trigger name="admin">
            <Icon sf="chart.bar.fill" drawable="ic_admin" color={colors.text} />
            <Label>Admin</Label>
          </NativeTabs.Trigger>
        )}
        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" drawable="ic_profile" color={colors.text} />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        {isAdmin() && <Stack.Screen name="admin" />}
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
