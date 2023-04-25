import React, { ReactElement, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { View } from '../../styles/components';
import { Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { useBalance } from '../../hooks/wallet';
import { isGeoBlockedSelector } from '../../store/reselect/user';
import { TRANSACTION_DEFAULTS } from '../../utils/wallet/constants';
import type { LightningScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/lightning.png');

const Introduction = ({
	navigation,
}: LightningScreenProps<'Introduction'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const balance = useBalance({ onchain: true });
	const isGeoBlocked = useSelector(isGeoBlockedSelector);

	const txt = useMemo(
		() => t(isGeoBlocked ? 'int_blocked' : 'int_text'),
		[isGeoBlocked, t],
	);

	const isDisabled = useMemo(() => {
		return balance.satoshis <= TRANSACTION_DEFAULTS.recommendedBaseFee;
	}, [balance.satoshis]);

	return (
		<GlowingBackground topLeft="purple">
			<View color="transparent" style={styles.slide}>
				<SafeAreaInsets type="top" />
				<NavigationHeader
					onClosePress={(): void => {
						navigation.navigate('Wallet');
					}}
				/>
				<View color="transparent" style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View color="transparent" style={styles.textContent}>
					<Display>
						<Trans
							t={t}
							i18nKey="int_header"
							components={{
								purple: <Display color="purple" />,
							}}
						/>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						{txt}
					</Text01S>
				</View>

				<View color="transparent" style={styles.buttonContainer}>
					{!isGeoBlocked && (
						<>
							<Button
								style={[styles.button, styles.quickButton]}
								text={t('int_quick')}
								size="large"
								disabled={isDisabled}
								testID="QuickSetup"
								onPress={(): void => {
									navigation.navigate('QuickSetup');
								}}
							/>

							<Button
								style={[styles.button, styles.customButton]}
								text={t('int_custom')}
								size="large"
								variant="secondary"
								disabled={isDisabled}
								testID="CustomSetup"
								onPress={(): void => {
									navigation.navigate('CustomSetup', { spending: true });
								}}
							/>
						</>
					)}
				</View>
				<SafeAreaInsets type="bottom" />
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	slide: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
		marginBottom: 16,
	},
	imageContainer: {
		flex: 4,
		alignItems: 'center',
		paddingVertical: 50,
		justifyContent: 'flex-end',
		width: '100%',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	textContent: {
		flex: 3,
		paddingHorizontal: 32,
	},
	text: {
		marginTop: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginHorizontal: 32,
	},
	button: {
		flex: 1,
	},
	quickButton: {
		marginRight: 6,
	},
	customButton: {
		marginLeft: 6,
	},
});

export default Introduction;
