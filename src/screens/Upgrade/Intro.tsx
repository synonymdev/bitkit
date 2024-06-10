import React, { ReactElement, memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';

import { Display, BodyM } from '../../styles/text2';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { closeSheet } from '../../store/slices/ui';
import { openChannelsSelector } from '../../store/reselect/lightning';
import type { UpgradeScreenProps } from '../../navigation/types';

const background = require('../../assets/illustrations/figures.png');
const logo = require('../../assets/illustrations/logo.png');

const Intro = ({ navigation }: UpgradeScreenProps<'Intro'>): ReactElement => {
	const { t } = useTranslation('other');
	const dispatch = useAppDispatch();
	const openChannels = useAppSelector(openChannelsSelector);

	useBottomSheetBackPress('upgrade');

	const onLater = (): void => {
		dispatch(closeSheet('upgrade'));
	};

	const onContinue = (): void => {
		if (openChannels.length > 0) {
			navigation.navigate('Transfer');
		} else {
			navigation.navigate('Download');
		}
	};

	return (
		<GradientView image={background}>
			<BottomSheetNavigationHeader title={t('upgrade.intro.nav_title')} />
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={logo} />
				</View>
				<Display>
					<Trans
						t={t}
						i18nKey="upgrade.intro.title"
						components={{ accent: <Display color="brand2" /> }}
					/>
				</Display>
				<View style={styles.text}>
					<BodyM color="white64">{t('upgrade.intro.text')}</BodyM>
				</View>
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text={t('upgrade.intro.cancel')}
						onPress={onLater}
					/>
					<Button
						style={styles.button}
						size="large"
						text={t('upgrade.intro.continue')}
						onPress={onContinue}
					/>
				</View>
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
	image: {
		height: 82,
		width: 279,
	},
	text: {
		minHeight: 66,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 32,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(Intro);
