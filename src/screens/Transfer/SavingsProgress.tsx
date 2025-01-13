import React, { ReactElement, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import HourglassSpinner from '../../components/HourglassSpinner';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useAppDispatch } from '../../hooks/redux';
import type { TransferScreenProps } from '../../navigation/types';
import { startCoopCloseTimer } from '../../store/slices/user';
import { View as ThemedView } from '../../styles/components';
import { BodyM, BodyMB, Display } from '../../styles/text';
import { sleep } from '../../utils/helpers';
import { closeChannels } from '../../utils/lightning';
import { refreshWallet } from '../../utils/wallet';

const SavingsProgress = ({
	navigation,
	route,
}: TransferScreenProps<'SavingsProgress'>): ReactElement => {
	const { channels } = route.params;
	const dispatch = useAppDispatch();
	const { t } = useTranslation('lightning');

	// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
	useEffect(() => {
		const close = async (): Promise<void> => {
			const response = await closeChannels({ channels });

			if (response.isOk() && response.value.length === 0) {
				await refreshWallet();
				await sleep(5000); // give beignet some time to process
				navigation.navigate('Success', { type: 'savings' });
			} else {
				dispatch(startCoopCloseTimer());
				navigation.navigate('Interrupted');
			}
		};

		close();
	}, []);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				showBackButton={false}
			/>
			<View style={styles.content} testID="LightningSettingUp">
				<Display>
					<Trans
						t={t}
						i18nKey="savings_progress.title"
						components={{ accent: <Display color="brand" /> }}
					/>
				</Display>
				<BodyM style={styles.text} color="secondary">
					<Trans
						t={t}
						i18nKey="savings_progress.text"
						components={{ accent: <BodyMB color="white" /> }}
					/>
				</BodyM>

				<HourglassSpinner />
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 16,
	},
});

export default SavingsProgress;
