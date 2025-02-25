import { useEffect, useState } from 'react';
import { __E2E__ } from '../constants/env';
import { timeAgo } from '../utils/helpers';

type TArticle = {
	title: string;
	published: number;
	publishedDate: string;
	link: string;
	comments?: string;
	author?: string;
	categories?: string[];
	thumbnail?: string;
	publisher: {
		title: string;
		link: string;
		image?: string;
	};
};

type TWidgetArticle = {
	title: string;
	timeAgo: string;
	link: string;
	publisher: string;
};

enum EWidgetStatus {
	Loading = 'loading',
	Error = 'error',
	Ready = 'ready',
}

type LoadingState = {
	status: EWidgetStatus.Loading;
	data: null;
};

type ErrorState = {
	status: EWidgetStatus.Error;
	data: null;
};

type ReadyState = {
	status: EWidgetStatus.Ready;
	data: TWidgetArticle;
};

type TWidgetState = LoadingState | ErrorState | ReadyState;

const BASE_URL = 'https://feeds.synonym.to/news-feed/api';
const REFRESH_INTERVAL = 1000 * 60 * 2; // 2 minutes

const useNewsWidget = (): TWidgetState => {
	const [state, setState] = useState<TWidgetState>({
		status: EWidgetStatus.Loading,
		data: null,
	});

	useEffect(() => {
		const abortController = new AbortController();

		const fetchArticles = async (): Promise<TArticle[]> => {
			const response = await fetch(`${BASE_URL}/articles`, {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		};

		const fetchData = async (): Promise<void> => {
			setState({ status: EWidgetStatus.Loading, data: null });
			try {
				const articles = await fetchArticles();

				// Get a random article from the last 10
				const article = articles
					?.sort((a, b) => b.published - a.published)
					.slice(0, 10)[Math.floor(Math.random() * 10)];

				const data = {
					title: article.title,
					timeAgo: timeAgo(article.publishedDate),
					link: article.comments || article.link,
					publisher: article.publisher.title,
				};

				setState({ status: EWidgetStatus.Ready, data });
			} catch (error) {
				console.error('Failed to fetch news data:', error);
				setState({ status: EWidgetStatus.Error, data: null });
			}
		};

		fetchData();

		// Don't start polling in E2E tests
		if (__E2E__) {
			return;
		}

		const interval = setInterval(fetchData, REFRESH_INTERVAL);

		return () => {
			clearInterval(interval);
			abortController.abort();
		};
	}, []);

	return state;
};

export default useNewsWidget;
