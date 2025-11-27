
import { StyleSheet, ViewStyle, TextStyle, useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F8F9FA',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#E5E7EB',
  card: '#FFFFFF',
  highlight: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export const darkColors = {
  background: '#0F0F0F',
  text: '#E5E7EB',
  textSecondary: '#9CA3AF',
  primary: '#818CF8',
  secondary: '#A78BFA',
  accent: '#1F2937',
  card: '#1A1A1A',
  highlight: '#312E81',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
};

export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
};

// Legacy export for backward compatibility
export const colors = lightColors;

export const useThemedStyles = () => {
  const themeColors = useThemeColors();
  
  return {
    colors: themeColors,
    buttonStyles: StyleSheet.create({
      instructionsButton: {
        backgroundColor: themeColors.primary,
        alignSelf: 'center',
        width: '100%',
      },
      backButton: {
        backgroundColor: themeColors.accent,
        alignSelf: 'center',
        width: '100%',
      },
    }),
    commonStyles: StyleSheet.create({
      wrapper: {
        backgroundColor: themeColors.background,
        width: '100%',
        height: '100%',
      },
      container: {
        flex: 1,
        backgroundColor: themeColors.background,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 800,
        width: '100%',
      },
      title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        color: themeColors.text,
        marginBottom: 10
      },
      text: {
        fontSize: 16,
        fontWeight: '500',
        color: themeColors.text,
        marginBottom: 8,
        lineHeight: 24,
        textAlign: 'center',
      },
      section: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
      },
      buttonContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
      },
      card: {
        backgroundColor: themeColors.card,
        borderColor: themeColors.accent,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        marginVertical: 8,
        width: '100%',
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
        elevation: 2,
      },
      icon: {
        width: 60,
        height: 60,
        tintColor: themeColors.primary,
      },
    }),
  };
};

// Legacy exports for backward compatibility
export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.accent,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
