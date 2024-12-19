import React, { memo, ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import NavigationHeader from '../../../components/NavigationHeader';
import NumberPad from '../../../components/NumberPad';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { PIN_ATTEMPTS } from '../../../constants/app';
import usePIN from '../../../hooks/pin';
import type { SettingsScreenProps } from '../../../navigation/types';
import { showBottomSheet } from '../../../store/utils/ui';
import { AnimatedView, View as ThemedView } from '../../../styles/components';
import { BodyM, BodyS } from '../../../styles/text';

const ChangePin = ({
	navigation,
}: SettingsScreenProps<'ChangePin'>): ReactElement => {
	const { t } = useTranslation('security');
	const nextStep = useCallback(() => {
		navigation.pop();
		navigation.navigate('ChangePin2');
	}, [navigation]);
	const { attemptsRemaining, Dots, handleNumberPress, isLastAttempt, loading } =
		usePIN(nextStep);

	if (loading) {
		return <ThemedView style={styles.container} />;
	}

	return (
		<ThemedView style={styles.container} testID="ChangePIN">
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('cp_title')} />

			<View style={styles.text}>
				<BodyM color="secondary">{t('cp_text')}</BodyM>
			</View>

			<View style={styles.wrongPin}>
				{attemptsRemaining !== Number(PIN_ATTEMPTS) ? (
					<AnimatedView color="transparent" entering={FadeIn} exiting={FadeOut}>
						{isLastAttempt ? (
							<BodyS style={styles.attemptsRemaining} color="brand">
								{t('pin_last_attempt')}
							</BodyS>
						) : (
							<Pressable
								onPress={(): void => {
									showBottomSheet('forgotPIN');
								}}>
								<BodyS testID="AttemptsRemaining" color="brand">
									{t('pin_attempts', { attemptsRemaining })}
								</BodyS>
							</Pressable>
						)}
					</AnimatedView>
				) : (
					<BodyS> </BodyS>
				)}
			</View>

			<View style={styles.dots}>
				<Dots />
			</View>

			<NumberPad
				style={styles.numberpad}
				type="simple"
				onPress={handleNumberPress}
			/>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		alignSelf: 'flex-start',
		marginHorizontal: 16,
		marginBottom: 32,
	},
	wrongPin: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginBottom: 16,
	},
	dots: {
		marginBottom: 'auto',
	},
	numberpad: {
		maxHeight: 350,
	},
	attemptsRemaining: {
		textAlign: 'center',
	},
});

export default memo(ChangePin);
