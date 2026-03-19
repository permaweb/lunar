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
const docsAssets = (import.meta as any).glob('../**/*.{png,jpg,jpeg,svg,gif,webp}', {
	eager: true,
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

	const highlightJSON = (code: string) => {
		return code
			.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
			.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
			.replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
			.replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
			.replace(/: (null)/g, ': <span class="json-null">$1</span>');
	};

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
		h4: (props: any) => {
			const { children } = props;
			const text = typeof children === 'string' ? children : children?.[0];
			const id = text
				? text
						.toLowerCase()
						.replace(/\s+/g, '-')
						.replace(/[^\w-]/g, '')
				: '';
			return <h4 id={id}>{children}</h4>;
		},
		code: (props: any) => {
			const { inline, className, children } = props;
			const isJSON = className === 'language-json';

			if (!inline && isJSON) {
				// Extract text content from children (could be string or array)
				const codeText = Array.isArray(children) ? children.join('') : String(children);
				return <code className={className} dangerouslySetInnerHTML={{ __html: highlightJSON(codeText) }} />;
			}

			return <code className={className}>{children}</code>;
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
		img: (props: any) => {
			const { src, alt } = props;
			if (!src) {
				return <img {...props} />;
			}

			let resolvedSrc = src;
			const filename = src.split('/').pop();
			if (filename) {
				const match = Object.entries(docsAssets).find(([key]) => key.endsWith(`/${filename}`));
				if (match) {
					resolvedSrc = match[1] as string;
				}
			}

			return <img src={resolvedSrc} alt={alt || ''} />;
		},
	};

	return markdown ? (
		<S.Container>
			<S.Wrapper>
				<ReactMarkdown
					children={markdown}
					components={{
						link: renderers.link,
						img: renderers.img,
						h2: renderers.h2,
						h4: renderers.h4,
						code: renderers.code,
					}}
				/>
			</S.Wrapper>
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
