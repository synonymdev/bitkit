import React, {
	useRef,
	memo,
	ReactElement,
	useMemo,
	useEffect,
	useState,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import { View, Subtitle } from '../styles/components';
import CarouselCard from './CarouselCard';
import { TTodoType } from '../store/types/todos';
import { toggleView } from '../store/actions/user';
import { getStore } from '../store/helpers';
import Store from '../store/types';
import type { RootNavigationProp } from '../navigation/types';

export const handleOnPress = ({
	navigation,
	id,
}: {
	navigation: RootNavigationProp;
	id: TTodoType;
}): void => {
	const store = getStore();

	if (id === 'backupSeedPhrase') {
		toggleView({
			view: 'backupPrompt',
			data: { isOpen: true },
		});
	}

	if (id === 'lightning') {
		navigation.navigate('LightningRoot', { screen: 'Introduction' });
	}

	if (id === 'lightningSettingUp') {
		navigation.navigate('BlocktankOrders');
	}

	if (id === 'pin') {
		const pinTodoDone = store.settings.pin;
		if (!pinTodoDone) {
			toggleView({
				view: 'PINPrompt',
				data: { isOpen: true, showLaterButton: true },
			});
		} else {
			navigation.navigate('Settings', { screen: 'DisablePin' });
		}
	}

	if (id === 'slashtagsProfile') {
		navigation.navigate('Profile');
	}

	if (id === 'buyBitcoin') {
		navigation.navigate('BuyBitcoin');
	}
};

const TodoCarousel = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const { width } = useWindowDimensions();
	const ref = useRef(null);
	const [key, setKey] = useState(0);
	const [index, setIndex] = useState(0);
	const todos = useSelector((state: Store) => state.todos);
	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);

	const carouselStyle = useMemo(() => ({ width }), [width]);
	const panGestureHandlerProps = useMemo(
		() => ({ activeOffsetX: [-10, 10] }),
		[],
	);

	// hack to re-create Carousel if cards are not visible
	useEffect(() => {
		if (index + 1 > todos.length) {
			setKey((k) => k + 1);
		}
	}, [todos.length, index]);

	if (!todos.length) {
		return <></>;
	}

	if (!showSuggestions) {
		return <></>;
	}

	return (
		<>
			<Subtitle style={styles.title}>Suggestions</Subtitle>
			<View style={styles.container}>
				<Carousel
					loop={false}
					key={key}
					ref={ref}
					height={170}
					width={170}
					data={todos}
					renderItem={({ item }): ReactElement => (
						<CarouselCard
							id={item.id}
							key={item.id}
							title={item.title}
							description={item.description}
							onPress={(): void => handleOnPress({ navigation, id: item.id })}
						/>
					)}
					style={carouselStyle}
					panGestureHandlerProps={panGestureHandlerProps}
					onSnapToItem={setIndex}
				/>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 32,
		marginBottom: 1,
		marginLeft: 16,
	},
	container: {
		marginLeft: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
});

export default memo(TodoCarousel);
