
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 24,
  bottomMargin = 16,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const activeIndex = tabs.findIndex((tab) => {
    if (tab.route === '/(tabs)/(home)/') {
      return pathname === '/' || pathname.startsWith('/(tabs)/(home)');
    }
    return pathname.includes(tab.name);
  });

  const translateX = useSharedValue(0);

  React.useEffect(() => {
    const tabWidth = containerWidth / tabs.length;
    translateX.value = withSpring(activeIndex * tabWidth, {
      damping: 20,
      stiffness: 90,
    });
  }, [activeIndex, containerWidth, tabs.length]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const tabWidth = containerWidth / tabs.length;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, { marginBottom: bottomMargin }]}
    >
      <View style={[styles.container, { width: containerWidth }]}>
        <BlurView
          intensity={80}
          tint={theme.dark ? 'dark' : 'light'}
          style={[styles.blurContainer, { borderRadius }]}
        >
          <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
            <Animated.View
              style={[
                styles.activeIndicator,
                {
                  width: tabWidth,
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius - 4,
                },
                animatedStyle,
              ]}
            />
            {tabs.map((tab, index) => {
              const isActive = index === activeIndex;
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={[styles.tab, { width: tabWidth }]}
                  onPress={() => handleTabPress(tab.route)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name={tab.icon as any}
                    size={24}
                    color={isActive ? colors.card : colors.text}
                    style={styles.icon}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: isActive ? colors.card : colors.text },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    opacity: 0.95,
  },
  activeIndicator: {
    position: 'absolute',
    height: 48,
    top: 8,
    left: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
