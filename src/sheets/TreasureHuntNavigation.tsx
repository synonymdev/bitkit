import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useState,
} from 'react';

import BottomSheet from '../components/BottomSheet';
import { __E2E__ } from '../constants/env';
import { __TREASURE_HUNT_HOST__ } from '../constants/env';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import Airdrop from '../screens/TreasureHunt/Airdrop';
import Chest from '../screens/TreasureHunt/Chest';
import ErrorScreen from '../screens/TreasureHunt/Error';
import Loading from '../screens/TreasureHunt/Loading';
import Prize from '../screens/TreasureHunt/Prize';
import { addTreasureChest } from '../store/slices/settings';
import { SheetsParamList } from '../store/types/ui';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type TreasureHuntNavigationProp =
	NativeStackNavigationProp<TreasureHuntStackParamList>;

export type TreasureHuntStackParamList = {
	Chest: { chestId: string };
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

const SheetContent = ({
	data,
}: { data: SheetsParamList['treasureHunt'] }): ReactElement => {
	const dispatch = useAppDispatch();
	const { treasureChests } = useAppSelector((state) => state.settings);
	const [isLoading, setIsLoading] = useState(true);
	const [initialScreen, setInitialScreen] =
		useState<keyof TreasureHuntStackParamList>('Chest');

	const { chestId } = data;

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: onOpen
	useEffect(() => {
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
	}, [getChest]);

	if (isLoading) {
		return <></>;
	}

	return (
		<NavigationIndependentTree>
			<BottomSheetNavigationContainer>
				<Stack.Navigator
					initialRouteName={initialScreen}
					screenOptions={screenOptions}>
					<Stack.Screen
						name="Chest"
						component={Chest}
						initialParams={{ chestId }}
					/>
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
					<Stack.Screen name="Error" component={ErrorScreen} />
				</Stack.Navigator>
			</BottomSheetNavigationContainer>
		</NavigationIndependentTree>
	);
};

const TreasureHuntNavigation = (): ReactElement => {
	return (
		<BottomSheet id="treasureHunt" size="large">
			{({ data }: { data: SheetsParamList['treasureHunt'] }) => {
				return <SheetContent data={data} />;
			}}
		</BottomSheet>
	);
};

export default memo(TreasureHuntNavigation);
