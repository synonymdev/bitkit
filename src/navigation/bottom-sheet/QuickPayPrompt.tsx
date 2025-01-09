import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Trans, useTranslation } from 'react-i18next';

import { __E2E__ } from '../../constants/env';
import { BodyMB, Display } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetScreen from '../../components/BottomSheetScreen';
import { objectKeys } from '../../utils/objectKeys';
import { useBalance } from '../../hooks/wallet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { closeSheet } from '../../store/slices/ui';
import { updateSettings } from '../../store/slices/settings';
import { showBottomSheet } from '../../store/utils/ui';
import { viewControllersSelector } from '../../store/reselect/ui';
import { quickpayIntroSeenSelector } from '../../store/reselect/settings';
import { RootNavigationProp } from '../types';

const imageSrc = require('../../assets/illustrations/fast-forward.png');

const CHECK_DELAY = 3000; // how long user needs to stay on Wallets screen before he will see this prompt

const QuickPayPrompt = ({ enabled }: { enabled: boolean }): ReactElement => {
	const { t } = useTranslation('settings');
	const navigation = useNavigation<RootNavigationProp>();
	const { spendingBalance } = useBalance();
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const viewControllers = useAppSelector(viewControllersSelector);
	const quickpayIntroSeen = useAppSelector(quickpayIntroSeenSelector);

	useBottomSheetBackPress('quickPay');

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'quickPay')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	// if user hasn't seen this prompt
	// and has a spending balance
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		return (
			enabled &&
			!__E2E__ &&
			!anyBottomSheetIsOpen &&
			!quickpayIntroSeen &&
			spendingBalance > 0
		);
	}, [enabled, anyBottomSheetIsOpen, quickpayIntroSeen, spendingBalance]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('quickPay');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onMore = (): void => {
		navigation.navigate('Settings', { screen: 'QuickpaySettings' });
		dispatch(updateSettings({ quickpayIntroSeen: true }));
		dispatch(closeSheet('quickPay'));
	};

	const onDismiss = (): void => {
		dispatch(updateSettings({ quickpayIntroSeen: true }));
		dispatch(closeSheet('quickPay'));
	};

	return (
		<BottomSheetWrapper
			view="quickPay"
			snapPoints={snapPoints}
			onClose={(): void => {
				dispatch(updateSettings({ quickpayIntroSeen: true }));
			}}>
			<BottomSheetScreen
				navTitle={t('quickpay.nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="quickpay.intro.title"
						components={{ accent: <Display color="green" /> }}
					/>
				}
				description={
					<Trans
						t={t}
						i18nKey="quickpay.intro.description"
						components={{ accent: <BodyMB color="white" /> }}
					/>
				}
				image={imageSrc}
				continueText={t('learn_more')}
				cancelText={t('later')}
				testID="QuickPayPrompt"
				onContinue={onMore}
				onCancel={onDismiss}
			/>
		</BottomSheetWrapper>
	);
};

export default memo(QuickPayPrompt);
