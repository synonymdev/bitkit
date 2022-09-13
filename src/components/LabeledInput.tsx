import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import {
	Caption13Up,
	TextInput,
	View,
	BottomSheetTextInput,
} from '../styles/components';

export const Input = ({
	label,
	multiline,
	value,
	onChange,
	rightIcon,
	onRightIconPress,
	bottomSheet,
	placeholder,
	ref,
}: {
	label: string;
	multiline?: boolean;
	value?: string;
	onChange?: (value: string) => void;
	rightIcon?: ReactElement;
	onRightIconPress?: () => void;
	bottomSheet?: boolean;
	placeholder?: string;
	ref?;
}): JSX.Element => {
	return (
		<View style={styles.inputContainer}>
			<Caption13Up color="gray1" style={styles.label}>
				{label}
			</Caption13Up>
			<View
				style={
					onChange
						? multiline
							? StyleSheet.compose<{}>(styles.input, styles.multiline)
							: styles.input
						: styles.readOnlyInput
				}>
				{bottomSheet ? (
					<BottomSheetTextInput
						ref={ref}
						style={styles.inputText}
						defaultValue={value}
						color="white"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder={placeholder}
						onChangeText={onChange}
						multiline={multiline || false}
						editable={!!onChange}
						returnKeyType="done"
					/>
				) : (
					<TextInput
						style={styles.inputText}
						defaultValue={value}
						color="white"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder={placeholder}
						onChangeText={onChange}
						multiline={multiline || false}
						editable={!!onChange}
						returnKeyType="done"
					/>
				)}
				{rightIcon && onRightIconPress ? (
					<TouchableOpacity style={styles.rightIcon} onPress={onRightIconPress}>
						{rightIcon}
					</TouchableOpacity>
				) : (
					<View style={styles.rightIcon}>{rightIcon}</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	input: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		fontSize: 17,
		paddingHorizontal: 16,
		height: 56,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.03)',
	},
	multiline: {
		height: 96,
		flexDirection: 'column',
		alignItems: 'baseline',
	},
	readOnlyInput: {
		borderRadius: 8,
		paddingTop: 8,
		paddingBottom: 32,
		borderBottomWidth: 2,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	label: {
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		textTransform: 'uppercase',
		marginBottom: 8,
	},
	inputContainer: {
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	inputText: {
		color: 'white',
		backgroundColor: 'transparent',
		flex: 1,
		fontSize: 15,
		fontWeight: '600',
	},
	rightIcon: {
		backgroundColor: 'transparent',
		marginLeft: 16,
	},
});

export default Input;
