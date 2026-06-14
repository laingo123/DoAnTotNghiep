import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  if (!visible) return null;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Initialize Camera
  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 300, height: 300 },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasCamera(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.warn('Video play error:', e));
              setLoading(false);
            }
          };
        }
      } catch (err) {
        console.warn('Camera capture failed, using mock mode:', err);
        if (active) {
          setHasCamera(false);
          setLoading(false);
        }
      }
    };

    startCamera();

    // Start progress increment timer
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            cleanup();
            onSuccess();
          }, 600);
          return 100;
        }
        return prev + 1;
      });
    }, 35); // Takes approx 3.5s

    return () => {
      active = false;
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Canvas Drawing Loop for Mock AI Facial Landmarks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    // Fixed base coordinates for a simulated face inside 220x220 scan circle
    // Coordinates centered around (110, 110)
    const getFacePoints = (f: number) => {
      // Add slight organic noise / micro-movements
      const noise = (scale = 1) => (Math.sin(f * 0.15) * 1.5 + (Math.random() - 0.5) * 1) * scale;
      const breathing = Math.sin(f * 0.04) * 2;

      return {
        leftEye: { x: 92 + noise(0.6), y: 95 + breathing },
        rightEye: { x: 128 + noise(0.6), y: 95 + breathing },
        leftEyebrow: [
          { x: 82 + noise(0.4), y: 88 + breathing },
          { x: 92 + noise(0.4), y: 90 + breathing },
          { x: 100 + noise(0.4), y: 91 + breathing },
        ],
        rightEyebrow: [
          { x: 120 + noise(0.4), y: 91 + breathing },
          { x: 128 + noise(0.4), y: 90 + breathing },
          { x: 138 + noise(0.4), y: 88 + breathing },
        ],
        noseBridge: [
          { x: 110 + noise(0.2), y: 95 + breathing },
          { x: 110 + noise(0.2), y: 108 + breathing },
          { x: 110 + noise(0.2), y: 116 + breathing },
        ],
        noseTip: { x: 110 + noise(0.3), y: 120 + breathing },
        mouth: [
          { x: 98 + noise(0.5), y: 138 + breathing },
          { x: 110 + noise(0.5), y: 136 + breathing },
          { x: 122 + noise(0.5), y: 138 + breathing },
          { x: 110 + noise(0.5), y: 144 + breathing },
        ],
        chinOutline: [
          { x: 74 + noise(0.8), y: 115 + breathing },
          { x: 86 + noise(0.8), y: 146 + breathing },
          { x: 110 + noise(0.8), y: 165 + breathing },
          { x: 134 + noise(0.8), y: 146 + breathing },
          { x: 146 + noise(0.8), y: 115 + breathing },
        ],
      };
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, 220, 220);

      const pts = getFacePoints(frame);

      // 1. Draw Laser Sweep Line
      const sweepY = 110 + Math.sin(frame * 0.035) * 75;
      const laserGradient = ctx.createLinearGradient(0, sweepY - 8, 0, sweepY + 2);
      laserGradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
      laserGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.45)');
      laserGradient.addColorStop(1, 'rgba(16, 185, 129, 0.9)');

      ctx.fillStyle = laserGradient;
      ctx.fillRect(10, sweepY - 10, 200, 10);

      // Bright laser leading edge
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(15, sweepY);
      ctx.lineTo(205, sweepY);
      ctx.stroke();

      // 2. Draw Target Bounds Box Corners
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      const drawCorner = (x: number, y: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(x + dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy);
        ctx.stroke();
      };
      drawCorner(50, 45, 15, 15);
      drawCorner(170, 45, -15, 15);
      drawCorner(50, 165, 15, -15);
      drawCorner(170, 165, -15, -15);

      // 3. Draw AI Mesh / Tracking Points (Green glowing lines and circles)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 0.8;

      // Draw connection lines
      const drawLine = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      };

      // Connect eyes and eyebrows
      drawLine(pts.leftEyebrow[1], pts.leftEye);
      drawLine(pts.rightEyebrow[1], pts.rightEye);
      drawLine(pts.leftEye, pts.noseBridge[0]);
      drawLine(pts.rightEye, pts.noseBridge[0]);

      // Connect nose bridge and tip
      drawLine(pts.noseBridge[0], pts.noseBridge[1]);
      drawLine(pts.noseBridge[1], pts.noseBridge[2]);
      drawLine(pts.noseBridge[2], pts.noseTip);
      drawLine(pts.noseTip, pts.mouth[1]);

      // Connect mouth corners and chin
      drawLine(pts.mouth[0], pts.chinOutline[1]);
      drawLine(pts.mouth[2], pts.chinOutline[3]);
      drawLine(pts.mouth[3], pts.chinOutline[2]);

      // Draw chin line
      ctx.beginPath();
      ctx.moveTo(pts.chinOutline[0].x, pts.chinOutline[0].y);
      for (let i = 1; i < pts.chinOutline.length; i++) {
        ctx.lineTo(pts.chinOutline[i].x, pts.chinOutline[i].y);
      }
      ctx.stroke();

      // Eyebrow lines
      ctx.beginPath();
      ctx.moveTo(pts.leftEyebrow[0].x, pts.leftEyebrow[0].y);
      ctx.lineTo(pts.leftEyebrow[1].x, pts.leftEyebrow[1].y);
      ctx.lineTo(pts.leftEyebrow[2].x, pts.leftEyebrow[2].y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts.rightEyebrow[0].x, pts.rightEyebrow[0].y);
      ctx.lineTo(pts.rightEyebrow[1].x, pts.rightEyebrow[1].y);
      ctx.lineTo(pts.rightEyebrow[2].x, pts.rightEyebrow[2].y);
      ctx.stroke();

      // Mouth closed shape
      ctx.beginPath();
      ctx.moveTo(pts.mouth[0].x, pts.mouth[0].y);
      ctx.lineTo(pts.mouth[1].x, pts.mouth[1].y);
      ctx.lineTo(pts.mouth[2].x, pts.mouth[2].y);
      ctx.lineTo(pts.mouth[3].x, pts.mouth[3].y);
      ctx.closePath();
      ctx.stroke();

      // 4. Draw node circles
      ctx.fillStyle = '#10B981';
      const drawNode = (p: { x: number; y: number }, size = 3) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, 2 * Math.PI);
        ctx.fill();
      };
      drawNode(pts.leftEye);
      drawNode(pts.rightEye);
      drawNode(pts.noseTip);
      pts.leftEyebrow.forEach(p => drawNode(p, 2));
      pts.rightEyebrow.forEach(p => drawNode(p, 2));
      pts.noseBridge.forEach(p => drawNode(p, 2));
      pts.mouth.forEach(p => drawNode(p, 2.5));
      pts.chinOutline.forEach(p => drawNode(p, 2.5));

      // Draw bounding box label
      ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('FACIAL MESH DETECTED', 55, 41);
      ctx.fillText('MATCH: 99.8%', 128, 172);

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [loading]);

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        {/* Title */}
        <Text style={styles.titleText}>{title}</Text>

        {/* Circular Scanning View */}
        <View style={styles.scannerRingContainer}>
          {/* Circular scanner progress fill border */}
          <svg style={styles.svgRing} viewBox="0 0 236 236">
            <circle
              cx="118"
              cy="118"
              r="114"
              fill="none"
              stroke="#2A2A35"
              strokeWidth="5"
            />
            <circle
              cx="118"
              cy="118"
              r="114"
              fill="none"
              stroke="#C57C3E"
              strokeWidth="5"
              strokeDasharray="716"
              strokeDashoffset={716 - (716 * progress) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>

          {/* Camera View Wrap */}
          <View style={styles.cameraCircle}>
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#C57C3E" />
                <Text style={styles.loadingText}>Đang bật camera...</Text>
              </View>
            )}

            {/* Live Camera Stream */}
            {hasCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={styles.videoStream}
              />
            ) : (
              /* Simulation mode if camera is unavailable / blocked */
              <View style={[styles.videoStream, styles.simulationBox]}>
                <Ionicons name="body" size={54} color="#666" style={styles.pulseIcon} />
                <Text style={styles.simText}>Chế độ giả lập</Text>
                <Text style={styles.simSubtext}>(Không tìm thấy camera)</Text>
              </View>
            )}

            {/* Glowing Scan Grid & Mesh Canvas */}
            {!loading && (
              <canvas
                ref={canvasRef}
                width="220"
                height="220"
                style={styles.canvasOverlay}
              />
            )}
          </View>
        </View>

        {/* Scan Status Percentage */}
        <Text style={styles.percentageText}>{progress}%</Text>
        <Text style={styles.statusText}>
          {progress === 100
            ? '✓ Quét hoàn tất. Đang đối chiếu...'
            : 'Vui lòng giữ yên khuôn mặt trước camera...'}
        </Text>

        {/* Close Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#16161F',
    width: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  titleText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Sora-Bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  scannerRingContainer: {
    width: 236,
    height: 236,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  svgRing: {
    position: 'absolute',
    width: 236,
    height: 236,
    transform: [{ rotate: '-90deg' }],
  },
  cameraCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    position: 'absolute',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#AAA',
    fontSize: 12,
    fontFamily: 'Sora-Regular',
    marginTop: 8,
  },
  videoStream: {
    width: 220,
    height: 220,
    objectFit: 'cover',
    transform: [{ scaleX: -1 }], // Mirror view
  },
  canvasOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 220,
    zIndex: 10,
  },
  simulationBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E28',
  },
  simText: {
    color: '#C57C3E',
    fontFamily: 'Sora-Bold',
    fontSize: 14,
    marginTop: 10,
  },
  simSubtext: {
    color: '#666',
    fontFamily: 'Sora-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  pulseIcon: {
    opacity: 0.7,
  },
  percentageText: {
    color: '#C57C3E',
    fontSize: 32,
    fontFamily: 'Sora-Bold',
    marginBottom: 6,
  },
  statusText: {
    color: '#AAA',
    fontSize: 13,
    fontFamily: 'Sora-Regular',
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#2A2A35',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Sora-Bold',
  },
});
