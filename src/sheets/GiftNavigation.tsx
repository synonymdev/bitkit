import { NavigationIndependentTree } from '@react-navigation/native';
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React, { memo, ReactElement } from 'react';

import BottomSheet from '../components/BottomSheet';
import ErrorScreen from '../screens/Gift/Error';
import Loading from '../screens/Gift/Loading';
import Used from '../screens/Gift/Used';
import { SheetsParamList } from '../store/types/ui';
import BottomSheetNavigationContainer from './BottomSheetNavigationContainer';

export type GiftNavigationProp = NativeStackNavigationProp<GiftStackParamList>;

export type GiftStackParamList = {
	Loading: { code: string; amount: number };
	Used: { amount: number };
	Error: undefined;
};

const Stack = createNativeStackNavigator<GiftStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
	headerShown: false,
	animation: 'none',
};

const SheetContent = ({
	data,
}: {
	data: SheetsParamList['gift'];
}): ReactElement => {
	const { code, amount } = data;

	return (
		<NavigationIndependentTree>
			<BottomSheetNavigationContainer>
				<Stack.Navigator screenOptions={screenOptions}>
					<Stack.Screen
						name="Loading"
						component={Loading}
						initialParams={{ code, amount }}
					/>
					<Stack.Screen name="Used" component={Used} />
					<Stack.Screen name="Error" component={ErrorScreen} />
				</Stack.Navigator>
			</BottomSheetNavigationContainer>
		</NavigationIndependentTree>
	);
};

const Gift = (): ReactElement => {
	return (
		<BottomSheet id="gift" size="large">
			{({ data }: { data: SheetsParamList['gift'] }) => {
				return <SheetContent data={data} />;
			}}
		</BottomSheet>
	);
};

export default memo(Gift);
