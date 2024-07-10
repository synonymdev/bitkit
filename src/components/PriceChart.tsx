import React, { useState, ReactElement, useEffect, useMemo } from 'react';
import {
	View,
	StyleProp,
	StyleSheet,
	ViewStyle,
	useWindowDimensions,
} from 'react-native';
import {
	Skia,
	Canvas,
	LinearGradient,
	vec,
	Path,
	CornerPathEffect,
	Text,
	useFont,
	Mask,
	Rect,
} from '@shopify/react-native-skia';
import { Reader } from '@synonymdev/slashtags-widget-price-feed';
import { Pair } from '@synonymdev/slashtags-widget-price-feed/types/lib/reader';

import { IThemeColors } from '../styles/themes';
import { SlashFeedJSON, TGraphPeriod } from '../store/types/widgets';
import useColors from '../hooks/colors';
import { useSlashtags } from '../hooks/slashtags';

export type Change = {
	color: keyof IThemeColors;
	formatted: string;
};

export const getChange = (pastValues: number[]): Change => {
	if (pastValues.length < 2) {
		return { color: 'green', formatted: '+0%' };
	}

	const _change = pastValues[pastValues.length - 1] / pastValues[0] - 1;
	const sign = _change >= 0 ? '+' : '';
	const color = _change >= 0 ? 'green' : 'red';

	return {
		color,
		formatted: sign + (_change * 100).toFixed(2) + '%',
	};
};

const chartHeight = 96;

export const Chart = ({
	values,
	positive,
	period,
	style,
}: {
	values: number[];
	positive: boolean;
	period?: string;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { green, red } = useColors();
	const { width: windowWidth } = useWindowDimensions();

	const font = useFont(require('../assets/fonts/InterTight-SemiBold.ttf'), 13);

	// subtract padding
	const chartWidth = windowWidth - 64;
	const line = Skia.Path.Make();
	const steps = values.length;
	const step = chartWidth / (steps - 1);

	const normalized = useMemo(() => {
		const min = values.reduce((prev, curr) => Math.min(prev, curr), Infinity);
		const max = values.reduce((prev, curr) => Math.max(prev, curr), 0);

		return values.map((value: number) => (value - min) / (max - min));
	}, [values]);

	for (let i = 0; i < steps; i++) {
		const value = chartHeight - normalized[i] * chartHeight;
		if (i === 0) {
			line.moveTo(0, value);
		} else {
			line.lineTo(i * step, value);
		}
	}

	const mask = line.copy();
	mask.lineTo(chartWidth, chartHeight);
	mask.lineTo(0, chartHeight);
	mask.close();

	const redGradient = ['rgba(233, 81, 100, 0.8)', 'rgba(233, 81, 100, 0.3)'];
	const greenGradient = [
		'rgba(117, 191, 114, 0.8)',
		'rgba(117, 191, 114, 0.3)',
	];

	return (
		<View style={[styles.chart, style]}>
			<Canvas style={styles.canvas}>
				<Path
					path={line}
					color={positive ? green : red}
					style="stroke"
					strokeWidth={1.3}>
					<CornerPathEffect r={10} />
				</Path>

				<Mask
					mode="luminance"
					mask={
						<Path path={mask} color="white" style="fill">
							<CornerPathEffect r={8} />
						</Path>
					}>
					<Rect x={0} y={0} width={chartWidth} height={chartHeight}>
						<LinearGradient
							start={vec(0, 0)}
							end={vec(0, chartHeight)}
							positions={[0, 1]}
							colors={positive ? greenGradient : redGradient}
						/>
					</Rect>
				</Mask>

				{period && font && (
					<Text
						x={7}
						y={chartHeight - 7}
						text={period}
						font={font}
						color="rgba(255, 255, 255, 0.2)"
					/>
				)}
			</Canvas>
		</View>
	);
};

type THistory = {
	pair: string;
	change: Change;
	pastValues: number[];
};

const PriceChart = ({
	url,
	field,
	period,
	style,
}: {
	url: string;
	field: SlashFeedJSON['fields'][0];
	period: TGraphPeriod;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { webRelayClient, webRelayUrl } = useSlashtags();
	const [history, setHistory] = useState<THistory>();

	useEffect(() => {
		let unmounted = false;

		const feedUrl = `${url}?relay=${webRelayUrl}`;
		const reader = new Reader(webRelayClient, feedUrl);

		const getHistory = async (): Promise<void> => {
			const pair = `${field.base}${field.quote}` as Pair;
			const candles = (await reader.getPastCandles(pair, period)) ?? [];
			const pastValues: number[] = candles.map((candle) => candle.close);
			const change = getChange(pastValues);

			if (!unmounted) {
				setHistory({ pair: field.name, change, pastValues });
			}
		};

		getHistory();

		return (): void => {
			unmounted = true;
		};
	}, [url, field, period, webRelayClient, webRelayUrl]);

	if (!history) {
		return <></>;
	}

	return (
		<View style={[styles.root, style]}>
			<Chart
				style={styles.priceChart}
				values={history.pastValues}
				positive={history.change.color === 'green'}
				period={period}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	priceChart: {
		minHeight: 60, // static width + height is really important to avoid rerenders of chart
	},
	chart: {
		minHeight: chartHeight, // static width + height is really important to avoid rerenders of chart
	},
	canvas: {
		flex: 1,
	},
});

export default PriceChart;
