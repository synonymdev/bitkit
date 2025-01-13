import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import LightningChannel from '../../components/LightningChannel';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import type { TransferScreenProps } from '../../navigation/types';
import { View as ThemedView } from '../../styles/components';
import { BodyM, BodyMB, Display } from '../../styles/text';

const Liquidity = ({
	navigation,
	route,
}: TransferScreenProps<'Liquidity'>): ReactElement => {
	const { channelSize, localBalance } = route.params;
	const { t } = useTranslation('lightning');

	const onContinue = (): void => {
		navigation.goBack();
	};

	const remoteBalance = Math.round(channelSize - localBalance);

	return (
		<ThemedView style={styles.root} testID="Liquidity">
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('transfer.nav_title')} />
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="liquidity.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>

				<BodyM style={styles.description} color="secondary">
					{t('liquidity.text')}
				</BodyM>

				<BodyMB style={styles.label}>{t('liquidity.label')}</BodyMB>
				<LightningChannel
					capacity={channelSize}
					localBalance={localBalance}
					remoteBalance={remoteBalance}
					status="open"
					showLabels={true}
				/>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('understood')}
						size="large"
						testID="LiquidityContinue"
						onPress={onContinue}
					/>
				</View>
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
	description: {
		marginTop: 4,
	},
	label: {
		marginTop: 'auto',
		marginBottom: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 32,
	},
	button: {
		flex: 1,
	},
});

export default Liquidity;
