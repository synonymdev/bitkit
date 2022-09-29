import React, { memo, ReactElement } from 'react';
import {
	DashPathEffect,
	BlurMask,
	Canvas,
	Circle,
	Paint,
	Path,
	vec,
} from '@shopify/react-native-skia';

import useColors from '../../hooks/colors';

const PieChart = ({
	size,
	shift,
	primary,
	dashed,
}: {
	size: number;
	shift: number;
	primary: number;
	dashed?: number;
}): ReactElement => {
	const colors = useColors();
	const whole = size + shift * 2;
	const r = size / 2;
	const center = shift + r;
	const cx = center;
	const cy = center;

	let content;
	if (primary === 0 || primary === 100) {
		// full circle
		const color = primary === 100 ? colors.purple : colors.orange;
		content = (
			<Path
				color={color}
				style="stroke"
				strokeJoin="round"
				strokeWidth={1.5}
				path={`
				    M ${cx} ${cy}
				    m -${r}, 0
				    a ${r},${r} 0 1,1 ${r * 2},0
				    a ${r},${r} 0 1,1 -${r * 2},0
			    `}>
				{primary === 100 && <Paint color={colors.purple16} />}
			</Path>
		);
	} else {
		// primary angle in radians
		const pandgle = (2 * Math.PI * primary) / 100;
		// relative coordinations of breaking point
		const x = r * Math.sin(pandgle);
		const y = r * Math.cos(pandgle);
		// abosolute coordinates of breaking point
		const px = center + x;
		const py = center - y;
		// which path to choose
		const primaryLargeArcFlag = x < 0 ? 1 : 0;
		const secondaryLargeArcFlag = !primaryLargeArcFlag ? 1 : 0;

		content = (
			<>
				<Path
					color={colors.orange}
					style="stroke"
					strokeJoin="round"
					strokeWidth={1.5}
					path={`
				    M ${px} ${py}
				    A ${r},${r} 0 ${secondaryLargeArcFlag},1 ${cx},${cx - r}
			    `}
				/>
				<Path
					color={colors.purple}
					style="stroke"
					strokeJoin="round"
					strokeWidth={1.5}
					path={`
				    M ${cx} ${cy}
				    m 0, -${r}
				    A ${r},${r} 0 ${primaryLargeArcFlag},1 ${px},${py}
				    L ${cx} ${cy}
				    l 0, -${r}
			    `}>
					<Paint color={colors.purple16} />
				</Path>
			</>
		);
	}

	let dashedLine;
	if (dashed !== undefined) {
		// primary angle in radians
		const pandgle = (2 * Math.PI * dashed) / 100;
		// relative coordinations of breaking point
		const x = r * Math.sin(pandgle);
		const y = r * Math.cos(pandgle);
		// abosolute coordinates of breaking point
		const px = center + x;
		const py = center - y;
		dashedLine = (
			<>
				<Path
					color={colors.black}
					style="stroke"
					strokeJoin="round"
					strokeWidth={2}
					path={`
				    M ${cx} ${cy}
				    L ${px} ${py}
			    `}>
					<Paint color={colors.black} />
				</Path>
				<Path
					color={colors.purple}
					style="stroke"
					strokeJoin="round"
					strokeWidth={2}
					path={`
				    M ${cx} ${cy}
				    L ${px} ${py}
			    `}>
					<DashPathEffect intervals={[2, 2]} />
				</Path>
			</>
		);
	}

	return (
		<Canvas style={{ width: whole, height: whole }}>
			<Circle c={vec(center)} r={r * 1.2} color={colors.purple} opacity={0.3}>
				<BlurMask blur={60} style="normal" />
			</Circle>
			{content}
			{dashedLine}
		</Canvas>
	);
};

export default memo(PieChart);
