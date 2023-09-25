import React, { ReactElement, memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	createStackNavigator,
	StackNavigationProp,
	StackNavigationOptions,
} from '@react-navigation/stack';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import { useSnapPoints } from '../../hooks/bottomSheet';
import Chest from '../../screens/TreasureHunt/Chest';
import Loading from '../../screens/TreasureHunt/Loading';
import Prize from '../../screens/TreasureHunt/Prize';
import Airdrop from '../../screens/TreasureHunt/Airdrop';
import Error from '../../screens/TreasureHunt/Error';
import { viewControllerSelector } from '../../store/reselect/ui';
import { NavigationContainer } from '../../styles/components';
import { useAppSelector } from '../../hooks/redux';
import { updateSettings } from '../../store/actions/settings';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';

export type TreasureHuntNavigationProp =
	StackNavigationProp<TreasureHuntStackParamList>;

export type TreasureHuntStackParamList = {
	Chest: undefined;
	Loading: undefined;
	Prize: undefined;
	Airdrop: undefined;
	Error: undefined;
};

const Stack = createStackNavigator<TreasureHuntStackParamList>();

const screenOptions: StackNavigationOptions = {
	presentation: 'transparentModal',
	headerShown: false,
	animationEnabled: __E2E__ ? false : true,
};

const TreasureHuntNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const { treasureChests } = useAppSelector((state) => state.settings);
	const [isLoading, setIsLoading] = useState(true);
	const [initialScreen, setInitialScreen] =
		useState<keyof TreasureHuntStackParamList>('Chest');
	const { isOpen, chestId } = useSelector((state) => {
		return viewControllerSelector(state, 'treasureHunt');
	});

	const found = treasureChests.find((chest) => chest.chestId === chestId!);

	useEffect(() => {
		if (!isOpen) {
			setIsLoading(true);
			return;
		}

		const getChest = async (): Promise<void> => {
			const response = await fetch(__TREASURE_HUNT_HOST__, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					method: 'getChest',
					params: {
						input: { chestId },
					},
				}),
			});

			const { result } = await response.json();

			const isAirdrop = result?.sky === 1;

			if (!result.error) {
				updateSettings({
					treasureChests: [
						...treasureChests,
						{
							chestId: chestId!,
							shortId: result.shortId,
							state: 'found',
							isAirdrop,
						},
					],
				});

				if (isAirdrop) {
					setInitialScreen('Airdrop');
				} else {
					setInitialScreen('Chest');
				}
			} else {
				setInitialScreen('Error');
			}

			setIsLoading(false);
		};

		if (found) {
			if (found.isAirdrop) {
				setInitialScreen('Airdrop');
			} else {
				if (found.state !== 'found') {
					setInitialScreen('Prize');
				} else {
					setInitialScreen('Chest');
				}
			}
			setIsLoading(false);
		} else {
			getChest();
		}

		// onOpen
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	if (!isOpen || isLoading) {
		return <></>;
	}

	return (
		<BottomSheetWrapper view="treasureHunt" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator
					initialRouteName={initialScreen}
					screenOptions={screenOptions}>
					<Stack.Screen name="Chest" component={Chest} />
					<Stack.Screen name="Loading" component={Loading} />
					<Stack.Screen name="Prize" component={Prize} />
					<Stack.Screen name="Airdrop" component={Airdrop} />
					<Stack.Screen name="Error" component={Error} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(TreasureHuntNavigation);
