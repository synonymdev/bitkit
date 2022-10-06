import React, { PropsWithChildren, ReactElement } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { View } from '../styles/components';

interface DividerProps extends PropsWithChildren<any> {
	style?: StyleProp<ViewStyle>;
}

const Divider = ({ style }: DividerProps): ReactElement => {
	return <View color="white1" style={[styles.root, style]} />;
};

const styles = StyleSheet.create({
	root: {
		height: 1,
		marginTop: 16,
		marginBottom: 16,
	},
});

export default Divider;
