import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheet from '../components/BottomSheet';
import SafeAreaInset from '../components/SafeAreaInset';
import Button from '../components/buttons/Button';
import { useAppSelector } from '../hooks/redux';
import { languageSelector, timeZoneSelector } from '../store/reselect/ui';
import { View as ThemedView } from '../styles/components';
import { LeftSign, RightSign } from '../styles/icons';
import { BodyMSB, Caption13Up, Subtitle } from '../styles/text';
import { generateCalendar } from '../utils/helpers';
import { i18nTime } from '../utils/i18n';
import { useSheetRef } from './SheetRefsProvider';

const DAY_HEIGHT = 44;
const sheetId = 'datePicker';

const Day = ({
	day,
	selection,
	onPress,
}: {
	day: number | null;
	selection?: 'single' | 'start' | 'end' | 'middle' | 'today';
	onPress?: () => void;
}): ReactElement => {
	let back: ReactElement | null = null;
	let textColor: 'brand' | undefined;
	let today = false;
	switch (selection) {
		case 'single':
			textColor = 'brand';
			back = (
				<View style={styles.sRoot}>
					<ThemedView color="brand16" style={styles.sCircleSingle} />
				</View>
			);
			break;
		case 'start':
			textColor = 'brand';
			back = (
				<View style={styles.sRoot}>
					<ThemedView color="brand16" style={styles.sStartBrick} />
					<View style={styles.sCircleMulti} />
				</View>
			);
			break;
		case 'end':
			textColor = 'brand';
			back = (
				<View style={styles.sRoot}>
					<ThemedView color="brand16" style={styles.sEndBrick} />
					<View style={styles.sCircleMulti} />
				</View>
			);
			break;
		case 'middle':
			back = (
				<View style={styles.sRoot}>
					<ThemedView color="brand16" style={styles.sMiddle} />
				</View>
			);
			break;
		case 'today':
			today = true;
			back = (
				<View style={styles.sRoot}>
					<ThemedView color="white10" style={styles.sCircleSingle} />
				</View>
			);
			break;
	}

	return (
		<TouchableOpacity
			style={styles.day}
			activeOpacity={0.7}
			testID={day ? `Day-${day}` : undefined}
			onPress={onPress}>
			{back}
			<BodyMSB color={textColor} testID={today ? 'Today' : undefined}>
				{day}
			</BodyMSB>
		</TouchableOpacity>
	);
};

const Calendar = ({
	initialRange,
	onChange,
}: {
	initialRange: number[];
	onChange: (timeRange: number[]) => void;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const sheetRef = useSheetRef(sheetId);
	const timeZone = useAppSelector(timeZoneSelector);
	const language = useAppSelector(languageSelector);
	const [monthDate, setMonthDate] = useState(() => {
		if (initialRange.length > 0) {
			const initialDate = new Date(initialRange[0]);
			return new Date(initialDate.getFullYear(), initialDate.getMonth());
		}
		const n = new Date();
		return new Date(n.getFullYear(), n.getMonth());
	});
	const [range, setRange] = useState<Date[]>(
		initialRange.map((t) => new Date(t)),
	);

	const { calendar, weekDays } = useMemo(() => {
		const c = generateCalendar(monthDate, language, timeZone);
		const wkDays = c.weekDays.map((day) => {
			return tTime('dateTime', {
				v: new Date(Date.UTC(1970, 0, day + 4)),
				formatParams: { v: { weekday: 'short' } },
			});
		});
		return { calendar: c, weekDays: wkDays };
	}, [tTime, monthDate, timeZone, language]);
	const today = useMemo(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	}, []);

	const prevMonth = (): void => {
		setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1));
	};

	const nextMonth = (): void => {
		setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1));
	};

	const handleSelect = (day): void => {
		if (day === null) {
			return;
		}
		const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
		if (range.length !== 1) {
			setRange([date]);
		} else if (range[0].getTime() === date.getTime()) {
			return;
		} else if (range[0].getTime() > date.getTime()) {
			setRange([date, range[0]]);
		} else {
			setRange([range[0], date]);
		}
	};

	const handleClear = (): void => {
		setRange([]);
		onChange([]);
	};

	const handleApply = (): void => {
		const begin = range[0].getTime();
		const end = (range[1] ?? range[0]).getTime() + 1000 * 60 * 60 * 24; // 24 hours
		onChange([begin, end]);
		sheetRef.current?.close();
	};

	return (
		<View style={styles.calendar}>
			<View style={styles.selector}>
				<View style={styles.current}>
					<BodyMSB>
						{tTime('dateTime', {
							v: monthDate,
							formatParams: { v: { month: 'long', year: 'numeric', timeZone } },
						})}
					</BodyMSB>
				</View>
				<TouchableOpacity
					style={styles.arrow}
					activeOpacity={0.7}
					testID="PrevMonth"
					onPress={prevMonth}>
					<LeftSign color="brand" />
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.arrow}
					activeOpacity={0.7}
					testID="NextMonth"
					onPress={nextMonth}>
					<RightSign color="brand" />
				</TouchableOpacity>
			</View>

			<View style={styles.weekCaption}>
				{weekDays.map((day) => (
					<View key={day} style={styles.weekDay}>
						<Caption13Up color="secondary">{day}</Caption13Up>
					</View>
				))}
			</View>

			<View>
				{calendar.weeks.map((week, i) => (
					<View key={i} style={styles.week}>
						{week.map((day, j) => {
							const begin = range[0]?.getTime();
							const end = range[1]?.getTime();
							let dayDate: null | number = null;
							if (day) {
								dayDate = new Date(
									monthDate.getFullYear(),
									monthDate.getMonth(),
									day,
								).getTime();
							}

							let selection:
								| 'single'
								| 'start'
								| 'end'
								| 'middle'
								| 'today'
								| undefined;
							if (dayDate === begin && !end) {
								selection = 'single';
							} else if (dayDate === begin) {
								selection = 'start';
							} else if (dayDate === end) {
								selection = 'end';
							} else if (dayDate && begin < dayDate && dayDate < end) {
								selection = 'middle';
							} else if (dayDate === today) {
								selection = 'today';
							}

							return (
								<Day
									key={j}
									day={day}
									selection={selection}
									onPress={(): void => handleSelect(day)}
								/>
							);
						})}
					</View>
				))}
			</View>

			<View style={styles.range}>
				{range.length === 1 && (
					<BodyMSB>
						{tTime('dateTime', {
							v: range[0],
							formatParams: {
								v: { day: 'numeric', month: 'long', year: 'numeric', timeZone },
							},
						})}
					</BodyMSB>
				)}
				{range.length === 2 && (
					<BodyMSB>
						{tTime('dateTime', {
							v: range[0],
							formatParams: {
								v: { day: 'numeric', month: 'long', year: 'numeric', timeZone },
							},
						})}
						{' – '}
						{tTime('dateTime', {
							v: range[1],
							formatParams: {
								v: { day: 'numeric', month: 'long', year: 'numeric', timeZone },
							},
						})}
					</BodyMSB>
				)}
			</View>

			<View style={styles.buttonContainer}>
				<Button
					style={styles.button}
					size="large"
					variant="secondary"
					text={t('filter_clear')}
					onPress={handleClear}
					disabled={range.length === 0}
					testID="CalendarClearButton"
				/>
				<Button
					style={styles.button}
					size="large"
					text={t('filter_apply')}
					onPress={handleApply}
					disabled={range.length === 0}
					testID="CalendarApplyButton"
				/>
			</View>
		</View>
	);
};

const DatePicker = ({
	range,
	onChange,
}: {
	range: number[];
	onChange: (timeRange: number[]) => void;
}): ReactElement => {
	const { t } = useTranslation('wallet');

	return (
		<BottomSheet id={sheetId} size="calendar">
			<View style={styles.root}>
				<Subtitle style={styles.title}>{t('filter_title')}</Subtitle>

				<Calendar initialRange={range} onChange={onChange} />

				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheet>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	title: {
		marginBottom: 25,
		textAlign: 'center',
	},
	calendar: {
		flex: 1,
	},
	selector: {
		paddingLeft: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	current: {
		flexGrow: 1,
		justifyContent: 'center',
	},
	arrow: {
		width: 45,
		height: 45,
		justifyContent: 'center',
		alignItems: 'center',
	},
	weekCaption: {
		flexDirection: 'row',
		marginTop: 12,
	},
	weekDay: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	week: {
		flexDirection: 'row',
	},
	day: {
		height: DAY_HEIGHT,
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 12,
	},
	sRoot: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sStartBrick: {
		...StyleSheet.absoluteFillObject,
		left: '50%',
	},
	sEndBrick: {
		...StyleSheet.absoluteFillObject,
		right: '50%',
	},
	sMiddle: {
		...StyleSheet.absoluteFillObject,
	},
	sCircleMulti: {
		borderRadius: DAY_HEIGHT,
		height: DAY_HEIGHT,
		width: DAY_HEIGHT,
		backgroundColor: '#502305',
	},
	sCircleSingle: {
		borderRadius: DAY_HEIGHT,
		height: DAY_HEIGHT,
		width: DAY_HEIGHT,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginHorizontal: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
	range: {
		marginTop: 'auto',
		marginBottom: 36,
		alignItems: 'center',
	},
});

export default memo(DatePicker);
