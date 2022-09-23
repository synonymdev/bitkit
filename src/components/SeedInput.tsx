import React, { forwardRef } from 'react';
import { StyleSheet, View, TextInputProps } from 'react-native';
import { Text01S, TextInput } from '../styles/components';

type SeedInputProps = TextInputProps & { index: number; valid: boolean };

const SeedInput = forwardRef(
	({ index, valid, ...props }: SeedInputProps, ref) => {
		return (
			<View style={styles.inputWrapper}>
				<TextInput
					ref={ref}
					style={styles.input}
					color={valid ? 'white' : 'red'}
					autoCapitalize="none"
					autoCorrect={false}
					returnKeyType="done"
					{...props}
				/>
				<View style={styles.index}>
					<Text01S color={valid ? 'white5' : 'red'} style={styles.indexText}>
						{index + 1}.
					</Text01S>
				</View>
			</View>
		);
	},
);

const styles = StyleSheet.create({
	inputWrapper: {
		position: 'relative',
		marginHorizontal: 2,
		marginBottom: 5,
		minWidth: 100,
		justifyContent: 'center',
	},
	input: {
		paddingLeft: 45,
		paddingRight: 6,
		borderRadius: 8,
		fontSize: 17,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	index: {
		position: 'absolute',
		top: 0,
		left: 16,
		bottom: 0,
		width: 30,
		justifyContent: 'center',
	},
	indexText: {
		justifyContent: 'center',
		fontWeight: 'bold',
	},
});

export default SeedInput;
