import { Link, useLocation } from 'react-router-dom';

import { docsOrder } from '../order-docs';

import * as S from './styles';

export default function DocsNavigationFooter() {
	const location = useLocation();

	const currentPath = location.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');

	const pages: { name: string; path: string }[] = [];
	docsOrder.forEach((section) => {
		if (section.children && section.children.length > 0) {
			section.children.forEach((child) => {
				pages.push({
					name: child.name,
					path: `${section.path}/${child.path}`,
				});
			});
		} else {
			pages.push({
				name: section.name,
				path: section.path,
			});
		}
	});

	const currentIndex = pages.findIndex((page) => page.path === currentPath);
	const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
	const nextPage = currentIndex >= 0 && currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

	const handleClick = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<S.Wrapper>
			{prevPage && (
				<Link to={`/docs/${prevPage.path}`} id={'docs-previous'} onClick={handleClick}>
					<span>Previous page</span>
					<p>{prevPage.name}</p>
				</Link>
			)}
			{nextPage && (
				<Link to={`/docs/${nextPage.path}`} id={'docs-next'} onClick={handleClick}>
					<span>Next page</span>
					<p>{nextPage.name}</p>
				</Link>
			)}
		</S.Wrapper>
	);
}
