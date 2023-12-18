import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { __E2E__ } from '../../constants/env';
import { Text01S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import { closeSheet, confirmHighFee } from '../../store/slices/ui';
import { ignoreHighFee } from '../../store/slices/user';
import { showBottomSheet } from '../../store/utils/ui';
import { blocktankInfoSelector } from '../../store/reselect/blocktank';
import { ignoreHighFeeTimestampSelector } from '../../store/reselect/user';
import {
	viewControllersSelector,
	hasFeeWarningShownSelector,
} from '../../store/reselect/ui';
import { objectKeys } from '../../utils/objectKeys';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const CHECK_DELAY = 3000; // how long user needs to stay on Wallets screen before he will see this prompt
const ASK_INTERVAL = 1000 * 60 * 60 * 24 * 30; // 30 days - how long this prompt will be hidden if user taps "Don't warn"

const HighFeeWarning = ({ enabled }: { enabled: boolean }): ReactElement => {
	const { t } = useTranslation('other');
	const snapPoints = useSnapPoints('medium');
	const dispatch = useAppDispatch();
	const viewControllers = useAppSelector(viewControllersSelector);
	const info = useAppSelector(blocktankInfoSelector);
	const ignoreTimestamp = useAppSelector(ignoreHighFeeTimestampSelector);
	const hasShown = useAppSelector(hasFeeWarningShownSelector);

	useBottomSheetBackPress('highFee');

	// @ts-ignore
	const isHighFee = info.onchain.feeRates.isHigh;

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'highFee')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	// if fees are high (from BT)
	// and not shown already since app start
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			!__E2E__ &&
			isHighFee &&
			!hasShown &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [enabled, isHighFee, hasShown, ignoreTimestamp, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('highFee');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onDismiss = (): void => {
		dispatch(ignoreHighFee());
		dispatch(confirmHighFee());
		dispatch(closeSheet('highFee'));
	};

	const onClose = (): void => {
		dispatch(confirmHighFee());
		dispatch(closeSheet('highFee'));
	};

	return (
		<BottomSheetWrapper
			view="highFee"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={onClose}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('high_fee_title')}
					displayBackButton={false}
				/>
				<Text01S color="gray1">{t('high_fee_text')}</Text01S>
				<GlowImage image={imageSrc} imageSize={180} glowColor="yellow" />
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text={t('high_fee_dismiss')}
						onPress={onDismiss}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text={t('high_fee_confirm')}
						onPress={onClose}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(HighFeeWarning);
