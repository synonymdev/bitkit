import React, {
	useCallback,
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
import Store from '../store/types';
import { handleOnPress } from '../utils/todos';

const TodoCarousel = (): ReactElement => {
	const [key, setKey] = useState(0);
	const [index, setIndex] = useState(0);
	const { width } = useWindowDimensions();
	const navigation = useNavigation();
	const ref = useRef(null);
	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);
	const todos = useSelector((state: Store) => state.todos.todos);
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

	const renderItem = useCallback(
		({ item }) => (
			<CarouselCard
				id={item.id}
				key={item.id}
				title={item.title}
				description={item.description}
				onPress={(): void => handleOnPress({ navigation, type: item.type })}
			/>
		),
		[navigation],
	);

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
					renderItem={renderItem}
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
