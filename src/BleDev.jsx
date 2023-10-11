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
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Button,
  FlatList,
  Alert,
  NativeModules,
  NativeEventEmitter,
  ImageBackground,
  Image,
} from 'react-native';
import {Buffer} from 'buffer';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import BleManager from 'react-native-ble-manager';
import {bytesToString} from 'convert-string';
import FireButton from './components/FireButton';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BleDev = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.light,
  };

  const peripherals = new Map();
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFired, setIsFired] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [peripheralServices, setPeripheralServices] = useState('');

  const handleGetConnectedDevices = async () => {
    await BleManager.getConnectedPeripherals([]).then(results => {
      if (results.length === 0) {
        console.log('No connected bluetooth devices');
      }
    });
  };

  useEffect(() => {
    BleManager.start({showAlert: true}).then(() => {
      console.log('BleManager initialized');
      handleGetDiscoveredDevices();
    });

    // const esp32Peripheral = '43a617cc-9c0e-0681-d3be-b2041205e17e';
    handleBleScan();
    let stopDiscoverListener = BleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        console.log('Peripheral disover: ', peripheral);
        // if (peripheral.id === esp32Peripheral) {
        //   connectToPeripheral(peripheral);
        //   setDiscoveredDevices(Array.from(peripherals.values()));
        // }
        peripherals.set(peripheral.id, peripheral);
        setDiscoveredDevices(Array.from(peripherals.values()));
      },
    );
    let stopConnectListener = BleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      peripheral => {
        console.log('BleManagerConnectPeripheral:', peripheral);
      },
    );
    const disconnectPeripheralListener = BleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      disconnectFromPeripheral,
    );
    let stopScanListener = BleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('Scan is stopped');
      },
    );

    const noticationListener = ({
      value,
      peripheral,
      characteristic,
      service,
    }) => {
      const data = Buffer.from(value).toString('hex');
      console.log(`Received ${data} for characteristic ${characteristic}`);
      setPeripheralServices(data);
    };
    BleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      noticationListener,
    );

    return () => {
      stopScanListener.remove();
      stopConnectListener.remove();
      stopDiscoverListener.remove();
      disconnectPeripheralListener.remove();
    };
  }, []);

  const handleBleScan = async () => {
    if (!isScanning) {
      await BleManager.scan([], 0.2, true)
        .then(() => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(() => {
          setIsScanning(false);
        });
    }
  };

  const connectToPeripheral = async peripheral => {
    console.log('Connect device: ', peripheral);
    await BleManager.connect(peripheral.id)
      .then(() => {
        peripheral.connected = true;
        peripherals.set(peripheral.id, {...peripheral});
        // setConnectedDevices(Array.from(peripherals.values() as any));
        setDiscoveredDevices(Array.from(peripherals.values()));
        setIsConnected(true);
        console.log('BLE device paired successfully');
      })
      .catch(() => {
        console.log('Failed to connect');
      });
  };

  const disconnectFromPeripheral = async peripheral => {
    console.log('Disconnect Pressed');
    await BleManager.disconnect(peripheral.id)
      .then(() => {
        peripheral.connected = false;
        peripherals.set(peripheral.id, {...peripheral});
        setDiscoveredDevices(Array.from(peripherals.values()));
        Alert.alert(`Disconnected from ${peripheral.name}`);
      })
      .catch(() => {
        console.log('Failed to disconnect');
      });
  };

  const handleGetDiscoveredDevices = async () => {
    const esp32Peripheral = '43a617cc-9c0e-0681-d3be-b2041205e17e';

    // try {
    //   await BleManager.getDiscoveredPeripherals().then(peripheral => {
    //     if (peripheral.id === esp32Peripheral) connectToPeripheral(peripheral);
    //   });
    // } catch (e) {
    //   console.log(e);
    // }
    // .then(results => {
    //   if (results.length === 0) {
    //     console.log('No devices were found.');
    //   } else {
    //     for (let i = 0; i < results.length; i++) {
    //       let peripheral = results[i];
    //       // peripheral.connected = true;
    //       peripherals.set(peripheral.id, peripheral);
    //       setDiscoveredDevices(Array.from(peripherals.values()));
    //     }
    //   }
    // });
  };

  const handleNotification = async (
    peripheralId,
    serviceId,
    characteristicId,
  ) => {
    try {
      await BleManager.startNotification(
        peripheralId,
        serviceId,
        characteristicId,
      );
    } catch (e) {
      console.log(e);
    }
  };

  const writeToPeripheral = async (peripheral, value) => {
    BleManager.retrieveServices(peripheral.id).then(async results => {
      const buffer = Buffer.from(value).toJSON().data;

      await BleManager.write(
        peripheral.id,
        results.characteristics[0].service,
        results.characteristics[0].characteristic,
        buffer,
      );

      handleNotification(
        peripheral.id,
        results.characteristics[0].service,
        results.characteristics[0].characteristic,
      );

      // await BleManager.startNotification(
      //   peripheral.id,
      //   results.characteristics[0].service,
      //   results.characteristics[0].characteristic,
      // );

      // const noticationListener = ({
      //   value,
      //   peripheral,
      //   characteristic,
      //   service,
      // }) => {
      //   // Convert bytes array to string (if needed)
      //   const data = Buffer.from(value).toString('hex');
      //   console.log(`Received ${data} for characteristic ${characteristic}`);
      //   setPeripheralServices(data);
      // };
      // BleManagerEmitter.addListener(
      //   'BleManagerDidUpdateValueForCharacteristic',
      //   noticationListener,
      // );
    });
  };

  const readFromPeripheral = async peripheral => {
    await BleManager.retrieveServices(peripheral.id)
      .then(async results => {
        const charResult1 = await BleManager.read(
          peripheral.id,
          results.characteristics[0].service,
          results.characteristics[0].characteristic,
        );

        const msgArray1 = Buffer.from(charResult1).toString('hex');

        setPeripheralServices(msgArray1);
      })
      .catch(err => console.log('Could not retrieve: ', err));
  };

  const RenderItem = ({peripheral}) => {
    const {name, rssi, id, connected} = peripheral;

    return (
      <>
        {name && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 10,
            }}>
            <View style={styles.deviceItem}>
              <Text style={styles.deviceName}>{name}</Text>
              <Text style={styles.deviceInfo}>RSSI: {rssi}</Text>
            </View>
            <TouchableOpacity
              onPress={async () => connected && writeToPeripheral(peripheral)}
              style={styles.connectButton}>
              <Text style={[styles.connectButtonText]}>
                {connected ? 'Write' : null}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => connected && readFromPeripheral(peripheral)}
              style={styles.connectButton}>
              <Text style={[styles.connectButtonText]}>
                {connected ? 'Retrieve' : null}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () =>
                connected
                  ? disconnectFromPeripheral(peripheral)
                  : connectToPeripheral(peripheral)
              }
              style={styles.connectButton}>
              <Text style={[styles.connectButtonText]}>
                {connected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  return (
    <ImageBackground
      style={styles.imgBackgroundContainer}
      source={require('./assets/img/background.png')}>
      <View style={styles.container}>
        {/* DEV STARTS HERE */}
        <View style={styles.topContainer}>
          {/* <Text style={styles.title}>CONTROLLER</Text> */}
          <View style={styles.buttonContainer}>
            <Button title="SCAN" onPress={handleBleScan} />
          </View>
        </View>

        <View style={{flex: 0.1}}>
          {discoveredDevices.length > 0 ? (
            <FlatList
              style={[backgroundStyle, styles.flatlist]}
              contentContainerStyle={styles.flatListContainer}
              data={discoveredDevices}
              renderItem={({item}) => <RenderItem peripheral={item} />}
              keyExtractor={item => item.id}
            />
          ) : (
            <Text style={{alignSelf: 'center'}}>No discovered devices</Text>
          )}
        </View>
        <Image
          style={styles.logo}
          source={require('./assets/img/gb-logo.png')}
        />
        <View style={styles.fireButtonContainer}>
          {isConnected ? (
            <FireButton
              onPressIn={() => {
                setIsFired(true);
                writeToPeripheral(discoveredDevices[0], 'in');
                setTimeout(() => {
                  setIsFired(false);
                  writeToPeripheral(discoveredDevices[0], 'out');
                }, 200);
              }}
              // onPressOut={() => {
              //   writeToPeripheral(discoveredDevices[0], 'out');
              // }}
              // onPress={() => {
              //   writeToPeripheral(discoveredDevices[0], 'in');
              //   writeToPeripheral(discoveredDevices[0], 'out');
              // }}
              isFiring={isFired}
            />
          ) : null}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = {
  container: {
    flex: 1,
    paddingTop: '15%',
  },
  imgBackgroundContainer: {
    flex: 1,
  },
  logo: {
    alignSelf: 'center',
  },
  topContainer: {
    alignItems: 'center',
    width: '100%',
    rowGap: 10,
  },
  title: {
    fontSize: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    rowGap: 10,
    width: '100%',
  },
  flatlist: {
    flex: 1,
  },
  flatListContainer: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  deviceName: {
    fontSize: 14,
  },
  connectButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'lightgreen',
  },
  connectButtonText: {
    fontSize: 12,
    color: 'black',
  },
  fireButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default BleDev;
