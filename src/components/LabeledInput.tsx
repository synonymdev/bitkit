import React, { ReactElement, RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { TextInput, BottomSheetTextInput } from '../styles/components';
import { Caption13Up } from '../styles/text';

type LabeledInputProps = {
	label: string;
	children?: JSX.Element | JSX.Element[];
	ref?: RefObject<any>;
	autoFocus?: boolean;
	multiline?: boolean;
	value?: string;
	returnKeyType?: 'default' | 'next' | 'done';
	bottomSheet?: boolean;
	placeholder?: string;
	style?: StyleProp<ViewStyle>;
	onChange?: (value: string) => void;
	maxLength?: number;
	testID?: string;
};

const LabeledInput = ({
	label,
	children,
	ref,
	autoFocus,
	multiline,
	value,
	returnKeyType = 'done',
	onChange,
	bottomSheet,
	placeholder,
	style,
	maxLength,
	testID,
}: LabeledInputProps): ReactElement => {
	const numberOfChildren = React.Children.toArray(children).length;

	const textInputStyle =
		numberOfChildren > 0 ? { paddingRight: 60 * numberOfChildren } : {};

	return (
		<View style={style}>
			<Caption13Up color="gray1" style={styles.label}>
				{label}
			</Caption13Up>
			<View style={onChange ? styles.inputContainer : styles.readOnlyInput}>
				{bottomSheet ? (
					<BottomSheetTextInput
						style={textInputStyle}
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
						returnKeyType={returnKeyType}
						testID={testID}
					/>
				) : (
					<TextInput
						style={textInputStyle}
						defaultValue={value}
						color="white"
						autoCapitalize="none"
						autoCorrect={false}
						autoFocus={autoFocus}
						placeholder={placeholder}
						minHeight={multiline ? 72 : 52}
						onChangeText={onChange}
						multiline={multiline || false}
						editable={!!onChange}
						returnKeyType={returnKeyType}
						maxLength={maxLength}
						testID={testID}
					/>
				)}
				{children && (
					<View style={styles.inputActions}>
						{React.Children.map(children, (child) => {
							return React.cloneElement(child, {
								style: {
									...styles.inputAction,
									...child.props.style,
								},
							});
						})}
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
