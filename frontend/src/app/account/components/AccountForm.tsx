"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserSchema, UpdateUserBody } from "common";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import useSWR from "swr";
import { authFetcher, mutationFetch } from "@/lib/fetcher";

export function AccountForm({
	user,
	token,
}: {
	user: z.infer<typeof UserSchema>;
	token: string;
}) {
	const { data, mutate } = useSWR(`/user/${user.id}`, authFetcher(UserSchema), {
		fallbackData: user,
	});

	const form = useForm<z.infer<typeof UpdateUserBody>>({
		resolver: zodResolver(UpdateUserBody),
		values: {
			name: data.name,
		},
		resetOptions: {
			keepDirtyValues: true,
		},
	});

	async function onSubmit(formData: z.infer<typeof UpdateUserBody>) {
		try {
			const result = await mutationFetch(`/user/${user.id}`, {
				token,
				body: formData,
			});
			mutate({
				...data,
				...formData,
			});
			form.reset({ name: formData.name });
			toast.success(result.message);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Something went wrong",
			);
		}
	}

	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle>Edit account info</CardTitle>
				<CardDescription>Update your account information here.</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
							<AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
							<div>
								<p className="font-medium">Heads up</p>
								<p className="text-amber-800">
									Updating your name changes it everywhere across CURaise —
									including in every organization you belong to, your order
									history visible to sellers, and any fundraisers you admin.
									Emails and receipts already sent will still show your previous
									name.
								</p>
							</div>
						</div>
						<Button type="submit" disabled={!form.formState.isDirty}>
							Save changes
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
