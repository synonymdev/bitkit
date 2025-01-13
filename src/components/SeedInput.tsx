import React, { forwardRef } from 'react';
import { StyleSheet, TextInputProps } from 'react-native';
import { TextInput, View as ThemedView } from '../styles/components';
import { BodyMSB } from '../styles/text';

type SeedInputProps = TextInputProps & { index: number; valid?: boolean };

const SeedInput = forwardRef<any, SeedInputProps>(
	({ index, valid, ...props }: SeedInputProps, ref) => {
		return (
			<ThemedView style={styles.inputWrapper} color="white10">
				<BodyMSB
					color={valid ? 'secondary' : 'red'}
					testID={`WordIndex-${index}`}>
					{index + 1}.
				</BodyMSB>
				<TextInput
					ref={ref}
					style={styles.input}
					backgroundColor="transparent"
					color={valid ? 'white' : 'red'}
					autoCapitalize="none"
					autoCorrect={false}
					returnKeyType="done"
					testID={`Word-${index}`}
					{...props}
				/>
			</ThemedView>
		);
	},
);

const styles = StyleSheet.create({
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		borderRadius: 8,
		marginBottom: 4,
		paddingLeft: 16,
		height: 47,
	},
	input: {
		flex: 1,
		minHeight: 0,
		fontSize: 17,
		fontWeight: '400',
		letterSpacing: 0.4,
		paddingLeft: 0,
		paddingTop: 0,
		paddingBottom: 0,
	},
});

export default SeedInput;
