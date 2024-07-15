import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BodyM, BodyMB } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import LightningChannel2 from '../../../components/LightningChannel';
import Button from '../../../components/Button';
import type { ReceiveScreenProps } from '../../../navigation/types';

const Liquidity = ({
	navigation,
	route,
}: ReceiveScreenProps<'Liquidity'>): ReactElement => {
	const { channelSize, localBalance, isAdditional } = route.params;
	const { t } = useTranslation('wallet');

	const onContinue = (): void => {
		navigation.goBack();
	};

	const remoteReserve = channelSize / 100;
	const remoteBalance = Math.round(channelSize - localBalance - remoteReserve);

	const nav_title = isAdditional
		? t('receive_liquidity.nav_title_additional')
		: t('receive_liquidity.nav_title');
	const text = isAdditional
		? t('receive_liquidity.text_additional')
		: t('receive_liquidity.text');
	const label = isAdditional
		? t('receive_liquidity.label_additional')
		: t('receive_liquidity.label');

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={nav_title} />
			<View style={styles.content}>
				<BodyM color="secondary">{text}</BodyM>

				<BodyMB style={styles.label}>{label}</BodyMB>
				<LightningChannel2
					capacity={channelSize}
					localBalance={localBalance}
					remoteBalance={remoteBalance}
					status="open"
					showLabels={true}
				/>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						text={t('understood')}
						testID="LiquidityContinue"
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
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
	label: {
		marginTop: 48,
		marginBottom: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(Liquidity);
