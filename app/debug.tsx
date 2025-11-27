import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Share, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { Stack, useRouter } from 'expo-router';

const KEYS = [
  '@chores',
  '@people',
  '@assignments',
  '@points',
  '@users',
  '@current_user',
  '@rated_assignments',
  '@user_person_map',
];

export default function DebugStorageScreen() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAll = async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(
        KEYS.map(async (k) => {
          const v = await AsyncStorage.getItem(k);
          let parsed: any = null;
          try {
            parsed = v ? JSON.parse(v) : null;
          } catch {
            parsed = v;
          }
          return [k, parsed] as const;
        })
      );
      const obj: Record<string, any> = {};
      entries.forEach(([k, v]) => (obj[k] = v));
      setData(obj);
    } catch (e) {
      console.error('Failed to load storage', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const shareDump = async () => {
    try {
      const payload = JSON.stringify(data, null, 2);
      await Share.share({ message: payload });
    } catch (e) {
      Alert.alert('Share failed', String(e));
    }
  };

  const clearKey = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      await loadAll();
    } catch (e) {
      Alert.alert('Failed to clear', `${key}: ${e}`);
    }
  };

  const HeaderActions = () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <TouchableOpacity onPress={loadAll} accessibilityLabel="Refresh storage" style={styles.headerBtn}>
        <Text style={styles.headerBtnText}>Refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={shareDump} accessibilityLabel="Share storage dump" style={styles.headerBtn}>
        <Text style={styles.headerBtnText}>Share</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close debug" style={[styles.headerBtn, { backgroundColor: colors.danger }] }>
        <Text style={[styles.headerBtnText, { color: colors.card }]}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Storage Debug', headerRight: HeaderActions }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={loadAll} accessibilityRole="button">
            <Text style={styles.actionText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={shareDump} accessibilityRole="button">
            <Text style={styles.actionText}>Share Dump</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.danger }]} onPress={() => router.back()} accessibilityRole="button">
            <Text style={[styles.actionText, { color: colors.card }]}>Close</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          KEYS.map((k) => (
            <View key={k} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.keyLabel}>{k}</Text>
                <Pressable onPress={() => clearKey(k)}>
                  <Text style={[styles.smallBtn, { color: colors.danger }]}>Clear</Text>
                </Pressable>
              </View>
              <ScrollView horizontal style={styles.jsonBox}>
                <Text style={styles.jsonText}>{JSON.stringify(data[k], null, 2)}</Text>
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  headerBtnText: { color: colors.card, fontWeight: '700' },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 50 },
  actionBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  actionText: { color: colors.card, fontWeight: '700' },
  loadingText: { color: colors.text, fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  keyLabel: { color: colors.text, fontWeight: '800' },
  smallBtn: { fontWeight: '700' },
  jsonBox: { backgroundColor: colors.background, borderRadius: 8, padding: 8 },
  jsonText: { color: colors.text, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 12 },
});
