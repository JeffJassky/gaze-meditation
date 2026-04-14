<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
	<div class="min-h-screen w-full bg-surface text-content p-6 md:p-12">
		<article class="max-w-3xl mx-auto prose-sm">
			<RouterLink to="/" class="text-sm text-content-secondary hover:text-content underline underline-offset-4 mb-8 inline-block">&larr; Back</RouterLink>

			<h1 class="text-3xl font-semibold mb-1">Privacy Policy</h1>
			<p class="text-sm text-content-secondary mb-10">Last updated April 14, 2026</p>

			<p>
				This privacy notice for Gaze ("<strong>we</strong>," "<strong>us</strong>," or
				"<strong>our</strong>") describes how and why we collect, store, use, and share
				your information when you use our services ("<strong>Services</strong>"), including
				when you visit
				<a href="https://gazedeep.space" class="text-content-secondary hover:text-content underline underline-offset-4">gazedeep.space</a>
				or any website of ours that links to this privacy notice.
			</p>
			<p>
				Questions or concerns? Reading this notice will help you understand your privacy
				rights and choices. If you do not agree with our policies and practices, please do
				not use our Services.
			</p>

			<!-- Summary -->
			<h2 class="text-xl font-semibold mt-10 mb-4">Summary of Key Points</h2>
			<ul class="list-disc pl-5 space-y-2 text-sm text-content-secondary">
				<li><strong>Personal information:</strong> We collect information you provide when you register, create content, and use our Services.</li>
				<li><strong>Biometric &amp; physiological data:</strong> Our Services use your device camera to analyze facial landmarks, eye behavior, and head movement in real time. This processing happens <strong>entirely on your device</strong> — no video is transmitted to our servers. Only aggregated performance summaries are stored.</li>
				<li><strong>Sensitive information:</strong> We process biometric-derived data (blink rate, breath rate, stillness, eye openness) for the purpose of providing biofeedback. This data is stored as numerical summaries, not raw biometric templates.</li>
				<li><strong>Third parties:</strong> We share limited data with service providers (email delivery, text-to-speech, file storage) as described below.</li>
				<li><strong>No tracking or advertising:</strong> We do not use analytics services, advertising networks, or tracking pixels.</li>
				<li><strong>Your rights:</strong> Depending on your location, you may have rights to access, correct, or delete your personal information.</li>
			</ul>

			<!-- TOC -->
			<h2 class="text-xl font-semibold mt-10 mb-4">Table of Contents</h2>
			<ol class="list-decimal pl-5 space-y-1 text-sm text-content-secondary">
				<li>What Information Do We Collect?</li>
				<li>How Do We Use Your Information?</li>
				<li>Device Access &amp; Biometric Processing</li>
				<li>When and With Whom Do We Share Your Information?</li>
				<li>Cookies &amp; Local Storage</li>
				<li>International Data Transfers</li>
				<li>How Long Do We Keep Your Information?</li>
				<li>Do We Collect Information From Minors?</li>
				<li>What Are Your Privacy Rights?</li>
				<li>California Privacy Rights (CCPA)</li>
				<li>Do We Make Updates to This Notice?</li>
				<li>How Can You Contact Us?</li>
			</ol>

			<!-- 1 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">1. What Information Do We Collect?</h2>

			<h3 class="text-base font-semibold mt-6 mb-2">Information you provide to us</h3>
			<p>We collect personal information that you voluntarily provide when you register, create content, or contact us, including:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li><strong>Account data:</strong> username, email address (optional), password (stored as a bcrypt hash — we never store plaintext passwords)</li>
				<li><strong>Profile data:</strong> bio, avatar image</li>
				<li><strong>Content you create:</strong> meditation sessions, playlists, scenes, uploaded audio and image files, text scripts</li>
				<li><strong>Settings &amp; preferences:</strong> studio configuration, theme preference, voice preferences</li>
			</ul>

			<h3 class="text-base font-semibold mt-6 mb-2">Information collected automatically</h3>
			<p>When you use our Services, we automatically collect:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li><strong>Session performance data:</strong> when you complete a meditation session, we store duration, scenes completed, completeness percentage, start/end timestamps, and points earned</li>
				<li><strong>Aggregated biometric summaries:</strong> numerical values derived from on-device facial analysis, including blink rate, blink speed, breath rate, stillness score, eye openness, and relaxation metrics — stored as start baselines, best achieved values, and percentage improvements</li>
				<li><strong>Authentication data:</strong> session cookies for maintaining your login state</li>
			</ul>
			<p class="text-sm text-content-secondary mt-2">
				We do <strong>not</strong> collect IP addresses for analytics, browser fingerprints, browsing history, or device identifiers beyond what is necessary for standard HTTP communication.
			</p>

			<!-- 2 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">2. How Do We Use Your Information?</h2>
			<p>We process your information to:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li>Provide, operate, and maintain our Services</li>
				<li>Create and manage your account</li>
				<li>Deliver real-time biofeedback during meditation sessions</li>
				<li>Track your progress, streaks, and experience points over time</li>
				<li>Generate AI narration for meditation sessions (via text-to-speech)</li>
				<li>Send transactional emails (verification, password reset) when you provide an email address</li>
				<li>Store and serve your uploaded content (audio, images)</li>
				<li>Protect against fraud and ensure security</li>
			</ul>

			<!-- 3 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">3. Device Access &amp; Biometric Processing</h2>
			<p>
				Our Services use device sensors to provide real-time biofeedback during meditation.
				This is a core feature of Gaze and warrants detailed explanation.
			</p>

			<h3 class="text-base font-semibold mt-6 mb-2">Camera</h3>
			<p>
				With your explicit permission, we access your device camera to perform facial
				landmark detection using machine learning models (TensorFlow.js and ONNX Runtime)
				that run <strong>entirely in your web browser</strong>. From the camera feed, we
				compute:
			</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li>Blink rate and blink speed</li>
				<li>Eye openness percentage</li>
				<li>Breath rate (estimated from facial movement)</li>
				<li>Head position (yaw, pitch, roll)</li>
				<li>Stillness score</li>
				<li>Brow and mouth position</li>
			</ul>
			<p class="mt-2"><strong>Your video never leaves your device.</strong> No images or video frames are transmitted to our servers or any third party. All computer vision processing happens locally in your browser. Only the resulting numerical values (e.g., "blink rate: 12/min") are sent to our server when a session is completed.</p>

			<h3 class="text-base font-semibold mt-6 mb-2">Microphone</h3>
			<p>
				With your permission, we may access your microphone for speech recognition (verbal
				affirmation during sessions). This uses your browser's built-in Web Speech API.
				No audio is recorded, stored, or transmitted to our servers.
			</p>

			<h3 class="text-base font-semibold mt-6 mb-2">Motion sensors</h3>
			<p>
				We may access accelerometer data to detect device movement and stillness. This
				data is processed locally and not stored.
			</p>

			<p class="mt-4 text-sm text-content-secondary">
				You can revoke device permissions at any time through your browser settings. The
				Services will continue to function with reduced biofeedback capability.
			</p>

			<!-- 4 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">4. When and With Whom Do We Share Your Information?</h2>
			<p>We share data with the following third-party service providers, strictly to operate our Services:</p>

			<div class="overflow-x-auto mt-4">
				<table class="w-full text-sm border border-edge rounded-lg">
					<thead>
						<tr class="bg-surface-secondary">
							<th class="text-left px-4 py-2 border-b border-edge font-medium">Provider</th>
							<th class="text-left px-4 py-2 border-b border-edge font-medium">Purpose</th>
							<th class="text-left px-4 py-2 border-b border-edge font-medium">Data shared</th>
						</tr>
					</thead>
					<tbody class="text-content-secondary">
						<tr class="border-b border-edge">
							<td class="px-4 py-2">ElevenLabs</td>
							<td class="px-4 py-2">Text-to-speech voice generation</td>
							<td class="px-4 py-2">Session text content to be narrated</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">SendGrid (Twilio)</td>
							<td class="px-4 py-2">Transactional email delivery</td>
							<td class="px-4 py-2">Email address, email content</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">DigitalOcean Spaces</td>
							<td class="px-4 py-2">File storage (S3-compatible)</td>
							<td class="px-4 py-2">Uploaded media files (audio, images)</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">MongoDB Atlas</td>
							<td class="px-4 py-2">Database hosting</td>
							<td class="px-4 py-2">All persistent user data</td>
						</tr>
						<tr>
							<td class="px-4 py-2">Google Fonts</td>
							<td class="px-4 py-2">Font delivery (CDN)</td>
							<td class="px-4 py-2">Standard HTTP request data (IP address, user agent)</td>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="mt-4 text-sm text-content-secondary">
				We do <strong>not</strong> sell your personal information. We do not share data
				with advertising networks, data brokers, or analytics providers.
			</p>

			<h3 class="text-base font-semibold mt-6 mb-2">User-provided API keys</h3>
			<p class="text-sm text-content-secondary">
				You may optionally provide your own ElevenLabs API key to use your personal voice
				library. This key is stored server-side and used only to make requests to
				ElevenLabs on your behalf. It is never exposed to the client or shared with any
				other party.
			</p>

			<!-- 5 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">5. Cookies &amp; Local Storage</h2>

			<h3 class="text-base font-semibold mt-6 mb-2">Cookies</h3>
			<p>We use a single, essential session cookie:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li><strong>Name:</strong> <code class="bg-surface-secondary px-1 rounded">gaze.sid</code></li>
				<li><strong>Purpose:</strong> authentication (keeping you signed in)</li>
				<li><strong>Duration:</strong> 30 days</li>
				<li><strong>Flags:</strong> HttpOnly, Secure (production), SameSite=Lax</li>
			</ul>
			<p class="mt-2 text-sm text-content-secondary">
				We do not use tracking cookies, advertising cookies, or any third-party cookies.
			</p>

			<h3 class="text-base font-semibold mt-6 mb-2">Browser local storage</h3>
			<p class="text-sm text-content-secondary">
				We store your theme preference (light/dark/system) in your browser's localStorage.
				This data never leaves your device.
			</p>

			<!-- 6 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">6. International Data Transfers</h2>
			<p>
				Our servers and infrastructure are located in the <strong>United States</strong>.
				If you access our Services from outside the United States, your information will be
				transferred to, stored, and processed in the United States.
			</p>
			<p class="text-sm text-content-secondary mt-2">
				If you are in the European Economic Area (EEA) or United Kingdom (UK), we will take
				measures to protect your information in accordance with this privacy notice and
				applicable data protection law.
			</p>

			<!-- 7 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">7. How Long Do We Keep Your Information?</h2>
			<p>We retain your information as follows:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li><strong>Account data:</strong> retained while your account is active; deleted upon account termination</li>
				<li><strong>Session history &amp; biometric summaries:</strong> retained until you delete individual records or your account</li>
				<li><strong>Uploaded media:</strong> retained until you delete the associated content or your account</li>
				<li><strong>Session cookies:</strong> expire after 30 days of inactivity</li>
				<li><strong>Email verification tokens:</strong> expire after 24 hours</li>
				<li><strong>Password reset tokens:</strong> expire after 30 minutes</li>
			</ul>
			<p class="text-sm text-content-secondary mt-2">
				When we have no ongoing legitimate need to process your information, we will delete
				or anonymize it. If deletion is not immediately possible (e.g., backup archives), we
				will securely store and isolate your information until deletion is possible.
			</p>

			<!-- 8 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">8. Do We Collect Information From Minors?</h2>
			<p>
				We do not knowingly collect data from or market to children under 18 years of age.
				By using our Services, you represent that you are at least 18. If we learn that we
				have collected personal information from a user under 18, we will deactivate the
				account and promptly delete such data. If you become aware of any data we may have
				collected from someone under 18, please contact us.
			</p>

			<!-- 9 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">9. What Are Your Privacy Rights?</h2>
			<p>Depending on your location, applicable privacy law may grant you the following rights:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li><strong>Access:</strong> request a copy of the personal information we hold about you</li>
				<li><strong>Rectification:</strong> request correction of inaccurate personal information</li>
				<li><strong>Erasure:</strong> request deletion of your personal information</li>
				<li><strong>Restriction:</strong> request that we restrict processing of your information</li>
				<li><strong>Portability:</strong> request a portable copy of your data</li>
				<li><strong>Objection:</strong> object to our processing of your personal information</li>
				<li><strong>Withdraw consent:</strong> if we rely on your consent, you may withdraw it at any time</li>
			</ul>

			<h3 class="text-base font-semibold mt-6 mb-2">Account management</h3>
			<p class="text-sm text-content-secondary">
				You can review, update, or delete your account information at any time from your
				account settings. You can delete individual session history records through the
				application. To request full account deletion, please contact us.
			</p>

			<h3 class="text-base font-semibold mt-6 mb-2">Device permissions</h3>
			<p class="text-sm text-content-secondary">
				You can revoke camera, microphone, and motion sensor permissions at any time through
				your browser or device settings. Our Services request each permission explicitly and
				only when needed.
			</p>

			<!-- 10 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">10. California Privacy Rights (CCPA)</h2>
			<p>If you are a California resident, you have the right to:</p>
			<ul class="list-disc pl-5 space-y-1 text-sm text-content-secondary">
				<li>Know what personal information we collect, use, and disclose</li>
				<li>Request deletion of your personal information</li>
				<li>Opt out of the sale or sharing of your personal information (we do not sell or share personal information)</li>
				<li>Non-discrimination for exercising your privacy rights</li>
			</ul>

			<h3 class="text-base font-semibold mt-6 mb-2">Categories of information collected</h3>
			<div class="overflow-x-auto mt-2">
				<table class="w-full text-sm border border-edge rounded-lg">
					<thead>
						<tr class="bg-surface-secondary">
							<th class="text-left px-4 py-2 border-b border-edge font-medium">Category</th>
							<th class="text-left px-4 py-2 border-b border-edge font-medium">Collected</th>
						</tr>
					</thead>
					<tbody class="text-content-secondary">
						<tr class="border-b border-edge">
							<td class="px-4 py-2">A. Identifiers (username, email)</td>
							<td class="px-4 py-2">Yes</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">B. Personal information (California Customer Records)</td>
							<td class="px-4 py-2">Yes (name, email)</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">C. Protected classifications</td>
							<td class="px-4 py-2">No</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">D. Commercial information</td>
							<td class="px-4 py-2">No</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">E. Biometric information</td>
							<td class="px-4 py-2">Yes (derived facial metrics, processed locally — aggregated summaries stored server-side)</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">F. Internet or network activity</td>
							<td class="px-4 py-2">No</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">G. Geolocation data</td>
							<td class="px-4 py-2">No</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">H. Audio, electronic, visual, or similar</td>
							<td class="px-4 py-2">Yes (user-uploaded audio/images for content creation; camera video processed locally only)</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">I. Professional or employment information</td>
							<td class="px-4 py-2">No</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">J. Education information</td>
							<td class="px-4 py-2">No</td>
						</tr>
						<tr class="border-b border-edge">
							<td class="px-4 py-2">K. Inferences</td>
							<td class="px-4 py-2">Yes (relaxation trends, improvement metrics derived from biometric data)</td>
						</tr>
						<tr>
							<td class="px-4 py-2">L. Sensitive personal information</td>
							<td class="px-4 py-2">No (biometric data is derived metrics, not biometric identifiers)</td>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="mt-4 text-sm text-content-secondary">
				We have not sold or shared personal information to third parties for business or
				commercial purposes in the preceding twelve months.
			</p>

			<!-- 11 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">11. Do We Make Updates to This Notice?</h2>
			<p>
				We may update this notice from time to time. The updated version will be indicated
				by a revised "Last updated" date. If we make material changes, we may notify you
				by posting a prominent notice on our Services. We encourage you to review this
				notice periodically.
			</p>

			<!-- 12 -->
			<h2 class="text-xl font-semibold mt-10 mb-4">12. How Can You Contact Us?</h2>
			<p>
				If you have questions or comments about this notice, or wish to exercise your
				privacy rights, you may contact us at:
			</p>
			<p class="mt-2 text-content-secondary">
				<strong>Gaze</strong><br />
				Email: <a href="mailto:privacy@gazedeep.space" class="text-content-secondary hover:text-content underline underline-offset-4">privacy@gazedeep.space</a>
			</p>
			<p class="text-sm text-content-secondary mt-4">
				To request access to, correction of, or deletion of your personal information,
				please email us at the address above. We will respond to your request within 30
				days.
			</p>

			<div class="mt-16 mb-8 pt-8 border-t border-edge text-xs text-content-tertiary text-center">
				&copy; {{ new Date().getFullYear() }} Gaze. All rights reserved.
			</div>
		</article>
	</div>
</template>
