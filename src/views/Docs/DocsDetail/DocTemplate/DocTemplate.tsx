import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Loader } from 'components/atoms/Loader';
import { URLS } from 'helpers/config';

import * as S from './styles';

const mdLoaders = (import.meta as any).glob('../MD/**/*.md', {
	query: '?raw',
	import: 'default',
});

export default function DocTemplate(props: { doc?: string; id?: string }) {
	const [markdown, setMarkdown] = React.useState<string>('');

	const navigate = useNavigate();
	const location = useLocation();
	const basePath = URLS.docs;
	const active = location.pathname.replace(basePath, '');

	const [hashState, setHashState] = React.useState(window.location.href);

	React.useEffect(() => {
		const handleHashChange = () => {
			setHashState(window.location.href);
		};

		window.addEventListener('popstate', handleHashChange);

		return () => {
			window.removeEventListener('popstate', handleHashChange);
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
			.then((content) => setMarkdown(content))
			.catch((err) => console.error('Error loading markdown:', err));
	}, [props.doc, active]);

	const renderers = {
		h2: (props: any) => {
			const { level, children } = props;
			let id: any;
			if (children && children[0] && children[0].props) {
				let hash = children[0].props.href.substring(children[0].props.href.indexOf('#') + 1);
				hash = hash.substring(hash.indexOf('#') + 1);
				id = hash;
			}
			if (level === 2 && id) {
				return <h2 id={id}>{children}</h2>;
			} else {
				return <h2>{children}</h2>;
			}
		},
		link: (props: any) => {
			const { href, children } = props;
			const isAnchorLink = href && href.startsWith('#');

			if (isAnchorLink) {
				return (
					<Link {...props} to={href}>
						{children}
					</Link>
				);
			}

			return (
				<a {...props} href={href}>
					{children}
				</a>
			);
		},
	};

	return markdown ? (
		<S.Wrapper isView={!props.doc}>
			<ReactMarkdown
				children={markdown}
				components={{
					link: renderers.link,
					h2: renderers.h2,
				}}
			/>
		</S.Wrapper>
	) : (
		<Loader />
	);
}
