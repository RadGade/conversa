<script>
	export let name;
	import {newUserLogin, login} from './app.js'
	let uudi,
		link = "wairing",
		loginTime = new Date();

		function newUser() {
			newUserLogin(uudi)
		}

var localStorageKey = localStorage.getItem('chatKeyPair');
		
</script>

<main>

	
{#if localStorageKey}
	 <!-- content here -->
	 <h1>Welcome Back</h1>
	 {loginTime}
{:else}
	 <!-- else content here -->
	<h1>Hello {name}!</h1>
	<input type="text" bind:value={uudi}>
	<button on:click={newUser}>New Login</button>
{/if}

<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>


</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

