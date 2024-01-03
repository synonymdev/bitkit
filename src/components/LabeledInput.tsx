import React, { ReactElement, RefObject } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { TextInput, BottomSheetTextInput } from '../styles/components';
import { Caption13Up, Text02S } from '../styles/text';
import { IThemeColors } from '../styles/themes';

type LabeledInputProps = {
	label: string;
	error?: string;
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
	color?: keyof IThemeColors;
};

const LabeledInput = ({
	label,
	error,
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
	color = 'white',
}: LabeledInputProps): ReactElement => {
	const numberOfChildren = React.Children.toArray(children).length;

	const textInputStyle =
		numberOfChildren > 0 ? { paddingRight: 60 * numberOfChildren } : {};

	return (
		<View style={style}>
			<View style={styles.header}>
				<Caption13Up style={styles.label} color="gray1">
					{label}
				</Caption13Up>
				{error && (
					<Text02S
						color="brand"
						style={styles.error}
						testID={testID ? testID + '-error' : undefined}>
						{error}
					</Text02S>
				)}
			</View>
			<View style={onChange ? styles.inputContainer : styles.readOnlyInput}>
				{bottomSheet ? (
					<BottomSheetTextInput
						style={textInputStyle}
						ref={ref}
						defaultValue={value}
						backgroundColor="white10"
						autoCapitalize="none"
						autoCorrect={false}
						placeholder={placeholder}
						minHeight={multiline ? 72 : 52}
						onChangeText={onChange}
						multiline={multiline || false}
						editable={!!onChange}
						returnKeyType={returnKeyType}
						testID={testID}
						color={color}
					/>
				) : (
					<TextInput
						style={textInputStyle}
						defaultValue={value}
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
						color={color}
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
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexWrap: 'wrap',
		marginBottom: 8,
	},
	label: {
		marginRight: 8,
	},
	error: {
		marginVertical: -1,
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
