import React, { ReactElement, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Display, Text01S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
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
			<View style={styles.slide}>
				<SafeAreaInset type="top" />
				<NavigationHeader
					onClosePress={(): void => {
						navigation.navigate('Wallet');
					}}
				/>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={styles.textContent}>
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

				<View style={styles.buttonContainer}>
					{!isGeoBlocked && (
						<>
							<Button
								style={[styles.button, styles.quickButton]}
								text={t('int_quick')}
								size="large"
								disabled={isDisabled}
								testID="QuickSetupButton"
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
								testID="CustomSetupButton"
								onPress={(): void => {
									navigation.navigate('CustomSetup', { spending: true });
								}}
							/>
						</>
					)}

					{/* TODO: build third party channel flow */}
					{/* {isGeoBlocked && (
						<Button
							style={styles.button}
							text={t('int_third_party')}
							size="large"
							testID="ThirdPartySetup"
							// onPress={(): void => {}}
						/>
					)} */}
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	slide: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
	},
	imageContainer: {
		flex: 3.2,
		alignItems: 'center',
		paddingVertical: 50,
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
		marginTop: 4,
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
