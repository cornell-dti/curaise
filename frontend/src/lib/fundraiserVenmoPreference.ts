const getFundraiserSkipVenmoStorageKey = (fundraiserId: string) =>
  `fundraiser:${fundraiserId}:skip-venmo`;

export const getSkippedVenmoPreference = (fundraiserId: string) => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(getFundraiserSkipVenmoStorageKey(fundraiserId)) ===
    "true"
  );
};

export const setSkippedVenmoPreference = (
  fundraiserId: string,
  skipVenmo: boolean,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getFundraiserSkipVenmoStorageKey(fundraiserId);

  if (skipVenmo) {
    window.localStorage.setItem(storageKey, "true");
    return;
  }

  window.localStorage.removeItem(storageKey);
};
