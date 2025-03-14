import React, { ReactElement, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import AmountToggle from '../../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import LightningSyncing from '../../../components/LightningSyncing';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import type { LNURLWithdrawScreenProps } from '../../../navigation/types';
import { useSheetRef } from '../../../sheets/SheetRefsProvider';
import { BodyM } from '../../../styles/text';
import { handleLnurlWithdraw } from '../../../utils/lnurl';
import { showToast } from '../../../utils/notifications';

const imageSrc = require('../../../assets/illustrations/transfer.png');

const Confirm = ({
	route,
}: LNURLWithdrawScreenProps<'Confirm'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { amount, params } = route.params;
	const sheetRef = useSheetRef('lnurlWithdraw');

	const [isLoading, setIsLoading] = useState(false);

	const handlePress = async (): Promise<void> => {
		setIsLoading(true);
		const res = await handleLnurlWithdraw({ amount, params });
		setIsLoading(false);
		if (res.isErr()) {
			return;
		}
		sheetRef.current?.close();
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
					showBackButton={params.minWithdrawable !== params.maxWithdrawable}
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
