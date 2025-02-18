import {
	Canvas,
	CornerPathEffect,
	LinearGradient,
	Mask,
	Path,
	Rect,
	Skia,
	Text,
	useFont,
	vec,
} from '@shopify/react-native-skia';
import React, { ReactElement, useMemo } from 'react';
import {
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
	useWindowDimensions,
} from 'react-native';

import useColors from '../hooks/colors';
import usePriceWidget from '../hooks/usePriceWidget';
import { TGraphPeriod } from '../store/types/widgets';

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
		const min = values.reduce(
			(prev, curr) => Math.min(prev, curr),
			Number.POSITIVE_INFINITY,
		);
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

const PriceChart = ({
	period,
	style,
}: {
	period: TGraphPeriod;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { data, status } = usePriceWidget(['BTC/USD'], period);

	if (status !== 'ready') {
		return <></>;
	}

	return (
		<View style={[styles.root, style]}>
			<Chart
				values={data[0].pastValues}
				positive={data[0].change.color === 'green'}
				period={period}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	chart: {
		height: chartHeight, // static width + height is really important to avoid rerenders of chart
	},
	canvas: {
		flex: 1,
	},
});

export default PriceChart;
