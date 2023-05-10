import React, { Fragment, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Text02M } from '../styles/text';
import { Checkmark } from '../styles/icons';
import useColors from '../hooks/colors';

type Step = { title: string };

const ProgressSteps = ({
	steps,
	activeStepIndex,
	style,
}: {
	steps: Step[];
	activeStepIndex: number;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { purple } = useColors();

	return (
		<View style={[styles.progressSteps, style]}>
			<View style={styles.steps}>
				{Array.from({ length: steps.length }).map((_, index) => {
					const isActive = activeStepIndex === index;
					const isDone = activeStepIndex > index;

					return (
						<Fragment key={index}>
							<View
								style={[
									styles.step,
									isActive && { borderColor: purple },
									isDone && { backgroundColor: purple, borderColor: purple },
								]}>
								{isDone ? (
									<Checkmark color="black" height={22} width={22} />
								) : (
									<Text02M color={isActive ? 'purple' : 'white32'}>
										{index + 1}
									</Text02M>
								)}
							</View>

							{index < steps.length - 1 && <View style={styles.separator} />}
						</Fragment>
					);
				})}
			</View>
			<Text02M color="white32">{steps[activeStepIndex].title}</Text02M>
		</View>
	);
};

const styles = StyleSheet.create({
	progressSteps: {
		alignItems: 'center',
	},
	steps: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	step: {
		borderColor: 'rgba(255, 255, 255, 0.32)',
		borderRadius: 32,
		borderWidth: 1,
		height: 32,
		width: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	separator: {
		borderColor: 'rgba(255, 255, 255, 0.32)',
		borderWidth: 1,
		borderStyle: 'dashed',
		height: 1,
		width: 32,
	},
});

export default ProgressSteps;
