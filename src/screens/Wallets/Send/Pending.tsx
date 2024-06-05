import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BodyM } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import HourglassSpinner from '../../../components/HourglassSpinner';
import Button from '../../../components/Button';
import { rootNavigation } from '../../../navigation/root/RootNavigator';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { closeSheet } from '../../../store/slices/ui';
import { activityItemSelector } from '../../../store/reselect/activity';
import type { SendScreenProps } from '../../../navigation/types';

const Pending = ({ route }: SendScreenProps<'Pending'>): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('wallet');
	const { txId } = route.params;

	const activityItem = useAppSelector((state) => {
		return activityItemSelector(state, txId);
	});

	const navigateToTxDetails = (): void => {
		if (activityItem) {
			dispatch(closeSheet('sendNavigation'));
			rootNavigation.navigate('ActivityDetail', {
				id: activityItem.id,
				extended: false,
			});
		}
	};

	const handleClose = (): void => {
		dispatch(closeSheet('sendNavigation'));
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('send_pending')}
				displayBackButton={false}
			/>

			<View style={styles.content}>
				{activityItem && (
					<AmountToggle
						amount={activityItem.value}
						testID="NewTxPrompt"
						onPress={navigateToTxDetails}
					/>
				)}

				<BodyM style={styles.text} color="secondary">
					{t('send_pending_note')}
				</BodyM>

				<View style={styles.image}>
					<HourglassSpinner />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						disabled={!activityItem}
						text={t('send_details')}
						onPress={navigateToTxDetails}
					/>
					<Button
						style={styles.button}
						size="large"
						text={t('close')}
						testID="Close"
						onPress={handleClose}
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
	text: {
		marginTop: 16,
	},
	image: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
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

export default memo(Pending);
