import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheetScreen from '../../components/BottomSheetScreen';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	availableUpdateSelector,
	viewControllersSelector,
} from '../../store/reselect/ui';
import { ignoreAppUpdateTimestampSelector } from '../../store/reselect/user';
import { closeSheet } from '../../store/slices/ui';
import { ignoreAppUpdate } from '../../store/slices/user';
import { showBottomSheet } from '../../store/utils/ui';
import { Display } from '../../styles/text';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';

const imageSrc = require('../../assets/illustrations/wand.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 12; // 12h - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2500; // how long user needs to stay on Wallets screen before he will see this prompt

const AppUpdatePrompt = (): ReactElement => {
	const { t } = useTranslation('other');
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const viewControllers = useAppSelector(viewControllersSelector);
	const updateInfo = useAppSelector(availableUpdateSelector);
	const ignoreTimestamp = useAppSelector(ignoreAppUpdateTimestampSelector);

	useBottomSheetBackPress('appUpdatePrompt');

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'appUpdatePrompt')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	// if optional app update available
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			!__E2E__ &&
			updateInfo !== null &&
			!updateInfo.critical &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [updateInfo, ignoreTimestamp, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('appUpdatePrompt');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onClose = (): void => {
		dispatch(ignoreAppUpdate());
	};

	const onCancel = (): void => {
		dispatch(ignoreAppUpdate());
		dispatch(closeSheet('appUpdatePrompt'));
	};

	const onUpdate = async (): Promise<void> => {
		dispatch(ignoreAppUpdate());
		await openURL(updateInfo?.url!);
		dispatch(closeSheet('appUpdatePrompt'));
	};

	return (
		<BottomSheetWrapper
			view="appUpdatePrompt"
			snapPoints={snapPoints}
			onClose={onClose}>
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
				testID="AppUpdatePrompt"
				onContinue={onUpdate}
				onCancel={onCancel}
			/>
		</BottomSheetWrapper>
	);
};

export default memo(AppUpdatePrompt);
