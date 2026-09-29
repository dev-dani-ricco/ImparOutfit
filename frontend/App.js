import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { DemoProvider } from './src/contexts/DemoContext';
import { ConnectedDataProvider } from './src/contexts/ConnectedDataContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <ConnectedDataProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ConnectedDataProvider>
      </DemoProvider>
    </AuthProvider>
  );
}
