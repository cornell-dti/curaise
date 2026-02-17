"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import { ChevronRight, Building2, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
	const [loggedIn, setLoggedIn] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const checkLoginStatus = async () => {
			const supabase = await createClient();
			const { data, error } = await supabase.auth.getUser();
			if (error || !data.user) {
				setLoggedIn(false);
			} else {
				setLoggedIn(true);
			}
		};
		checkLoginStatus();
	}, []);

	const handleLogin = () => {
		signInWithGoogle();
	};

	const handleLogout = () => {
		signOut();
	};

	const navigateToOrganizations = () => {
		router.push("/seller");
	};

	const navigateToSettings = () => {
		router.push("/account");
	};

	return (
		<div className="w-full px-4 py-6 space-y-6">
			<h1 className="text-2xl font-bold">Account</h1>

			{loggedIn ? (
				<div className="space-y-2">
					<button
						onClick={navigateToOrganizations}
						className="w-full flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
						<div className="flex items-center gap-3">
							<Building2 className="h-5 w-5" />
							<span className="text-base">Organizations</span>
						</div>
						<ChevronRight className="h-5 w-5 text-gray-400" />
					</button>

					<button
						onClick={navigateToSettings}
						className="w-full flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
						<div className="flex items-center gap-3">
							<Settings className="h-5 w-5" />
							<span className="text-base">Settings</span>
						</div>
						<ChevronRight className="h-5 w-5 text-gray-400" />
					</button>

					<button
						onClick={handleLogout}
						className="w-full flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
						<div className="flex items-center gap-3 text-red-600">
							<LogOut className="h-5 w-5" />
							<span className="text-base">Sign out</span>
						</div>
						<ChevronRight className="h-5 w-5 text-gray-400" />
					</button>
				</div>
			) : (
				<div className="text-center py-12">
					<p className="text-gray-500 mb-4">You are not logged in</p>
					<button
						onClick={handleLogin}
						className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
						Log In
					</button>
				</div>
			)}
		</div>
	);
}
