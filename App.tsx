import { useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { VideoSplashScreen } from './src/components/VideoSplashScreen';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <AppErrorBoundary>
        <VideoSplashScreen onFinish={() => setShowSplash(false)} />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppNavigator />
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
