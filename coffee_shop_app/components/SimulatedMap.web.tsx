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
  // Color themes
  const bgColor = isDark ? '#1E1E24' : '#F9F9FB';
  const borderColor = isDark ? '#3E3E4A' : '#E2E8F0';
  const gridColor = isDark ? '#2D2D38' : '#ECECF0';
  const riverColor = isDark ? '#1C314C' : '#E0F2FE';
  const streetColor = isDark ? '#374151' : '#E5E7EB';
  const routeColor = '#C67C4E';
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';

  // SVG Path for the delivery route
  // From Shop (50, 130) to User (330, 50)
  const pathD = 'M 50,130 C 120,130 110,50 190,60 S 260,90 330,50';

  // Determine Bike Position/Movement State
  // If not tracking (checkout preview), or if active delivering (step == 2), animate.
  const isAnimating = !isTracking || step === 2;

  // Static positions for bike when not animating
  const staticBikeX = step >= 3 ? 330 : 50;
  const staticBikeY = step >= 3 ? 50 : 130;

  // Status text for the map overlay
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
      {/* Map Header Overlay */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: textColor }]}>
          {statusText}
        </Text>
      </View>

      {/* SVG Map Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 380 180"
        style={{ borderRadius: 12, overflow: 'hidden' }}
      >
        {/* Grid lines pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridColor} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Background streets */}
        <line x1="0" y1="90" x2="380" y2="90" stroke={streetColor} strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="100" y1="0" x2="100" y2="180" stroke={streetColor} strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="280" y1="0" x2="280" y2="180" stroke={streetColor} strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Han River (Sông Hàn) */}
        <path
          d="M 190,0 Q 220,90 190,180"
          stroke={riverColor}
          strokeWidth="32"
          fill="none"
          opacity="0.8"
        />

        {/* Dragon Bridge (Cầu Rồng) cross-section */}
        <line x1="175" y1="90" x2="215" y2="90" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
        <line x1="175" y1="90" x2="215" y2="90" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

        {/* Delivery Route Path */}
        <path
          id="delivery-route"
          d={pathD}
          stroke={routeColor}
          strokeWidth="3"
          strokeDasharray="6 4"
          fill="none"
        />

        {/* Shop Marker (🏢) */}
        <g transform="translate(50, 130)">
          <circle r="16" fill="#C67C4E" opacity="0.2" />
          <circle r="11" fill="#C67C4E" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="-7" y="5" fontSize="13" style={{ cursor: 'default' }}>☕</text>
        </g>
        <text x="35" y="160" fontSize="10" fontFamily="Sora-Bold" fill={textColor}>Cửa hàng</text>

        {/* User Marker (📍) */}
        <g transform="translate(330, 50)">
          <circle r="16" fill="#10B981" opacity="0.2">
            {/* Pulsing effect */}
            <animate attributeName="r" values="12;20;12" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="11" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="-7" y="4" fontSize="13" style={{ cursor: 'default' }}>📍</text>
        </g>
        <text x="310" y="80" fontSize="10" fontFamily="Sora-Bold" fill={textColor}>Bạn</text>

        {/* Animated Delivery Bike (🏍️) */}
        {isAnimating ? (
          <g>
            <animateMotion
              dur="10s"
              repeatCount="indefinite"
              path={pathD}
              rotate="auto"
            />
            {/* Center the bike character on the path */}
            <text x="-10" y="8" fontSize="20" style={{ cursor: 'default' }}>🏍️</text>
          </g>
        ) : (
          <g transform={`translate(${staticBikeX}, ${staticBikeY})`}>
            <text x="-10" y="8" fontSize="20" style={{ cursor: 'default' }}>🏍️</text>
          </g>
        )}
      </svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 12,
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerText: {
    fontSize: 11,
    fontFamily: 'Sora-Bold',
  },
});
