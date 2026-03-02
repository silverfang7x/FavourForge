import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { App as RootApp } from './src/app/App';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <RootApp />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
