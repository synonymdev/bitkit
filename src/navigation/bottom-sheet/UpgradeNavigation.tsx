import React, { ReactElement, memo, useEffect, useMemo } from 'react';
import {
	createStackNavigator,
	StackNavigationProp,
	StackNavigationOptions,
} from '@react-navigation/stack';

import { NavigationContainer } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Intro from '../../screens/Upgrade/Intro';
import Transfer from '../../screens/Upgrade/Transfer';
import Pending from '../../screens/Upgrade/Pending';
import Success from '../../screens/Upgrade/Success';
import Download from '../../screens/Upgrade/Download';
import Restore from '../../screens/Upgrade/Restore';
import Complete from '../../screens/Upgrade/Complete';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	viewControllerSelector,
	viewControllersSelector,
} from '../../store/reselect/ui';
import { __E2E__ } from '../../constants/env';
import { objectKeys } from 'beignet';
import { showBottomSheet } from '../../store/utils/ui';
import { updateUi } from '../../store/slices/ui';

const CHECK_DELAY = 2000; // how long user needs to stay on Wallets screen before he will see this prompt

export type UpgradeNavigationProp = StackNavigationProp<UpgradeStackParamList>;

export type UpgradeStackParamList = {
	Intro: undefined;
	Transfer: undefined;
	Pending: undefined;
	Success: undefined;
	Download: undefined;
	Restore: undefined;
	Complete: undefined;
};

const Stack = createStackNavigator<UpgradeStackParamList>();

const screenOptions: StackNavigationOptions = {
	presentation: 'transparentModal',
	headerShown: false,
	gestureEnabled: false,
	animationEnabled: __E2E__ ? false : true,
};

const UpgradeNavigation = ({ enabled }: { enabled: boolean }): ReactElement => {
	const dispatch = useAppDispatch();
	const snapPoints = useSnapPoints('large');
	const hasSeen = useAppSelector((state) => state.ui.hasSeenUpgradePrompt);
	const viewControllers = useAppSelector(viewControllersSelector);
	const { isOpen } = useAppSelector((state) => {
		return viewControllerSelector(state, 'upgrade');
	});

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'upgrade')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	// if not shown already
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		return enabled && !__E2E__ && !hasSeen && !anyBottomSheetIsOpen;
	}, [enabled, hasSeen, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('upgrade');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onClose = (): void => {
		dispatch(updateUi({ hasSeenUpgradePrompt: true }));
	};

	return (
		<BottomSheetWrapper
			view="upgrade"
			snapPoints={snapPoints}
			onClose={onClose}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator screenOptions={screenOptions}>
					<Stack.Screen name="Intro" component={Intro} />
					<Stack.Screen name="Transfer" component={Transfer} />
					<Stack.Screen name="Pending" component={Pending} />
					<Stack.Screen name="Success" component={Success} />
					<Stack.Screen name="Download" component={Download} />
					<Stack.Screen name="Restore" component={Restore} />
					<Stack.Screen name="Complete" component={Complete} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(UpgradeNavigation);
