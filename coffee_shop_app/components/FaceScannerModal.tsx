import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface FaceScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export default function FaceScannerModal({
  visible,
  onClose,
  onSuccess,
  title = 'Xác thực Khuôn mặt (Face ID)',
}: FaceScannerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.descText}>
            Tính năng nhận diện khuôn mặt yêu cầu trình duyệt Web để khởi chạy camera và canvas mô phỏng.
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1E1E24',
    padding: 24,
    borderRadius: 20,
    width: 300,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontFamily: 'Sora-Bold',
    color: '#FFF',
    marginBottom: 16,
  },
  descText: {
    fontSize: 14,
    fontFamily: 'Sora-Regular',
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: '#2A2A35',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
  },
});
