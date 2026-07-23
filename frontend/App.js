import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { DemoProvider } from './src/contexts/DemoContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </DemoProvider>
    </AuthProvider>
  );
}
