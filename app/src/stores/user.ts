import api, { RequestConfig } from '@/api';
import { userName } from '@/utils/user-name';
import { User } from '@directus/types';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';

type ShareUser = {
	share: string;
	role: {
		id: string;
		admin_access: false;
		app_access: false;
	};
};

export const useUserStore = defineStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | ShareUser | null,
		loading: false,
		error: null,
	}),
	getters: {
		fullName(): string | null {
			if (this.currentUser === null || 'share' in this.currentUser) return null;
			return userName(this.currentUser);
		},
		isAdmin(): boolean {
			return this.currentUser?.role?.admin_access === true || false;
		},
		isVendor(): boolean {
			return this.currentUser?.role?.id == 'b3ab233d-75bd-4477-8520-e4c3a4681bea';
		},
		isManager(): boolean {
			return this.currentUser?.role?.id == 'f0fa8dc0-6962-4d03-886d-650eafe194ed';
		},
		isDirector(): boolean {
			return this.currentUser?.role?.id == 'cd62eb09-a31f-4659-92e0-cbfbff9574d8';
		},
	},
	actions: {
		async hydrate() {
			this.loading = true;

			try {
				const fields = ['*', 'avatar.id', 'role.admin_access', 'role.app_access', 'role.id', 'role.enforce_tfa'];

				const { data } = await api.get(`/users/me`, { params: { fields } });

				this.currentUser = data.data;
			} catch (error: any) {
				this.error = error;
			} finally {
				this.loading = false;
			}
		},
		async dehydrate() {
			this.$reset();
		},
		async hydrateAdditionalFields(fields: string[]) {
			try {
				const { data } = await api.get(`/users/me`, { params: { fields } });

				this.currentUser = merge({}, this.currentUser, data.data);
			} catch (error: any) {
				// Do nothing
			}
		},
		async trackPage(to: RouteLocationNormalized) {
			/**
			 * We don't want to track the full screen preview from live previews as part of the user's
			 * last page, as that'll cause a fresh login to navigate to the full screen preview where
			 * you can't navigate away from #19160
			 */
			if (to.path.endsWith('/preview')) {
				return;
			}

			await api.patch(
				`/users/me/track/page`,
				{
					last_page: to.fullPath,
				},
				{ measureLatency: true } as RequestConfig,
			);

			if (this.currentUser && !('share' in this.currentUser)) {
				this.currentUser.last_page = to.fullPath;
			}
		},
	},
});
