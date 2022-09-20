import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
	Caption13Up,
	TextInput,
	BottomSheetTextInput,
} from '../styles/components';

type LabeledInputProps = {
	label: string;
	children?: JSX.Element | JSX.Element[];
	ref?;
	multiline?: boolean;
	value?: string;
	bottomSheet?: boolean;
	placeholder?: string;
	style?: StyleProp<ViewStyle>;
	onChange?: (value: string) => void;
};

const LabeledInput = ({
	label,
	children,
	ref,
	multiline,
	value,
	onChange,
	bottomSheet,
	placeholder,
	style,
}: LabeledInputProps): JSX.Element => {
	const numberOfChildren = React.Children.toArray(children).length;

	return (
		<View style={style}>
			<Caption13Up color="gray1" style={styles.label}>
				{label}
			</Caption13Up>
			<View style={onChange ? styles.inputContainer : styles.readOnlyInput}>
				{bottomSheet ? (
					<BottomSheetTextInput
						style={{ paddingRight: 60 * numberOfChildren }}
						ref={ref}
						defaultValue={value}
						backgroundColor="white08"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder={placeholder}
						minHeight={multiline ? 72 : 52}
						onChangeText={onChange}
						multiline={multiline || false}
						editable={!!onChange}
						returnKeyType="done"
					/>
				) : (
					<TextInput
						style={{ paddingRight: 60 * numberOfChildren }}
						defaultValue={value}
						color="white"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder={placeholder}
						minHeight={multiline ? 72 : 52}
						onChangeText={onChange}
						multiline={multiline || false}
						editable={!!onChange}
						returnKeyType="done"
					/>
				)}
				{children && (
					<View style={styles.inputActions}>
						{React.Children.map(children, (child) =>
							React.cloneElement(child, {
								style: {
									...styles.inputAction,
									...child.props.style,
								},
							}),
						)}
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	label: {
		marginBottom: 8,
	},
	inputContainer: {
		position: 'relative',
	},
	readOnlyInput: {
		paddingTop: 8,
		paddingBottom: 32,
		borderBottomWidth: 2,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	inputActions: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		right: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	inputAction: {
		paddingHorizontal: 8,
	},
});

export default LabeledInput;
