import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactElement, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheet from '../components/BottomSheet';
import BottomSheetScreen from '../components/BottomSheetScreen';
import { __E2E__ } from '../constants/env';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useBalance } from '../hooks/wallet';
import { RootNavigationProp } from '../navigation/types';
import { quickpayIntroSeenSelector } from '../store/reselect/settings';
import { updateSettings } from '../store/slices/settings';
import { BodyMB, Display } from '../styles/text';
import { useAllSheetRefs, useSheetRef } from './SheetRefsProvider';

const imageSrc = require('../assets/illustrations/fast-forward.png');

const CHECK_DELAY = 2500; // how long user needs to stay on the home screen before he will see this prompt

const sheetId = 'quickPay';

const QuickPayPrompt = (): ReactElement => {
	const { t } = useTranslation('settings');
	const navigation = useNavigation<RootNavigationProp>();
	const { spendingBalance } = useBalance();
	const dispatch = useAppDispatch();
	const sheetRefs = useAllSheetRefs();
	const sheetRef = useSheetRef(sheetId);
	const quickpayIntroSeen = useAppSelector(quickpayIntroSeenSelector);

	// biome-ignore lint/correctness/useExhaustiveDependencies: sheetRefs don't change
	useEffect(() => {
		// if user hasn't seen this prompt
		// and has a spending balance
		// and no other bottom-sheets are shown
		// and user on home screen for CHECK_DELAY
		const shouldShow = () => {
			const isAnySheetOpen = sheetRefs.some(({ ref }) => ref.current?.isOpen());
			const hasSpendingBalance = spendingBalance > 0;

			return (
				!__E2E__ && !isAnySheetOpen && !quickpayIntroSeen && hasSpendingBalance
			);
		};

		const timer = setTimeout(() => {
			if (shouldShow()) {
				sheetRef.current?.present();
			}
		}, CHECK_DELAY);

		return () => clearTimeout(timer);
	}, [quickpayIntroSeen, spendingBalance]);

	const onMore = (): void => {
		navigation.navigate('Settings', { screen: 'QuickpaySettings' });
		dispatch(updateSettings({ quickpayIntroSeen: true }));
		sheetRef.current?.close();
	};

	const onDismiss = (): void => {
		dispatch(updateSettings({ quickpayIntroSeen: true }));
		sheetRef.current?.close();
	};

	return (
		<BottomSheet
			id={sheetId}
			size="large"
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
				showBackButton={false}
				continueText={t('learn_more')}
				cancelText={t('later')}
				testID="QuickPayPrompt"
				onContinue={onMore}
				onCancel={onDismiss}
			/>
		</BottomSheet>
	);
};

export default memo(QuickPayPrompt);
