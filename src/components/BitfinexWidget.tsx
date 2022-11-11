import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
	Skia,
	Canvas,
	LinearGradient,
	vec,
	Path,
} from '@shopify/react-native-skia';
import b4a from 'b4a';

import { View, Text01M, Caption13M, ChartLineIcon } from '../styles/components';
import useColors from '../hooks/colors';
import { BaseFeedWidget } from './FeedWidget';
import { IWidget } from '../store/types/widgets';
import { useFeedWidget } from '../hooks/widgets';

const Chart = ({
	color,
	values,
}: {
	color: string;
	values: number[];
}): ReactElement => {
	const { green, red } = useColors();
	const [layout, setLayout] = useState({ width: 1, height: 1 });

	const handleLayout = (event: any): void => {
		setLayout({
			width: event.nativeEvent.layout.width,
			height: event.nativeEvent.layout.height,
		});
	};

	let { height, width } = layout;

	const backgroud = Skia.Path.Make();
	const line = Skia.Path.Make();
	const steps = values.length;
	const step = width / steps;

	const normalized = useMemo(() => {
		const min = values.reduce((prev, curr) => Math.min(prev, curr), Infinity);
		const max = values.reduce((prev, curr) => Math.max(prev, curr), 0);

		return values.map((value: number) => {
			return (value - min) / (max - min);
		});
	}, [values]);

	backgroud.moveTo(0, 0);
	for (let i = 0; i < steps; i++) {
		const value = height - normalized[i] * height;
		backgroud.lineTo(i * step, value);
		if (i === 0) {
			line.moveTo(0, value);
		} else {
			line.lineTo(i * step, value);
		}
	}
	backgroud.lineTo(width, height);
	backgroud.lineTo(0, height);
	backgroud.close();

	return (
		<View style={styles.chart} onLayout={handleLayout}>
			<Canvas style={styles.canvas}>
				<Path path={backgroud} color={color === 'red' ? red : green}>
					<LinearGradient
						start={vec(0, 0)}
						end={vec(0, height * 1.3)}
						positions={[0, 1]}
						colors={[color, 'transparent']}
					/>
				</Path>
				<Path
					path={line}
					color={color === 'red' ? red : green}
					style="stroke"
					strokeJoin="round"
					strokeWidth={2}
				/>
			</Canvas>
		</View>
	);
};

const BitfinexWidget = ({
	url,
	widget,
	isEditing = false,
	onPress,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	onPress?: () => void;
}): ReactElement => {
	const { value, drive } = useFeedWidget({ url, feed: widget.feed });
	const [pastValues, setPastValues] = useState<number[]>([]);

	const period: '24h' | '7d' | '30d' = '24h';

	useEffect(() => {
		let unmounted = false;

		if (!drive) {
			return;
		}
		drive
			.get(widget.feed.field.files[period])
			.then((buf: Uint8Array) => {
				const string = buf && b4a.toString(buf);
				const values = JSON.parse(string).map(Number);
				!unmounted && values && setPastValues(values);
			})
			.catch(noop);

		return function cleanup() {
			unmounted = true;
		};
	}, [drive, widget.feed.field.files, period]);

	const change = useMemo(() => {
		if (!pastValues || pastValues.length < 2) {
			return { color: 'green', formatted: '+0%' };
		}
		const _change = pastValues[pastValues.length - 1] / pastValues[0] - 1;

		const sign = _change >= 0 ? '+' : '';
		const color = _change >= 0 ? 'green' : 'red';

		return {
			color,
			formatted: sign + (_change * 100).toFixed(2) + '%',
		};
	}, [pastValues]);

	return (
		<BaseFeedWidget
			url={url}
			name="Bitcoin Price"
			label={widget.feed.field.name}
			icon={<ChartLineIcon width={32} height={32} />}
			isEditing={isEditing}
			onPress={onPress}
			middle={<Chart color={change.color} values={pastValues} />}
			right={
				<View style={styles.numbers}>
					<Text01M numberOfLines={1} styles={styles.price}>
						{value}
					</Text01M>
					<Caption13M color={change.color} styles={styles.change}>
						{change.formatted}
					</Caption13M>
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create({
	chart: {
		flex: 1,
		minHeight: 40, // static width + height is really important to avoid rerenders of chart
	},
	numbers: {
		alignItems: 'flex-end',
	},
	price: {
		lineHeight: 22,
	},
	change: {
		lineHeight: 18,
	},
	canvas: {
		flex: 1,
	},
});

export default memo(BitfinexWidget);

function noop(): void {}
