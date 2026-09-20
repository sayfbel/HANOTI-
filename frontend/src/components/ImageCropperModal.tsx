import React, { useState, useRef, useEffect } from 'react';
import { Modal, StyleSheet, View, Text, Pressable, Dimensions, Image as RNImage, ActivityIndicator, PanResponder, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImageCropperModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onConfirm: (croppedUri: string) => void;
}

const { width } = Dimensions.get('window');
const SIZE = width * 0.8; // The size of the crop circle
const BORDER_WIDTH = width; // Large enough to cover the rest of the screen

export function ImageCropperModal({ visible, imageUri, onClose, onConfirm }: ImageCropperModalProps) {
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [imageLayout, setImageLayout] = useState<{ width: number, height: number, originalW: number, originalH: number } | null>(null);
  
  // Pan state
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (imageUri) {
      RNImage.getSize(imageUri, (w, h) => {
        // Calculate dimensions to cover the SIZE x SIZE circle
        let imgWidth = SIZE;
        let imgHeight = SIZE;
        
        const aspect = w / h;
        if (aspect > 1) {
          // Landscape
          imgWidth = SIZE * aspect;
          imgHeight = SIZE;
        } else {
          // Portrait
          imgWidth = SIZE;
          imgHeight = SIZE / aspect;
        }
        
        setImageLayout({ width: imgWidth, height: imgHeight, originalW: w, originalH: h });
      }, (err) => console.error("Failed to get image size", err));
    }
  }, [imageUri]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 1));
  const handleReset = () => {
    setScale(1);
    pan.setValue({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!imageUri || !imageLayout) return;
    setProcessing(true);
    
    try {
      const { originalW: imgW, originalH: imgH, width: layoutW, height: layoutH } = imageLayout;
      
      // Calculate crop dimensions
      // The circle size in the original image coordinates
      const cropSize = (imgW / layoutW) * SIZE / scale;
      
      const panX = (pan.x as any)._value;
      const panY = (pan.y as any)._value;
      
      const ratio = imgW / (layoutW * scale);
      
      // Base origin (centered)
      let originX = (imgW - cropSize) / 2;
      let originY = (imgH - cropSize) / 2;
      
      // Apply pan offsets
      originX -= panX * ratio;
      originY -= panY * ratio;
      
      // Clamp to image bounds
      originX = Math.max(0, Math.min(originX, imgW - cropSize));
      originY = Math.max(0, Math.min(originY, imgH - cropSize));

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { 
            crop: { 
              originX, 
              originY, 
              width: cropSize, 
              height: cropSize 
            } 
          },
          { resize: { width: 500, height: 500 } }
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      onConfirm(result.uri);
    } catch (error) {
      console.error("Cropping failed:", error);
      onConfirm(imageUri);
    } finally {
      setProcessing(false);
    }
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <Feather name="chevron-left" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Preview</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* We make the image container large to allow panning */}
          <View style={styles.imageWrapper}>
            <Animated.View 
              {...panResponder.panHandlers}
              style={[
                styles.imageContainer,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale }
                  ]
                }
              ]}
            >
              <RNImage 
                source={{ uri: imageUri }} 
                style={imageLayout ? { width: imageLayout.width, height: imageLayout.height } : { width: SIZE, height: SIZE }} 
                resizeMode="cover"
              />
            </Animated.View>
          </View>
          
          {/* The circular overlay to simulate cropping mask */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.mask} />
          </View>

          <View style={styles.controls}>
            <View style={styles.zoomControls}>
              <Pressable onPress={handleZoomOut} style={styles.zoomBtn}>
                <Feather name="minus" size={20} color="#000" />
              </Pressable>
              <Pressable onPress={handleZoomIn} style={styles.zoomBtn}>
                <Feather name="plus" size={20} color="#000" />
              </Pressable>
              <Pressable onPress={handleReset} style={styles.resetBtn}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.selectBtn} onPress={onClose}>
            <Text style={styles.selectText}>Select another photo</Text>
          </Pressable>
          <Pressable 
            style={[styles.confirmBtn, processing && { opacity: 0.7 }]} 
            onPress={handleConfirm}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmText}>Confirm</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  iconBtn: {
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: width,
    height: width, // Square area for panning
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mask: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SIZE + 2 * BORDER_WIDTH,
    height: SIZE + 2 * BORDER_WIDTH,
    borderRadius: (SIZE + 2 * BORDER_WIDTH) / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#F9F9F9',
    marginTop: -(SIZE / 2 + BORDER_WIDTH),
    marginLeft: -(SIZE / 2 + BORDER_WIDTH),
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomBtn: {
    padding: 12,
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  resetText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#000',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 10,
  },
  selectBtn: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  selectText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  confirmText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFF',
  },
});
