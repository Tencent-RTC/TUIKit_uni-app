export const PREMIUM_REQUIRED_EVENT = 'atomicx-premium-required';

export const emitPremiumRequired = (message: string): void => {
  uni.$emit(PREMIUM_REQUIRED_EVENT, message);
};
