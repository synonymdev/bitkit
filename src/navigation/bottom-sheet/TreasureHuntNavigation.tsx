import React, { ReactElement, memo } from 'react';
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
import Prize from '../../screens/TreasureHunt/Prize';
import { viewControllerSelector } from '../../store/reselect/ui';
import { NavigationContainer } from '../../styles/components';

export type TreasureHuntNavigationProp =
	StackNavigationProp<TreasureHuntStackParamList>;

export type TreasureHuntStackParamList = {
	Chest: undefined;
	Prize: { id: number };
};

const Stack = createStackNavigator<TreasureHuntStackParamList>();

const screenOptions: StackNavigationOptions = {
	presentation: 'transparentModal',
	headerShown: false,
	...(__E2E__ ? { animation: 'none', animationDuration: 0 } : {}),
};

const TreasureHuntNavigation = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const { isOpen } = useSelector((state) => {
		return viewControllerSelector(state, 'treasureHunt');
	});

	return (
		<BottomSheetWrapper view="treasureHunt" snapPoints={snapPoints}>
			<NavigationContainer key={isOpen.toString()}>
				<Stack.Navigator screenOptions={screenOptions}>
					<Stack.Screen name="Chest" component={Chest} />
					<Stack.Screen name="Prize" component={Prize} />
				</Stack.Navigator>
			</NavigationContainer>
		</BottomSheetWrapper>
	);
};

export default memo(TreasureHuntNavigation);
