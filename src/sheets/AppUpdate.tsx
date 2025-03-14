import React, { memo, ReactElement, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheet from '../components/BottomSheet';
import BottomSheetScreen from '../components/BottomSheetScreen';
import { __E2E__ } from '../constants/env';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { availableUpdateSelector } from '../store/reselect/ui';
import { ignoreAppUpdateTimestampSelector } from '../store/reselect/user';
import { ignoreAppUpdate } from '../store/slices/user';
import { Display } from '../styles/text';
import { openURL } from '../utils/helpers';
import { useAllSheetRefs, useSheetRef } from './SheetRefsProvider';

const imageSrc = require('../assets/illustrations/wand.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 12; // 12h - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2500; // how long user needs to stay on the home screen before he will see this prompt

const sheetId = 'appUpdate';

const AppUpdate = (): ReactElement => {
	const { t } = useTranslation('other');
	const dispatch = useAppDispatch();
	const sheetRefs = useAllSheetRefs();
	const sheetRef = useSheetRef(sheetId);
	const updateInfo = useAppSelector(availableUpdateSelector);
	const ignoreTimestamp = useAppSelector(ignoreAppUpdateTimestampSelector);

	// biome-ignore lint/correctness/useExhaustiveDependencies: sheetRefs don't change
	useEffect(() => {
		// if optional app update available
		// and user has not seen this prompt for ASK_INTERVAL
		// and no other bottom-sheets are shown
		// and user on home screen for CHECK_DELAY
		const shouldShow = () => {
			const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
			const isAnySheetOpen = sheetRefs.some(({ ref }) => ref.current?.isOpen());

			return (
				!__E2E__ &&
				!isAnySheetOpen &&
				isTimeoutOver &&
				updateInfo !== null &&
				!updateInfo.critical
			);
		};

		const timer = setTimeout(() => {
			if (shouldShow()) {
				sheetRef.current?.present();
			}
		}, CHECK_DELAY);

		return () => clearTimeout(timer);
	}, [ignoreTimestamp, updateInfo]);

	const onClose = (): void => {
		dispatch(ignoreAppUpdate());
	};

	const onCancel = (): void => {
		dispatch(ignoreAppUpdate());
		sheetRef.current?.close();
	};

	const onUpdate = async (): Promise<void> => {
		dispatch(ignoreAppUpdate());
		await openURL(updateInfo?.url!);
		sheetRef.current?.close();
	};

	return (
		<BottomSheet id={sheetId} size="large" onClose={onClose}>
			<BottomSheetScreen
				navTitle={t('update_nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="update_title"
						components={{ accent: <Display color="brand" /> }}
					/>
				}
				description={t('update_text')}
				image={imageSrc}
				showBackButton={false}
				continueText={t('update_button')}
				cancelText={t('cancel')}
				testID="AppUpdate"
				onContinue={onUpdate}
				onCancel={onCancel}
			/>
		</BottomSheet>
	);
};

export default memo(AppUpdate);
