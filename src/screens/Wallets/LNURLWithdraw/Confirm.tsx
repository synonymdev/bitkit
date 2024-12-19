import React, { ReactElement, memo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import AmountToggle from '../../../components/AmountToggle';
import type { LNURLWithdrawProps } from '../../../navigation/types';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { handleLnurlWithdraw } from '../../../utils/lnurl';
import { BodyM } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';
import LightningSyncing from '../../../components/LightningSyncing';
import { closeSheet } from '../../../store/slices/ui';

const imageSrc = require('../../../assets/illustrations/transfer.png');

const Confirm = ({ route }: LNURLWithdrawProps<'Confirm'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { amount, wParams } = route.params;
	const dispatch = useAppDispatch();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);

	const [isLoading, setIsLoading] = useState(false);

	const handlePress = async (): Promise<void> => {
		setIsLoading(true);
		const res = await handleLnurlWithdraw({
			amount,
			params: wParams,
			selectedNetwork,
			selectedWallet,
		});
		setIsLoading(false);
		if (res.isErr()) {
			return;
		}
		dispatch(closeSheet('lnurlWithdraw'));
		showToast({
			type: 'info',
			title: t('other:lnurl_withdr_success_title'),
			description: t('other:lnurl_withdr_success_msg'),
		});
	};

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('lnurl_w_title')}
					showBackButton={wParams.minWithdrawable !== wParams.maxWithdrawable}
				/>
				<View style={styles.content}>
					<AmountToggle style={styles.amountToggle} amount={amount} />
					<BodyM color="secondary">{t('lnurl_w_text')}</BodyM>

					<View style={styles.imageContainer}>
						<Image style={styles.image} source={imageSrc} />
					</View>

					<View style={styles.buttonContainer}>
						<Button
							size="large"
							text={t('lnurl_w_button')}
							disabled={isLoading}
							onPress={handlePress}
							testID="WithdrawConfirmButton"
						/>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</GradientView>
			<LightningSyncing style={styles.syncing} title={t('lnurl_w_title')} />
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	amountToggle: {
		marginBottom: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
	},
	syncing: {
		...StyleSheet.absoluteFillObject,
	},
});

export default memo(Confirm);
