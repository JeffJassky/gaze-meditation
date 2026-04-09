<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Only navigations that involve the immersive Theater route get a fade
// transition — the rest of the app (studio editor, dashboard, etc.)
// swaps instantly so normal navigation doesn't feel sluggish. We have
// to skip the <transition> wrapper entirely for non-Theater routes
// because Vue's default empty-name transition still applies `v-enter-*`
// classes which inherit from the default fade styling.
const router = useRouter()
const animateRoute = ref(false)
router.beforeEach((to, from) => {
	animateRoute.value = to.name === 'theater' || from?.name === 'theater'
})
</script>

<template>
	<div class="w-full min-h-screen bg-black text-white">
		<router-view v-slot="{ Component }">
			<transition v-if="animateRoute" name="fade" mode="out-in">
				<component :is="Component" />
			</transition>
			<component v-else :is="Component" />
		</router-view>
	</div>
</template>

<style>
/* No specific scoped styles needed, using Tailwind */
:root {
	/* The "Glacial" Ease (Strong Ease-Out) */
	--ease-glacial: cubic-bezier(0.19, 1, 0.22, 1);
	/* Strong Ease-In to match */
	--ease-in-glacial: cubic-bezier(0.75, 0, 1, 1);

	/* You can also define different speeds as variables */
	--duration-slow: 3s;
}

.fade-in {
	animation: fadeIn var(--duration-slow) var(--ease-glacial) forwards;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: scale(1.1);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
