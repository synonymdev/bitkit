import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { ldk } from '@synonymdev/react-native-ldk';
import { NavigationIndependentTree } from '@react-navigation/native';
import {
	createNativeStackNavigator,
	NativeStackNavigationProp,
	NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

import { NavigationContainer } from '../../styles/components';
import Prize from '../../screens/OrangeTicket/Prize';
import UsedCard from '../../screens/OrangeTicket/UsedCard';
import Error from '../../screens/OrangeTicket/Error';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { showToast } from '../../utils/notifications';
import { getNodeId, waitForLdk } from '../../utils/lightning';
import { viewControllerSelector } from '../../store/reselect/ui';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';

export type OrangeTicketNavigationProp =
	NativeStackNavigationProp<OrangeTicketStackParamList>;

export type OrangeTicketStackParamList = {
	Prize: { ticketId: string; amount: number };
	UsedCard: { amount: number };
	Error: { errorCode: number };
};

const Stack = createNativeStackNavigator<OrangeTicketStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	presentation: 'transparentModal',
	headerShown: false,
};

const OrangeTicket = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const [isLoading, setIsLoading] = useState(true);
	const [amount, setAmount] = useState<number>();
	const [errorCode, setErrorCode] = useState<number>();
	const orangeTickets = useAppSelector((state) => state.settings.orangeTickets);
	const [initialScreen, setInitialScreen] =
		useState<keyof OrangeTicketStackParamList>('Prize');
	const { isOpen, ticketId } = useAppSelector((state) => {
		return viewControllerSelector(state, 'orangeTicket');
	});

	useBottomSheetBackPress('orangeTicket');

	const getPrize = useCallback(async (): Promise<void> => {
		const getChest = async (): Promise<any> => {
			const response = await fetch(__TREASURE_HUNT_HOST__, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					method: 'getChest',
					params: { input: { chestId: ticketId } },
				}),
			});

			const { result } = await response.json();
			return result;
		};

		const openChest = async (): Promise<any> => {
			await waitForLdk();

			const nodeId = await getNodeId();
			const nodePublicKey = nodeId.isOk() ? nodeId.value : '';
			const input = { chestId: ticketId, nodePublicKey };
			const signResult = await ldk.nodeSign({
				message: JSON.stringify(input),
				messagePrefix: '',
			});
			if (signResult.isErr()) {
				showToast({
					type: 'error',
					title: 'Failed to get prize',
					description: 'Bitkit could not sign your claim request.',
				});
				return;
			}
			const signature = signResult.value;

			const response = await fetch(__TREASURE_HUNT_HOST__, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					method: 'openChest',
					params: { input, signature },
				}),
			});

			const { result } = await response.json();
			return result;
		};

		if (!ticketId) {
			return;
		}

		const chestResponse = await getChest();
		if (chestResponse.error) {
			setErrorCode(chestResponse.code);
			setInitialScreen('Error');
			setIsLoading(false);
			return;
		}
		setAmount(chestResponse.amountSat);

		// Check if the ticket has already been used
		if (orangeTickets.includes(ticketId)) {
			setInitialScreen('UsedCard');
			setIsLoading(false);
			return;
		}

		const openResponse = await openChest();
		if (openResponse.error) {
			if (openResponse.code === 5000) {
				setInitialScreen('UsedCard');
			} else {
				setErrorCode(openResponse.code);
				setInitialScreen('Error');
			}
		}
		setIsLoading(false);
		setAmount(openResponse.amountSat);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticketId]);

	useEffect(() => {
		if (!isOpen) {
			setInitialScreen('Prize');
			setIsLoading(true);
			return;
		}

		getPrize();
	}, [isOpen, getPrize]);

	if (isLoading) {
		return <></>;
	}

	return (
		<BottomSheetWrapper view="orangeTicket" snapPoints={snapPoints}>
			<NavigationIndependentTree>
				<NavigationContainer key={isOpen.toString()}>
					<Stack.Navigator
						initialRouteName={initialScreen}
						screenOptions={screenOptions}>
						<Stack.Screen
							name="Prize"
							component={Prize}
							initialParams={{ ticketId, amount }}
						/>
						<Stack.Screen
							name="UsedCard"
							component={UsedCard}
							initialParams={{ amount }}
						/>
						<Stack.Screen
							name="Error"
							component={Error}
							initialParams={{ errorCode }}
						/>
					</Stack.Navigator>
				</NavigationContainer>
			</NavigationIndependentTree>
		</BottomSheetWrapper>
	);
};

export default memo(OrangeTicket);
