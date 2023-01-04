import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { View as ThemedView } from '../../../styles/components';
import { Text01S, Text01M, Text02S } from '../../../styles/text';
import Button from '../../../components/Button';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import type { BackupScreenProps } from '../../../navigation/types';

const ShowPassphrase = ({
	navigation,
	route,
}: BackupScreenProps<'ShowPassphrase'>): ReactElement => {
	const { bip39Passphrase, seed } = route.params;
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
			<BottomSheetNavigationHeader title="Your Passphrase" />
			<View style={styles.container}>
				<Text01S color="gray1">
					You added a passphrase to your recovery phrase during wallet setup.
				</Text01S>

				<ThemedView color="gray324" style={styles.passphrase}>
					<BottomSheetScrollView>
						<Text01M color="white5" style={styles.p}>
							passphrase
						</Text01M>
						<Text01M>{bip39Passphrase}</Text01M>
					</BottomSheetScrollView>
				</ThemedView>

				<Text02S color="gray1">
					<Text02S color="brand">Never share</Text02S> your passphrase with
					anyone as this may result in the loss of funds.
				</Text02S>

				<View style={nextButtonContainer}>
					<Button
						size="large"
						text="Continue"
						onPress={(): void =>
							navigation.navigate('ConfirmMnemonic', { seed, bip39Passphrase })
						}
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
	passphrase: {
		marginVertical: 32,
		padding: 32,
		borderRadius: 16,
		flex: 1,
	},
	p: {
		marginBottom: 8,
	},
	nextButtonContainer: {
		marginTop: 22,
		width: '100%',
	},
});

export default memo(ShowPassphrase);
