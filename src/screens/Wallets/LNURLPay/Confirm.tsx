import React, { ReactElement, memo, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import type { LNURLPayProps } from '../../../navigation/types';
import SafeAreaInset from '../../../components/SafeAreaInset';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { handleLnurlPay } from '../../../utils/lnurl';
import { closeBottomSheet } from '../../../store/actions/ui';
import { sleep } from '../../../utils/helpers';
import { processInputData } from '../../../utils/scanner';

const Confirm = ({ route }: LNURLPayProps<'Confirm'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { amount, pParams } = route.params;
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	useEffect(() => {
		(async (): Promise<void> => {
			closeBottomSheet('sendNavigation');
			await sleep(300);
			const invoice = await handleLnurlPay({
				params: pParams,
				amountSats: amount,
				selectedWallet,
				selectedNetwork,
			});

			if (invoice.isErr()) {
				closeBottomSheet('lnurlPay');
				return;
			}

			closeBottomSheet('lnurlPay');
			await sleep(300);
			processInputData({
				data: invoice.value,
				selectedWallet,
				selectedNetwork,
			});
		})();
	}, [amount, pParams, selectedNetwork, selectedWallet]);

	return (
		<>
			<GradientView style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('lnurl_p_title')}
					displayBackButton={false}
				/>
				<View style={styles.content}>
					<ActivityIndicator size="large" />
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
		alignContent: 'center',
		justifyContent: 'center',
	},
});

export default memo(Confirm);
