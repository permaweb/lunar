import React from 'react';
import { ReactSVG } from 'react-svg';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Loader } from 'components/atoms/Loader';
import { TextArea } from 'components/atoms/TextArea';
import { ASSETS } from 'helpers/config';
import { getTxEndpoint } from 'helpers/endpoints';
import { checkValidAddress } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useNotifications } from 'providers/NotificationProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { WalletBlock } from 'wallet/WalletBlock';

import * as S from './styles';
import { IProps } from './types';

const MAX_BIO_LENGTH = 500;
const ALLOWED_BANNER_TYPES = 'image/png, image/jpeg, image/gif';
const ALLOWED_AVATAR_TYPES = 'image/png, image/jpeg, image/gif';

export default function ProfileManager(props: IProps) {
	const arProvider = useArweaveProvider();
	const permawebProvider = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const { addNotification } = useNotifications();

	const bannerInputRef = React.useRef<any>(null);
	const avatarInputRef = React.useRef<any>(null);

	const [name, setName] = React.useState<string>('');
	const [username, setUsername] = React.useState<string>('');
	const [description, setDescription] = React.useState<string>('');
	const [banner, setBanner] = React.useState<any>(null);
	const [thumbnail, setThumbnail] = React.useState<any>(null);

	const [loading, setLoading] = React.useState<boolean>(false);

	React.useEffect(() => {
		setUsername(props.profile?.username ?? '');
		setName(props.profile?.displayName ?? '');
		setDescription(props.profile?.description ?? '');
		setBanner(props.profile?.banner && checkValidAddress(props.profile.banner) ? props.profile.banner : null);
		setThumbnail(
			props.profile?.thumbnail && checkValidAddress(props.profile.thumbnail) ? props.profile.thumbnail : null
		);
	}, [props.profile]);

	function handleUpdate(response: string) {
		permawebProvider.refreshProfile();

		if (props.handleUpdate) props.handleUpdate();
		if (props.handleClose) props.handleClose();

		addNotification(response, 'success');
	}

	async function handleSubmit() {
		if (arProvider.wallet) {
			setLoading(true);

			try {
				let data: any = {
					username: username,
					displayName: name,
					description: description,
				};

				if (thumbnail) data.thumbnail = thumbnail;
				if (banner) data.banner = banner;

				if (props.profile && props.profile.id) {
					const profileUpdateId = await permawebProvider.libs.updateProfile(data, props.profile.id, (status: any) =>
						console.log(status)
					);
					console.log(`Profile update: ${profileUpdateId}`);
					handleUpdate(`${language.profileUpdated}!`);
				} else {
					const profileId = await permawebProvider.libs.createProfile(data, (status: any) => console.log(status));

					console.log(`Profile ID: ${profileId}`);

					handleUpdate(`${language.profileCreated}!`);
				}
			} catch (e: any) {
				addNotification(e.message ?? language.errorUpdatingProfile, 'warning');
			}

			setLoading(false);
		}
	}

	function getInvalidBio() {
		if (description && description.length > MAX_BIO_LENGTH) {
			return {
				status: true,
				message: `${language.maxCharsReached} (${description.length} / ${MAX_BIO_LENGTH})`,
			};
		}
		return { status: false, message: null };
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'thumbnail') {
		if (e.target.files && e.target.files.length) {
			const file = e.target.files[0];
			if (file.type.startsWith('image/')) {
				const reader = new FileReader();

				reader.onload = (event: ProgressEvent<FileReader>) => {
					if (event.target?.result) {
						switch (type) {
							case 'banner':
								setBanner(event.target.result);
								break;
							case 'thumbnail':
								setThumbnail(event.target.result);
								break;
							default:
								break;
						}
					}
				};

				reader.readAsDataURL(file);
			}
			e.target.value = '';
		}
	}

	function getBannerWrapper() {
		if (banner) return <img src={checkValidAddress(banner) ? getTxEndpoint(banner) : banner} />;
		return (
			<>
				<ReactSVG src={ASSETS.image} />
				<span>{language.uploadBanner}</span>
			</>
		);
	}

	function getAvatarWrapper() {
		if (thumbnail) return <img src={checkValidAddress(thumbnail) ? getTxEndpoint(thumbnail) : thumbnail} />;
		return (
			<>
				<ReactSVG src={ASSETS.user} />
				<span>{language.uploadAvatar}</span>
			</>
		);
	}

	function getConnectedView() {
		if (!arProvider.walletAddress) return <WalletBlock />;
		else {
			return (
				<>
					<S.Wrapper>
						<S.Body>
							<S.PWrapper>
								<S.FileInputWrapper>
									<S.BInput
										hasBanner={banner !== null}
										onClick={() => bannerInputRef.current.click()}
										disabled={loading}
									>
										{getBannerWrapper()}
									</S.BInput>
									<input
										ref={bannerInputRef}
										type={'file'}
										onChange={(e: any) => handleFileChange(e, 'banner')}
										disabled={loading}
										accept={ALLOWED_BANNER_TYPES}
									/>
									<S.AInput
										hasAvatar={thumbnail !== null}
										onClick={() => avatarInputRef.current.click()}
										disabled={loading}
									>
										{getAvatarWrapper()}
									</S.AInput>
									<input
										ref={avatarInputRef}
										type={'file'}
										onChange={(e: any) => handleFileChange(e, 'thumbnail')}
										disabled={loading}
										accept={ALLOWED_AVATAR_TYPES}
									/>
								</S.FileInputWrapper>
								<S.PActions>
									<Button
										type={'primary'}
										label={language.removeAvatar}
										handlePress={() => setThumbnail(null)}
										disabled={loading || !thumbnail}
									/>
									<Button
										type={'primary'}
										label={language.removeBanner}
										handlePress={() => setBanner(null)}
										disabled={loading || !banner}
									/>
								</S.PActions>
							</S.PWrapper>
							<S.Form>
								<S.TForm>
									<FormField
										label={language.name}
										value={name}
										onChange={(e: any) => setName(e.target.value)}
										disabled={loading}
										invalid={{ status: false, message: null }}
										required
										hideErrorMessage
									/>
									<FormField
										label={language.handle}
										value={username}
										onChange={(e: any) => setUsername(e.target.value)}
										disabled={loading}
										invalid={{ status: false, message: null }}
										hideErrorMessage
										required
									/>
								</S.TForm>
								<TextArea
									label={language.bio}
									value={description}
									onChange={(e: any) => setDescription(e.target.value)}
									disabled={loading}
									invalid={getInvalidBio()}
								/>
							</S.Form>
							<S.SAction>
								{props.handleClose && (
									<Button
										type={'primary'}
										label={language.close}
										handlePress={() => props.handleClose()}
										disabled={loading}
										loading={false}
									/>
								)}
								<Button
									type={'alt1'}
									label={language.save}
									handlePress={handleSubmit}
									disabled={!username || !name || loading}
									loading={false}
								/>
							</S.SAction>
						</S.Body>
					</S.Wrapper>
					{loading && (
						<Loader
							message={
								props.profile && props.profile.id
									? `${language.profileUpdatingInfo}...`
									: `${language.profileCreatingInfo}...`
							}
						/>
					)}
				</>
			);
		}
	}

	return getConnectedView();
}
