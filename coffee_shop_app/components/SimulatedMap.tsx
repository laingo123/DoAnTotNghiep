import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimulatedMapProps {
  distance: number | null;
  duration: number | null;
  isDark: boolean;
  isTracking?: boolean;
  step?: number;
}

export default function SimulatedMap({
  distance,
  duration,
  isDark,
  isTracking = false,
  step = 0,
}: SimulatedMapProps) {
  const bgColor = isDark ? '#1E1E24' : '#F9F9FB';
  const borderColor = isDark ? '#3E3E4A' : '#E2E8F0';
  const textColor = isDark ? '#FFFFFF' : '#1F2937';

  let statusText = 'Mô phỏng bản đồ giao hàng';
  if (isTracking) {
    if (step === 0) statusText = '🏢 Đơn hàng đã tiếp nhận';
    else if (step === 1) statusText = '☕ Đang pha chế và chuẩn bị';
    else if (step === 2) statusText = '🏍️ Shipper đang giao hàng';
    else if (step === 3) statusText = '🎉 Đơn hàng đã giao thành công';
  } else if (distance) {
    statusText = `📍 Khoảng cách đến bạn: ${distance.toFixed(1)} km (~${duration} phút)`;
  }

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor: borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{statusText}</Text>
      <View style={styles.placeholderMap}>
        <Text style={[styles.placeholderText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          🗺️ Bản đồ mô phỏng đường đi
        </Text>
        <Text style={[styles.placeholderSubtext, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          (Khả dụng trên phiên bản Web)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
  placeholderMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Sora-SemiBold',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    fontFamily: 'Sora-Regular',
  },
});
