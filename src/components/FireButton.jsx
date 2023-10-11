import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';

const FireButton = ({onPress, onPressOut, onPressIn, isFiring}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      // disabled={isFiring ? true : false}
    >
      <Text style={styles.text}>FIRE</Text>
    </TouchableOpacity>
  );
};

export default FireButton;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    width: 300,
    borderRadius: 200,
    opacity: 0.9,
    backgroundColor: '#D43A35',
    elevation: 2,
    shadowOffset: {height: 0, width: 0},
    shadowColor: 'black',
    shadowOpacity: 1,
    shadowRadius: 50,
  },
  text: {
    fontSize: 60,
    fontWeight: '800',
    color: 'black',
  },
});
