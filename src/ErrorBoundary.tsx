import React, { ReactElement, Component, ErrorInfo } from 'react';
import { Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

type State = {
	error: null | any;
};

type Props = {
	children: ReactElement;
};

export default class ErrorBoundary extends Component<Props, State> {
	state: State = {
		error: null,
	};

	static getDerivedStateFromError(error: Error): { error: Error } {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary componentDidCatch', error, errorInfo);
	}

	render(): ReactElement {
		const { error } = this.state;
		if (!error) {
			return this.props.children;
		}

		return (
			<SafeAreaView style={styles.root}>
				<ScrollView style={styles.root}>
					<Text style={styles.header}>Oops! There's an error:</Text>
					<Text style={styles.text}>{error.message}</Text>
					<Text style={styles.header}>Component stack:</Text>
					<Text style={styles.text}>{error.componentStack}</Text>
					<Text style={styles.header}>Stack:</Text>
					<Text style={styles.text}>{error.stack}</Text>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	root: {
		backgroundColor: 'black',
		paddingHorizontal: 16,
		flex: 1,
	},
	header: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
		color: 'orange',
		marginVertical: 8,
	},
	text: {
		color: 'white',
	},
});
