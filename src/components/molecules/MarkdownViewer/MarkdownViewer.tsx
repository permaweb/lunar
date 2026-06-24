import React, { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { PrismAsyncLight as SyntaxHighlighter, type SyntaxHighlighterProps } from 'react-syntax-highlighter';
import remarkGfm from 'remark-gfm';

import { Button } from 'components/atoms/Button';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const LANGUAGE_CLASS = /language-([\w-]+)/;
const COPY_RESET_MS = 2000;
const MarkdownSyntaxHighlighter = SyntaxHighlighter as unknown as React.ComponentType<SyntaxHighlighterProps>;

function getNodeText(node: ReactNode): string {
	if (node === null || node === undefined || typeof node === 'boolean') return '';
	if (typeof node === 'string' || typeof node === 'number') return String(node);
	if (Array.isArray(node)) return node.map(getNodeText).join('');
	if (React.isValidElement(node)) {
		return getNodeText((node.props as { children?: ReactNode }).children);
	}

	return '';
}

function getHeadingId(children: ReactNode) {
	return getNodeText(children)
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\w-]/g, '');
}

async function copyText(text: string) {
	if (!text || typeof document === 'undefined') return false;

	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (_e) {
			// Fall back to document.execCommand for browsers without clipboard permission.
		}
	}

	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();

	const copied = document.execCommand('copy');
	document.body.removeChild(textarea);

	return copied;
}

function CodeBlock(props: { children: ReactNode }) {
	const [copied, setCopied] = React.useState(false);
	const resetTimeout = React.useRef<number | null>(null);
	const text = React.useMemo(() => getNodeText(props.children).replace(/\n$/, ''), [props.children]);

	React.useEffect(() => {
		return () => {
			if (resetTimeout.current) window.clearTimeout(resetTimeout.current);
		};
	}, []);

	async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		e.stopPropagation();

		const copied = await copyText(text);
		if (!copied) return;

		setCopied(true);

		if (resetTimeout.current) window.clearTimeout(resetTimeout.current);
		resetTimeout.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
	}

	return (
		<S.CodeBlockWrapper>
			<S.CodeBlockCopyButton
				type={'button'}
				$copied={copied}
				aria-label={copied ? 'Copied code' : 'Copy code'}
				title={copied ? 'Copied' : 'Copy code'}
				onClick={handleCopy}
			>
				<ReactSVG src={copied ? ASSETS.checkmark : ASSETS.copy} />
			</S.CodeBlockCopyButton>
			<S.CodeBlockContent>{props.children}</S.CodeBlockContent>
		</S.CodeBlockWrapper>
	);
}

function Heading(props: { level: 1 | 2 | 3 | 4 | 5 | 6; children: ReactNode }) {
	const id = getHeadingId(props.children);

	return React.createElement(`h${props.level}`, id ? { id } : undefined, props.children);
}

function scrollToTop(e: React.MouseEvent<HTMLAnchorElement>) {
	if (
		e.defaultPrevented ||
		e.button !== 0 ||
		e.metaKey ||
		e.ctrlKey ||
		e.shiftKey ||
		e.altKey ||
		e.currentTarget.target === '_blank'
	) {
		return;
	}

	window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function MarkdownViewer(props: {
	markdown: string;
	header?: string | null;
	fixedHeight?: number;
	embedded?: boolean;
	compact?: boolean;
	className?: string;
	resolveImageSrc?: (src: string) => string;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const containerRef = React.useRef<HTMLDivElement>(null);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);

	const toggleFullscreen = React.useCallback(async () => {
		const el = containerRef.current!;
		if (document.fullscreenElement !== el) {
			// Exit current fullscreen first if needed, then enter fullscreen for this element
			if (document.fullscreenElement) {
				await document.exitFullscreen?.();
			}
			await el.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === containerRef.current);
		};
		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
		};
	}, []);
	const renderers = {
		h1: ({ children }: any) => <Heading level={1}>{children}</Heading>,
		h2: ({ children }: any) => <Heading level={2}>{children}</Heading>,
		h3: ({ children }: any) => <Heading level={3}>{children}</Heading>,
		h4: ({ children }: any) => <Heading level={4}>{children}</Heading>,
		h5: ({ children }: any) => <Heading level={5}>{children}</Heading>,
		h6: ({ children }: any) => <Heading level={6}>{children}</Heading>,
		pre: ({ children }: any) => <CodeBlock>{children}</CodeBlock>,
		code: ({ className, children }: any) => {
			const language = className?.match(LANGUAGE_CLASS)?.[1];
			const codeText = getNodeText(children).replace(/\n$/, '');

			if (language) {
				return (
					<MarkdownSyntaxHighlighter
						CodeTag={'code'}
						PreTag={'div'}
						codeTagProps={{ className }}
						customStyle={{ background: 'transparent', margin: 0, padding: 0 }}
						language={language}
						useInlineStyles={false}
						wrapLongLines
					>
						{codeText}
					</MarkdownSyntaxHighlighter>
				);
			}

			return <code className={className}>{children}</code>;
		},
		a: ({ href, children, ...anchorProps }: any) => {
			if (href?.startsWith('#') || href?.startsWith('/')) {
				return (
					<Link {...anchorProps} to={href} onClick={href.startsWith('/') ? scrollToTop : undefined}>
						{children}
					</Link>
				);
			}

			return (
				<a {...anchorProps} href={href}>
					{children}
				</a>
			);
		},
		img: ({ src, alt, ...imageProps }: any) => {
			const resolvedSrc = src && props.resolveImageSrc ? props.resolveImageSrc(src) : src;

			return <img {...imageProps} src={resolvedSrc} alt={alt || ''} />;
		},
	};
	const MarkdownComponent = ReactMarkdown as any;

	return (
		<S.Container
			$embedded={props.embedded}
			$fixedHeight={!fullScreenMode ? props.fixedHeight : undefined}
			$fullScreenMode={fullScreenMode}
			className={props.className}
			ref={containerRef}
		>
			{props.header && (
				<S.Header>
					<p>{props.header}</p>
					{props.compact && (
						<S.ActionsWrapper>
							<Button
								type={'alt1'}
								icon={ASSETS.fullscreen}
								handlePress={toggleFullscreen}
								height={25}
								width={25}
								noMinWidth
								iconSize={12.5}
								padding={'3.95px 0 0 0'}
								tooltip={fullScreenMode ? language.exitFullScreen : language.enterFullScreen}
								tooltipPosition={'bottom-right'}
								stopPropagation
								preventDefault
							/>
						</S.ActionsWrapper>
					)}
				</S.Header>
			)}
			<S.Content
				$compact={props.compact}
				$embedded={props.embedded}
				$fullScreenMode={fullScreenMode}
				className={props.embedded ? 'scroll-wrapper' : undefined}
			>
				<MarkdownComponent remarkPlugins={[remarkGfm]} components={renderers}>
					{props.markdown}
				</MarkdownComponent>
			</S.Content>
		</S.Container>
	);
}
