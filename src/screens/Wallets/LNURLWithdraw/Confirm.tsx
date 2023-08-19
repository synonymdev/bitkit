import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import AmountToggle from '../../../components/AmountToggle';
import type { LNURLWithdrawProps } from '../../../navigation/types';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import GlowImage from '../../../components/GlowImage';
import { handleLnurlWithdraw } from '../../../utils/lnurl';
import { closeBottomSheet } from '../../../store/actions/ui';
import { Text01S } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';

const imageSrc = require('../../../assets/illustrations/transfer.png');

const Confirm = ({ route }: LNURLWithdrawProps<'Confirm'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { amount, wParams } = route.params;
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

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
		closeBottomSheet('lnurlWithdraw');
		showToast({
			type: 'success',
			title: t('lnurl_w_success_title'),
			description: t('lnurl_w_success_description'),
		});
	};

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('lnurl_w_title')}
					displayBackButton={
						wParams.minWithdrawable !== wParams.maxWithdrawable
					}
				/>
				<View style={styles.content}>
					<AmountToggle
						style={styles.amountToggle}
						sats={amount}
						reverse={true}
						space={12}
					/>
					<Text01S color="white5">{t('lnurl_w_text')}</Text01S>
					<GlowImage image={imageSrc} imageSize={170} glowColor="brand" />
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
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(Confirm);
