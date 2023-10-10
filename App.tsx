/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Button,
  FlatList,
  Alert,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {NavigationContainer} from '@react-navigation/native';
import BleDev from './src/BleDev';
import BleManager from 'react-native-ble-manager';
import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.light,
  };

  const checkBlePermissionStatus = async () => {
    const blePermissionStatus = await check(
      PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
    );

    console.log(blePermissionStatus);

    if (blePermissionStatus === RESULTS.DENIED || RESULTS.UNAVAILABLE) {
      request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
    }

    if (RESULTS.GRANTED) {
      console.log(RESULTS.GRANTED);
      return RESULTS.GRANTED;
    }
  };

  useEffect(() => {
    checkBlePermissionStatus();
  }, []);

  return (
    <NavigationContainer>
      <BleDev />
    </NavigationContainer>
  );
};

const $container: ViewStyle = {
  flex: 1,
};

export default App;
