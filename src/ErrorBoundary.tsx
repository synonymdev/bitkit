import React, { ReactElement, Component } from 'react';
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

	static getDerivedStateFromError(error): { error: any } {
		return { error };
	}

	componentDidCatch(error, errorInfo): void {
		console.error('ErrorBoundary componentDidCatch', error, errorInfo);
	}

	render(): ReactElement {
		const { error } = this.state;
		if (!error) {
			return this.props.children;
		}

		return (
			<SafeAreaView>
				<ScrollView style={styles.root}>
					<Text style={styles.header}>Oops! There's an error</Text>
					<Text>{error.message}</Text>
					<Text style={styles.header}>Component stack:</Text>
					<Text>{error.componentStack}</Text>
					<Text style={styles.header}>Stack:</Text>
					<Text>{error.stack}</Text>
					<Text />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: 8,
	},
	header: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
		color: 'orange',
		marginVertical: 8,
	},
});
