import React, { useCallback, useRef, memo, ReactElement, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import { View, Subtitle } from '../styles/components';
import CarouselCard from './CarouselCard';
import Store from '../store/types';
import { handleOnPress } from '../utils/todos';

const TodoCarousel = (): ReactElement => {
	const { width } = useWindowDimensions();
	const navigation = useNavigation();
	const ref = useRef(null);
	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);
	const todos = useSelector((state: Store) => state.todos.todos);
	const carouselStyle = useMemo(() => ({ width }), [width]);

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
			<Subtitle style={styles.content}>Suggestions</Subtitle>
			<View style={styles.container}>
				<Carousel
					loop={false}
					ref={ref}
					height={170}
					width={170}
					data={todos}
					renderItem={renderItem}
					style={carouselStyle}
				/>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		marginLeft: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	content: {
		marginTop: 32,
		marginLeft: 16,
	},
});

export default memo(TodoCarousel);
