import React from 'react';
import { ReactSVG } from 'react-svg';

import type { ProfileErrorCode, ProfilePhase, ProfileUpdate } from 'api/profiles';
import { PROFILE_IMAGE_MAX_BYTES, PROFILE_IMAGE_TYPES, ProfileError } from 'api/profiles';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { PrimitiveInput } from 'components/atoms/PrimitiveInput';
import { TextArea } from 'components/atoms/TextArea';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { ASSETS } from 'helpers/config';
import type { ProfileType } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useProfileProvider } from 'providers/ProfileProvider';

import { useProfileImage } from '../../../hooks/useProfileImage';

import * as S from './styles';

type SaveState =
	| { status: 'idle' }
	| { status: 'saving'; phase: ProfilePhase }
	| { status: 'submitted'; id: string }
	| { status: 'error'; code: ProfileErrorCode; id?: string };
function profileDraft(profile: ProfileType | null): ProfileUpdate {
	return {
		username: profile?.username ?? '',
		displayName: profile?.displayName ?? '',
		description: profile?.description ?? '',
		thumbnail: profile?.thumbnail ?? null,
		banner: profile?.banner ?? null,
	};
}

export default function ProfileManager(props: {
	profile: ProfileType | null;
	onClose: () => void;
	onUpdate?: () => void;
}) {
	const profileProvider = useProfileProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const bannerInputRef = React.useRef<HTMLInputElement>(null);
	const avatarInputRef = React.useRef<HTMLInputElement>(null);
	const request = React.useRef<AbortController | null>(null);
	const [baseline, setBaseline] = React.useState(() => profileDraft(props.profile));
	const [draft, setDraft] = React.useState(() => profileDraft(props.profile));
	const [state, setState] = React.useState<SaveState>({ status: 'idle' });
	const thumbnail = useProfileImage(draft.thumbnail);
	const banner = useProfileImage(draft.banner);
	const loading = state.status === 'saving';
	const hasChanges = (Object.keys(draft) as (keyof ProfileUpdate)[]).some((key) => draft[key] !== baseline[key]);
	const isValid = draft.username.length <= 64 && draft.displayName.length <= 200 && draft.description.length <= 500;
	React.useEffect(() => () => request.current?.abort(), []);
	React.useEffect(() => {
		if (!hasChanges && state.status === 'idle') {
			const latest = profileDraft(props.profile);
			setBaseline(latest);
			setDraft(latest);
		}
	}, [props.profile, hasChanges, state.status]);
	function handleField(key: keyof ProfileUpdate, value: string | File | null) {
		setDraft((current) => ({ ...current, [key]: value }));
	}
	function handleFile(event: React.ChangeEvent<HTMLInputElement>, key: 'thumbnail' | 'banner') {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		if (!PROFILE_IMAGE_TYPES.includes(file.type) || !file.size || file.size > PROFILE_IMAGE_MAX_BYTES) {
			setState({ status: 'error', code: 'invalid-input' });
			return;
		}
		handleField(key, file);
	}
	async function handleSubmit() {
		if (request.current || !isValid || !hasChanges || (state.status === 'error' && state.code === 'unknown-outcome'))
			return;
		const controller = new AbortController();
		request.current = controller;
		setState({ status: 'saving', phase: 'preparing' });
		try {
			const profile = await profileProvider.saveProfile(draft, {
				signal: controller.signal,
				onPhase: (phase) => {
					if (!controller.signal.aborted) setState({ status: 'saving', phase });
				},
			});
			if (controller.signal.aborted) return;
			const saved = profileDraft(profile);
			setBaseline(saved);
			setDraft(saved);
			setState({ status: 'submitted', id: profile.id });
			props.onUpdate?.();
		} catch (error) {
			if (!controller.signal.aborted) {
				if (error instanceof ProfileError && error.uploadedImages)
					setDraft((current) => ({ ...current, ...error.uploadedImages }));
				setState({
					status: 'error',
					code: error instanceof ProfileError ? error.code : 'unavailable',
					id: error instanceof ProfileError ? error.transactionId : undefined,
				});
			}
		} finally {
			if (request.current === controller) request.current = null;
		}
	}
	const submissionId =
		state.status === 'submitted' || state.status === 'error'
			? state.id
			: profileProvider.state.status === 'submitted'
			? profileProvider.profile?.id
			: undefined;
	return (
		<S.Wrapper>
			<S.Body>
				{profileProvider.state.status === 'stale' && <S.Status role={'status'}>{language.profileStale}</S.Status>}
				<S.PWrapper>
					<S.FileInputWrapper>
						<S.BInput
							hasBanner={!!banner}
							aria-label={language.uploadBanner}
							onClick={() => bannerInputRef.current?.click()}
							disabled={loading}
						>
							{banner ? (
								<img src={banner} alt={language.profileBanner} />
							) : (
								<>
									<ReactSVG src={ASSETS.image} />
									<span>{language.uploadBanner}</span>
								</>
							)}
						</S.BInput>
						<PrimitiveInput
							ref={bannerInputRef}
							type={'file'}
							aria-label={language.uploadBanner}
							onChange={(event) => handleFile(event, 'banner')}
							disabled={loading}
							accept={PROFILE_IMAGE_TYPES.join(',')}
						/>
						<S.AInput
							hasAvatar={!!thumbnail}
							aria-label={language.uploadAvatar}
							onClick={() => avatarInputRef.current?.click()}
							disabled={loading}
						>
							{thumbnail ? (
								<img src={thumbnail} alt={language.profileAvatar} />
							) : (
								<>
									<ReactSVG src={ASSETS.user} />
									<span>{language.uploadAvatar}</span>
								</>
							)}
						</S.AInput>
						<PrimitiveInput
							ref={avatarInputRef}
							type={'file'}
							aria-label={language.uploadAvatar}
							onChange={(event) => handleFile(event, 'thumbnail')}
							disabled={loading}
							accept={PROFILE_IMAGE_TYPES.join(',')}
						/>
					</S.FileInputWrapper>
					<S.PActions>
						<Button
							type={'primary'}
							label={language.removeAvatar}
							onPress={() => handleField('thumbnail', null)}
							disabled={loading || !draft.thumbnail}
						/>
						<Button
							type={'primary'}
							label={language.removeBanner}
							onPress={() => handleField('banner', null)}
							disabled={loading || !draft.banner}
						/>
					</S.PActions>
				</S.PWrapper>
				<S.Form>
					<S.TForm>
						<FormField
							label={language.name}
							value={draft.displayName}
							onChange={(event) => handleField('displayName', event.target.value)}
							disabled={loading}
							invalid={{ status: draft.displayName.length > 200, message: null }}
							hideErrorMessage
						/>
						<FormField
							label={language.handle}
							value={draft.username}
							onChange={(event) => handleField('username', event.target.value)}
							disabled={loading}
							invalid={{ status: draft.username.length > 64, message: null }}
							hideErrorMessage
						/>
					</S.TForm>
					<TextArea
						label={language.bio}
						value={draft.description}
						onChange={(event) => handleField('description', event.target.value)}
						disabled={loading}
						invalid={{
							status: draft.description.length > 500,
							message:
								draft.description.length > 500
									? `${language.maxCharsReached} (${draft.description.length} / 500)`
									: null,
						}}
					/>
				</S.Form>
				{loading && <S.Status role={'status'}>{language.profilePhases[state.phase]}</S.Status>}
				{state.status === 'error' && <S.Status role={'alert'}>{language.profileErrors[state.code]}</S.Status>}
				{submissionId && (
					<S.Status role={'status'}>
						{state.status !== 'error' &&
							(profileProvider.state.status === 'ready' && profileProvider.profile?.id === submissionId
								? language.profileIndexed
								: language.profileSubmitted)}
						<ExplorerLink value={submissionId} type={'transaction'} />
					</S.Status>
				)}
				<S.SAction>
					<Button type={'primary'} label={language.close} onPress={props.onClose} disabled={loading} />
					<Button
						type={'alt1'}
						label={language.save}
						onPress={handleSubmit}
						disabled={
							loading || !isValid || !hasChanges || (state.status === 'error' && state.code === 'unknown-outcome')
						}
					/>
				</S.SAction>
			</S.Body>
		</S.Wrapper>
	);
}
