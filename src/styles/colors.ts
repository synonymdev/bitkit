export interface IColors {
	// Accents
	bitcoin: string;
	blue: string;
	brand: string;
	green: string;
	purple: string;
	red: string;
	yellow: string;

	// Base
	black: string;
	white: string;

	// Gray Base
	gray6: string;
	gray5: string;
	gray3: string;
	gray2: string;

	// Alpha
	black50: string;
	black92: string;
	white06: string;
	white08: string;
	white10: string;
	white16: string;
	white32: string;
	white50: string;
	white64: string;
	white80: string;
	bitcoin50: string;
	blue24: string;
	brand08: string;
	brand16: string;
	brand24: string;
	brand32: string;
	green16: string;
	green24: string;
	purple50: string;
	purple16: string;
	purple24: string;
	purple32: string;
	red16: string;
	red24: string;
	yellow16: string;
	yellow24: string;
}

const colors: IColors = {
	// Accents
	bitcoin: '#F7931A',
	blue: '#0085FF',
	brand: '#FF4400',
	green: '#75BF72',
	purple: '#B95CE8',
	red: '#E95164',
	yellow: '#FFD200',

	// Base
	black: '#000000',
	white: '#FFFFFF',

	// Gray Base
	gray6: '#151515',
	gray5: '#1C1C1D',
	gray3: '#48484A',
	gray2: '#636366',

	// Alpha
	black50: 'rgba(0, 0, 0, 0.5)',
	black92: 'rgba(0, 0, 0, 0.92)',
	white06: 'rgba(255, 255, 255, 0.06)',
	white08: 'rgba(255, 255, 255, 0.08)',
	white10: 'rgba(255, 255, 255, 0.10)',
	white16: 'rgba(255, 255, 255, 0.16)',
	white32: 'rgba(255, 255, 255, 0.32)',
	white50: 'rgba(255, 255, 255, 0.50)',
	white64: 'rgba(255, 255, 255, 0.64)',
	white80: 'rgba(255, 255, 255, 0.80)',
	blue24: 'rgba(0, 133, 255, 0.24)',
	bitcoin50: 'rgba(247, 147, 26, 0.5)',
	brand08: 'rgba(255, 68, 0, 0.08)',
	brand16: 'rgba(255, 68, 0, 0.16)',
	brand24: 'rgba(255, 68, 0, 0.24)',
	brand32: 'rgba(255, 68, 0, 0.32)',
	green16: 'rgba(117, 191, 114, 0.16)',
	green24: 'rgba(117, 191, 114, 0.24)',
	purple16: 'rgba(185, 92, 232, 0.16)',
	purple24: 'rgba(185, 92, 232, 0.24)',
	purple32: 'rgba(185, 92, 232, 0.32)',
	purple50: 'rgba(185, 92, 232, 0.5)',
	red16: 'rgba(233, 81, 100, 0.16)',
	red24: 'rgba(233, 81, 100, 0.24)',
	yellow16: 'rgba(255, 210, 0, 0.16)',
	yellow24: 'rgba(255, 210, 0, 0.24)',
};

export default colors;
