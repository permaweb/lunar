import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Loader } from 'components/atoms/Loader';
import { MarkdownViewer } from 'components/molecules/MarkdownViewer';
import { URLS } from 'helpers/config';

import * as S from './styles';

const mdLoaders = (import.meta as any).glob('../MD/**/*.md', {
	query: '?raw',
	import: 'default',
});

export default function DocTemplate(props: { doc?: string; id?: string }) {
	const [markdown, setMarkdown] = React.useState<string>('');
	const [headings, setHeadings] = React.useState<{ id: string; text: string }[]>([]);
	const [activeHash, setActiveHash] = React.useState<string>('');

	const navigate = useNavigate();
	const location = useLocation();
	const basePath = URLS.docs;
	const active = location.pathname.replace(basePath, '');

	const [hashState, setHashState] = React.useState(window.location.href);

	React.useEffect(() => {
		const handleHashChange = () => {
			setHashState(window.location.href);
			const hash = window.location.hash.replace('#', '');
			setActiveHash(hash);
		};

		window.addEventListener('popstate', handleHashChange);
		window.addEventListener('hashchange', handleHashChange);

		// Set initial hash
		const hash = window.location.hash.replace('#', '');
		setActiveHash(hash);

		return () => {
			window.removeEventListener('popstate', handleHashChange);
			window.removeEventListener('hashchange', handleHashChange);
		};
	}, []);

	React.useEffect(() => {
		if (props.id) {
			setHashState(props.id);
		}
	}, [props]);

	React.useEffect(() => {
		const observer = new MutationObserver((mutationsList, observer) => {
			for (let mutation of mutationsList) {
				if (mutation.addedNodes.length) {
					let hash = hashState.substring(hashState.indexOf('#') + 1);
					hash = hash.substring(hash.indexOf('#') + 1);

					if (hash) {
						const targetElement = document.getElementById(hash);
						if (targetElement) {
							targetElement.scrollIntoView();
							observer.disconnect();
							break;
						}
					}
				}
			}
		});

		observer.observe(document, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [hashState]);

	React.useEffect(() => {
		let hash = hashState.substring(hashState.indexOf('#') + 1);
		hash = hash.substring(hash.indexOf('#') + 1);

		if (hash) {
			const targetElement = document.getElementById(hash);
			if (targetElement) {
				targetElement.scrollIntoView();
			}
		}
	}, [hashState]);

	React.useEffect(() => {
		const key = props.doc ? `../MD/${props.doc}.md` : active ? `../MD/${active}.md` : null;

		if (!key) {
			navigate(`${URLS.docs}overview/introduction`);
			return;
		}

		const loader = (mdLoaders as Record<string, () => Promise<string>>)[key];
		if (!loader) {
			console.error(`Unknown doc "${key}"`);
			return;
		}

		loader()
			.then((content) => {
				setMarkdown(content);

				// Extract h4 and h2 headings from markdown
				const headingRegex = /^####\s+(.+?)$/gm;
				const extracted: { id: string; text: string }[] = [];
				let match;

				while ((match = headingRegex.exec(content)) !== null) {
					const text = match[1];
					const id = text
						.toLowerCase()
						.replace(/\s+/g, '-')
						.replace(/[^\w-]/g, '');
					extracted.push({
						text,
						id,
					});
				}

				setHeadings(extracted);
			})
			.catch((err) => console.error('Error loading markdown:', err));
	}, [props.doc, active]);

	return markdown ? (
		<S.Container>
			<MarkdownViewer markdown={markdown} />
			{headings.length > 0 && (
				<S.TableOfContents className={'scroll-wrapper-hidden'}>
					<S.TOCTitle>On This Page</S.TOCTitle>
					<S.TOCList>
						{headings.map((heading) => (
							<S.TOCItem key={heading.id} $active={activeHash === heading.id}>
								<Link
									to={`#${heading.id}`}
									onClick={(e) => {
										e.preventDefault();
										const element = document.getElementById(heading.id);
										if (element) {
											const offset = 95;
											const elementPosition = element.getBoundingClientRect().top;
											const offsetPosition = elementPosition + window.pageYOffset - offset;

											window.scrollTo({
												top: offsetPosition,
												behavior: 'smooth',
											});
											window.history.pushState(null, '', `#${location.pathname}#${heading.id}`);
											setActiveHash(heading.id);
										}
									}}
								>
									{heading.text}
								</Link>
							</S.TOCItem>
						))}
					</S.TOCList>
				</S.TableOfContents>
			)}
		</S.Container>
	) : (
		<Loader />
	);
}
