<script lang="ts">
	/**
	 * Renders a single location search result.
	 */
	let { name, meta, onclick } = $props<{
		/** Name of the location. */
		name: string;
		/** Metadata like country or administrative region. */
		meta: string;
		/** Event handler for selecting the location. */
		onclick: () => void;
	}>();
</script>

<button class="result-row" {onclick}>
	<div class="res-info">
		<span class="res-name">{name}</span>
		<span class="res-meta">{meta}</span>
	</div>
</button>

<style>
	.result-row {
		width: 100%;
		display: flex;
		align-items: center;
		padding: 12px;
		background: none;
		border: none;
		color: #fff;
		text-align: left;
		cursor: pointer;
		border-radius: 12px;
		transition: background 0.2s;
	}

	.result-row:hover {
		background: rgba(255,255,255,0.05);
	}

	.res-info {
		display: flex;
		flex-direction: column;
	}

	.res-name {
		font-size: 14px;
		font-weight: 500;
	}

	.res-meta {
		font-size: 11px;
		color: #555;
	}
</style>
