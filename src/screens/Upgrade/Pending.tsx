import React, { memo, ReactElement, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { BodyM, Display } from '../../styles/text2';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import HourglassSpinner from '../../components/HourglassSpinner2';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { UpgradeScreenProps } from '../../navigation/types';
import { closeAllChannels } from '../../utils/lightning';
import { refreshWallet } from '../../utils/wallet';
import { useAppDispatch } from '../../hooks/redux';
import { startCoopCloseTimer } from '../../store/slices/user';

const Pending = ({
	navigation,
}: UpgradeScreenProps<'Pending'>): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('other');

	useEffect(() => {
		const closeChannels = async (): Promise<void> => {
			const closeResponse = await closeAllChannels();

			if (closeResponse.isOk() && closeResponse.value.length === 0) {
				await refreshWallet();
				navigation.navigate('Success');
			} else {
				dispatch(startCoopCloseTimer());
				// navigation.navigate('Interrupted');
			}
		};

		closeChannels();
	});

	return (
		<GradientView>
			<BottomSheetNavigationHeader
				title={t('upgrade.pending.nav_title')}
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					<HourglassSpinner />
				</View>
				<Display>
					<Trans
						t={t}
						i18nKey="upgrade.pending.title"
						components={{ accent: <Display color="brand2" /> }}
					/>
				</Display>
				<View style={styles.text}>
					<BodyM color="white64">{t('upgrade.pending.text')}</BodyM>
				</View>
				<View style={styles.buttonContainer} />
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 32,
	},
	imageContainer: {
		alignItems: 'center',
		marginTop: 'auto',
		marginBottom: 'auto',
	},
	text: {
		minHeight: 66,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 32,
		minHeight: 56,
	},
});

export default memo(Pending);
