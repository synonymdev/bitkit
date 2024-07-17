import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useState,
} from 'react';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
	NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

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
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addTreasureChest } from '../../store/slices/settings';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';

export type TreasureHuntNavigationProp =
	NativeStackNavigationProp<TreasureHuntStackParamList>;

export type TreasureHuntStackParamList = {
	Chest: undefined;
	Loading: { chestId: string };
	Prize: { chestId: string };
	Airdrop: { chestId: string };
	Error: undefined;
};

const Stack = createNativeStackNavigator<TreasureHuntStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	presentation: 'transparentModal',
	headerShown: false,
	animation: __E2E__ ? 'none' : 'default',
};

const TreasureHuntNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const { treasureChests } = useAppSelector((state) => state.settings);
	const [isLoading, setIsLoading] = useState(true);
	const [initialScreen, setInitialScreen] =
		useState<keyof TreasureHuntStackParamList>('Chest');
	const { isOpen, chestId } = useAppSelector((state) => {
		return viewControllerSelector(state, 'treasureHunt');
	});

	const found = treasureChests.find((chest) => chest.chestId === chestId!);

	const getChest = useCallback(async (): Promise<void> => {
		if (!chestId) {
			return;
		}

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
			dispatch(
				addTreasureChest({
					chestId,
					shortId: result.shortId,
					state: 'found',
					isAirdrop,
				}),
			);

			if (isAirdrop) {
				setInitialScreen('Airdrop');
			} else {
				setInitialScreen('Chest');
			}
		} else {
			setInitialScreen('Error');
		}

		setIsLoading(false);
	}, [chestId, dispatch]);

	useEffect(() => {
		if (!isOpen) {
			setIsLoading(true);
			return;
		}

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
	}, [isOpen, getChest]);

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
					<Stack.Screen
						name="Loading"
						component={Loading}
						initialParams={{ chestId }}
					/>
					<Stack.Screen
						name="Prize"
						component={Prize}
						initialParams={{ chestId }}
					/>
					<Stack.Screen
						name="Airdrop"
						component={Airdrop}
						initialParams={{ chestId }}
					/>
					<Stack.Screen name="Error" component={Error} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(TreasureHuntNavigation);
