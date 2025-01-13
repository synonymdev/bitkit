import React, { ReactElement, ReactNode } from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';
import { MinusCircledIcon, PlusCircledIcon } from '../styles/icons';
import { BodyMSB, BodySSB } from '../styles/text';

type AdjustValueProps = {
	value: ReactNode;
	description: ReactNode;
	decreaseValue: () => void;
	increaseValue: () => void;
	decreaseDisabled?: boolean;
	increaseDisabled?: boolean;
	style?: StyleProp<ViewStyle>;
};

const AdjustValue = ({
	value,
	description,
	decreaseValue,
	increaseValue,
	decreaseDisabled = false,
	increaseDisabled = false,
	style,
}: AdjustValueProps): ReactElement => {
	return (
		<View style={[styles.root, style]} testID="AdjustValue">
			<TouchableOpacity
				style={styles.icon}
				activeOpacity={0.9}
				disabled={decreaseDisabled}
				onPress={decreaseValue}
				testID="Minus">
				<MinusCircledIcon
					color={decreaseDisabled ? 'gray2' : 'red'}
					width={36}
					height={36}
				/>
			</TouchableOpacity>
			<View style={styles.text}>
				<BodyMSB style={styles.title}>{value}</BodyMSB>
				<BodySSB style={styles.description} color="secondary">
					{description}
				</BodySSB>
			</View>
			<TouchableOpacity
				style={styles.icon}
				activeOpacity={0.9}
				disabled={increaseDisabled}
				onPress={increaseValue}
				testID="Plus">
				<PlusCircledIcon
					color={increaseDisabled ? 'gray2' : 'green'}
					width={36}
					height={36}
				/>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	text: {
		alignItems: 'center',
		flex: 1.5,
	},
	icon: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		textAlign: 'center',
	},
	description: {
		textAlign: 'center',
		marginTop: 2,
	},
});

export default AdjustValue;
