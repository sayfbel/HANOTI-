import { useRouter } from 'expo-router';
import { StyleSheet, Pressable, View, Image, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

// Shopkeeper images
const shopkeeperImages = [
  require('../../assets/images/shopkeeper_1.png'),
  require('../../assets/images/shopkeeper_2.png'),
  require('../../assets/images/shopkeeper_3.png'),
  require('../../assets/images/shopkeeper_4.png'),
  require('../../assets/images/shopkeeper_5.png'),
  require('../../assets/images/shopkeeper_6.png'),
];

// Height ratios for each tile in each column
const COLUMN_CONFIGS = [
  // Column 0
  { offsetRatio: -0.05, tiles: [
    { imageIndex: 0, heightRatio: 0.26 },
    { imageIndex: 3, heightRatio: 0.22 },
    { imageIndex: 1, heightRatio: 0.26 },
    { imageIndex: 4, heightRatio: 0.28 },
  ]},
  // Column 1
  { offsetRatio: -0.10, tiles: [
    { imageIndex: 4, heightRatio: 0.22 },
    { imageIndex: 1, heightRatio: 0.30 },
    { imageIndex: 5, heightRatio: 0.26 },
    { imageIndex: 2, heightRatio: 0.26 },
  ]},
  // Column 2
  { offsetRatio: -0.02, tiles: [
    { imageIndex: 3, heightRatio: 0.28 },
    { imageIndex: 2, heightRatio: 0.24 },
    { imageIndex: 0, heightRatio: 0.28 },
    { imageIndex: 5, heightRatio: 0.26 },
  ]},
  // Column 3
  { offsetRatio: -0.07, tiles: [
    { imageIndex: 5, heightRatio: 0.24 },
    { imageIndex: 0, heightRatio: 0.26 },
    { imageIndex: 3, heightRatio: 0.24 },
    { imageIndex: 1, heightRatio: 0.28 },
  ]},
];

const GRID_GAP = 6;
const NUM_COLUMNS = 4;
const TILE_BORDER_RADIUS = 12;

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, isLoading } = useAuth();
  const { width: windowW, height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive breakpoints
  const isSmallHeight = windowH <= 680; // iPhone SE, smaller Androids
  const isWideWeb = Platform.OS === 'web' && windowW >= 560;

  // Max width of the phone app frame (centered on desktop web)
  const appWidth = isWideWeb ? Math.min(windowW, 440) : windowW;
  const appHeight = windowH;

  // Dynamically compute column width strictly within appWidth
  const columnWidth = useMemo(
    () => (appWidth - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS,
    [appWidth]
  );

  const columns = useMemo(() => {
    const baseHeight = Math.min(appHeight, 780);
    return COLUMN_CONFIGS.map((col) => ({
      offset: col.offsetRatio * baseHeight,
      tiles: col.tiles.map((tile) => ({
        imageIndex: tile.imageIndex,
        height: tile.heightRatio * baseHeight,
      })),
    }));
  }, [appHeight]);

  const logoWidth = isSmallHeight ? Math.min(appWidth * 0.54, 210) : Math.min(appWidth * 0.62, 250);
  const logoHeight = logoWidth * 0.48;

  return (
    <View style={styles.rootContainer}>
      {/* Centered App Container */}
      <View
        style={[
          styles.appContainer,
          {
            width: appWidth,
            height: appHeight,
            ...(isWideWeb ? styles.desktopFrameShadow : {}),
          },
        ]}
      >
        {/* 1. Photo Mosaic Grid Background */}
        <View style={styles.mosaicContainer}>
          {columns.map((column, colIndex) => (
            <View
              key={colIndex}
              style={{
                position: 'absolute',
                left: GRID_GAP + colIndex * (columnWidth + GRID_GAP),
                top: column.offset,
                width: columnWidth,
              }}
            >
              {column.tiles.map((tile, tileIndex) => (
                <View
                  key={tileIndex}
                  style={{
                    height: tile.height,
                    borderRadius: TILE_BORDER_RADIUS,
                    marginBottom: GRID_GAP,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={shopkeeperImages[tile.imageIndex]}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: TILE_BORDER_RADIUS,
                    }}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* 2. Seamless Cinematic Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(6, 19, 52, 0.15)',
            'rgba(6, 19, 52, 0.45)',
            'rgba(6, 19, 52, 0.82)',
            'rgba(6, 19, 52, 0.96)',
            '#061334',
          ]}
          locations={[0, 0.32, 0.56, 0.74, 0.95]}
          style={StyleSheet.absoluteFill}
        />

        {/* 3. Foreground Content Layer */}
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.content,
              {
                paddingHorizontal: isSmallHeight ? 20 : 26,
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, isSmallHeight ? 16 : 24),
              },
            ]}
          >
            {/* Center: Frosted Glass Logo Badge (No sharp rectangular lines) */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoBadgeContainer, { paddingHorizontal: isSmallHeight ? 18 : 24 }]}>
                <Image
                  source={require('../../assets/logo/LOGO_PNG.png')}
                  style={{
                    width: logoWidth,
                    height: logoHeight,
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Bottom: Slogan + CTA Button */}
            <View style={[styles.bottomSection, { gap: isSmallHeight ? 16 : 22 }]}>
              {/* Slogan text */}
              {language === 'ar' ? (
                <View style={styles.sloganContainer}>
                  <ThemedText
                    style={[
                      styles.sloganText,
                      {
                        fontSize: isSmallHeight ? 22 : 26,
                        lineHeight: isSmallHeight ? 34 : 40,
                      },
                    ]}
                  >
                    كناشك فتيليفونك،
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.sloganText,
                      {
                        fontSize: isSmallHeight ? 22 : 26,
                        lineHeight: isSmallHeight ? 34 : 40,
                      },
                    ]}
                  >
                    وحسابك <ThemedText style={[styles.highlightText, { fontSize: isSmallHeight ? 22 : 26 }]}>ديما</ThemedText> مضمون.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.sloganContainer}>
                  <ThemedText
                    style={[
                      styles.sloganText,
                      {
                        fontSize: isSmallHeight ? 18 : 21,
                        lineHeight: isSmallHeight ? 26 : 30,
                      },
                    ]}
                  >
                    {t('index.slogan')}
                  </ThemedText>
                </View>
              )}

              {/* CTA Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.buttonTouchable,
                  {
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                onPress={() => router.replace('/login')}
              >
                <LinearGradient
                  colors={['#00A896', '#0A2E6E', '#06163A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.buttonGradient,
                    { paddingVertical: isSmallHeight ? 13 : 16 },
                  ]}
                >
                  {language === 'ar' ? (
                    <ThemedText style={styles.buttonTextContainer}>
                      <ThemedText style={[styles.btnGoldText, { fontSize: isSmallHeight ? 23 : 26 }]}>
                        بـــدا{' '}
                      </ThemedText>
                      <ThemedText style={[styles.btnCyanText, { fontSize: isSmallHeight ? 23 : 26 }]}>
                        دابـــا
                      </ThemedText>
                    </ThemedText>
                  ) : (
                    <ThemedText
                      style={[
                        styles.buttonText,
                        { fontSize: isSmallHeight ? 17 : 19 },
                      ]}
                    >
                      {t('index.getStarted')}
                    </ThemedText>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#040915',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#061334',
  },
  desktopFrameShadow: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 20,
  },

  // ─── Mosaic Grid ───
  mosaicContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },

  // ─── Content ───
  safeArea: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // ─── Logo ───
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 19, 52, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
  },

  // ─── Bottom Section ───
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  sloganContainer: {
    alignItems: 'center',
  },
  sloganText: {
    color: '#FFFFFF',
    fontFamily: 'Thmanyah-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  highlightText: {
    color: '#EEA73C',
    fontFamily: 'Thmanyah-Bold',
  },

  // ─── Button ───
  buttonTouchable: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 200, 200, 0.45)',
    shadowColor: '#00A896',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonGradient: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonTextContainer: {
    textAlign: 'center',
  },
  btnGoldText: {
    color: '#EEA73C',
    fontFamily: 'Thmanyah-Bold',
  },
  btnCyanText: {
    color: '#80E8F5',
    fontFamily: 'Thmanyah-Bold',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Thmanyah-Bold',
  },
});
