import React, { ReactElement, ReactNode } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from 'react-native';
import {
	MinusCircledIcon,
	PlusCircledIcon,
	Text01M,
	Text02M,
} from '../styles/components';

type AdjustValueProps = {
	value: ReactNode;
	description?: ReactNode;
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
		<View style={[styles.root, style]}>
			<TouchableOpacity
				style={styles.icon}
				disabled={decreaseDisabled}
				onPress={decreaseValue}>
				<MinusCircledIcon
					color={decreaseDisabled ? 'gray' : 'red'}
					width={36}
					height={36}
				/>
			</TouchableOpacity>
			<View style={styles.text}>
				<Text01M style={styles.title}>{value}</Text01M>
				{description && (
					<Text02M style={styles.description} color="gray1">
						{description}
					</Text02M>
				)}
			</View>
			<TouchableOpacity
				style={styles.icon}
				disabled={increaseDisabled}
				onPress={increaseValue}>
				<PlusCircledIcon
					color={increaseDisabled ? 'gray' : 'green'}
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
