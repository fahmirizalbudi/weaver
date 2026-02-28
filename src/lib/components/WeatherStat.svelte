<script lang="ts">
	let { label, value } = $props<{
		label: string;
		value: string | number;
	}>();
</script>

<div class="stat">
	<div class="stat-label">{label}</div>
	<div class="stat-value">{value}</div>
</div>

<style>
	.stat-label {
		font-size: 12px;
		color: #555;
		text-transform: uppercase;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 400;
	}
</style>
