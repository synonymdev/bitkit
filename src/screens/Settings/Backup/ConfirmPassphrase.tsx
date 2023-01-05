import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetTextInput } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import Button from '../../../components/Button';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import type { BackupScreenProps } from '../../../navigation/types';

const ConfirmPassphrase = ({
	navigation,
	route,
}: BackupScreenProps<'ConfirmPassphrase'>): ReactElement => {
	const { bip39Passphrase: origPass } = route.params;
	const [bip39Passphrase, setPassphrase] = useState<string>('');

	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('backupNavigation');

	return (
		<GradientView style={styles.gradient}>
			<BottomSheetNavigationHeader title="Confirm Passphrase" />
			<View style={styles.container}>
				<Text01S color="gray1">
					Enter the passphrase you added while setting up and creating your
					wallet.
				</Text01S>

				<View style={styles.input}>
					<BottomSheetTextInput
						value={bip39Passphrase}
						placeholder="Passphrase"
						returnKeyType="done"
						onChangeText={setPassphrase}
						autoCapitalize="none"
						// @ts-ignore autoCompleteType -> autoComplete in newer version
						autoCompleteType="off"
						autoCorrect={false}
					/>
				</View>

				<View style={nextButtonContainer}>
					<Button
						disabled={bip39Passphrase !== origPass}
						size="large"
						text="Continue"
						onPress={(): void => navigation.navigate('Result')}
					/>
				</View>
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingHorizontal: 32,
	},
	input: {
		marginTop: 32,
		flex: 1,
	},
	nextButtonContainer: {
		marginTop: 22,
		width: '100%',
	},
});

export default memo(ConfirmPassphrase);
