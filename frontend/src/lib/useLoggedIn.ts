"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

/**
 * Whether there is a signed-in user. `null` while the check is still in flight,
 * so callers can decide what to show before the answer arrives: the account menu
 * stays optimistic, while links to seller-only areas stay hidden.
 */
export function useLoggedIn(): boolean | null {
	const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

	useEffect(() => {
		let active = true;

		const checkLoginStatus = async () => {
			const supabase = createClient();
			const { data, error } = await supabase.auth.getUser();
			if (!active) return;
			setLoggedIn(!error && !!data.user);
		};
		checkLoginStatus();

		return () => {
			active = false;
		};
	}, []);

	return loggedIn;
}
