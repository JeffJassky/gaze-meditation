<script setup lang="ts">
// No specific setup needed for App.vue as it's now just a router host
</script>

<template>
	<div class="w-full h-screen bg-black text-white overflow-hidden">
		<router-view v-slot="{ Component }">
			<transition name="fade" mode="out-in">
				<component :is="Component" />
			</transition>
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
