import { keyframes } from 'styled-components';

export const open = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

export const openLeft = keyframes`
    from {
        transform: translateX(-100rem);
    }
    to {
        transform: translateX(0);
    }
`;

export const openRight = keyframes`
    from {
        transform: translateX(100rem);
    }
    to {
        transform: translateX(0);
    }
`;

export const close = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

// Panels move by their own width so the whole slide is visible whatever the panel size.
export const slideInRight = keyframes`
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
`;

export const slideOutRight = keyframes`
    from {
        transform: translateX(0);
    }
    to {
        transform: translateX(100%);
    }
`;

export const loaderKeyFrame = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

export const loadingSlide = keyframes`
  to {
    background-position: 100% 0, 0 0;
  }
`;

export const progressAnimation = keyframes`
	0% {
		background-position: 0 0;
	}
	100% {
		background-position: 60px 60px;
	}
`;

export const transition1 = '150ms cubic-bezier(0, 0, 0.2, 1) 0ms';
export const transition2 = '300ms cubic-bezier(0, 0, 0.2, 1) 0ms';
export const transition3 = '450ms cubic-bezier(0, 0, 0.2, 1) 0ms';

// Exits accelerate away; the close is deferred by this duration so the animation can finish.
export const transitionExitMs = 200;
export const transitionExit = `${transitionExitMs}ms cubic-bezier(0.4, 0, 1, 1) 0ms`;
