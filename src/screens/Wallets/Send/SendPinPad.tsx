import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import NumberPad from '../../../components/NumberPad';
import { PIN_ATTEMPTS } from '../../../constants/app';
import usePIN from '../../../hooks/pin';
import { useSheetRef } from '../../../sheets/SheetRefsProvider';
import { AnimatedView } from '../../../styles/components';
import { BodyS } from '../../../styles/text';

const SendPinPad = ({ onSuccess }: { onSuccess: () => void }): ReactElement => {
	const { t } = useTranslation('security');
	const sheetRef = useSheetRef('forgotPin');
	const { attemptsRemaining, Dots, handleNumberPress, isLastAttempt, loading } =
		usePIN(onSuccess);

	if (loading) {
		return <></>;
	}

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{attemptsRemaining !== Number(PIN_ATTEMPTS) && (
					<AnimatedView
						style={styles.attempts}
						color="transparent"
						entering={FadeIn}
						exiting={FadeOut}>
						{isLastAttempt ? (
							<BodyS style={styles.attemptsRemaining} color="brand">
								{t('pin_last_attempt')}
							</BodyS>
						) : (
							<Pressable
								onPress={(): void => {
									sheetRef.current?.present();
								}}>
								<BodyS testID="AttemptsRemaining" color="brand">
									{t('pin_attempts', { attemptsRemaining })}
								</BodyS>
							</Pressable>
						)}
					</AnimatedView>
				)}

				<View style={styles.dots}>
					<Dots />
				</View>

				<NumberPad
					style={styles.numberpad}
					type="simple"
					onPress={handleNumberPress}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		marginTop: 42,
		flex: 1,
	},
	dots: {
		marginTop: 16,
		marginBottom: 32,
	},
	numberpad: {
		marginTop: 'auto',
		maxHeight: 350,
	},
	attempts: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		paddingHorizontal: 16,
	},
	attemptsRemaining: {
		textAlign: 'center',
	},
});

export default memo(SendPinPad);
