import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { ScanIcon, PencilIcon } from '../../styles/icons';
import { Display, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import RectangleButton from '../../components/buttons/RectangleButton';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import type { TransferScreenProps } from '../../navigation/types';

const FundingAdvanced = ({
	navigation,
}: TransferScreenProps<'FundingAdvanced'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onLnUrl = (): void => {
		navigation.navigate('Scanner');
	};

	const onManual = (): void => {
		navigation.navigate('ExternalConnection');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('funding_advanced.nav_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="funding_advanced.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM color="secondary" style={styles.text}>
					{t('funding_advanced.text')}
				</BodyM>

				<View style={styles.buttonContainer}>
					<RectangleButton
						icon={<ScanIcon color="purple" width={22} height={22} />}
						text={t('funding_advanced.button1')}
						testID="FundLnUrl"
						onPress={onLnUrl}
					/>

					<RectangleButton
						icon={<PencilIcon color="purple" width={22} height={22} />}
						text={t('funding_advanced.button2')}
						testID="FundManual"
						onPress={onManual}
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
	text: {
		marginTop: 4,
	},
	buttonContainer: {
		marginTop: 32,
	},
});

export default FundingAdvanced;
