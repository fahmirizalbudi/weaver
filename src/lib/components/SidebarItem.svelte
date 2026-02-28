<script lang="ts">
	import WeatherIcon from './WeatherIcon.svelte';

	/**
	 * Renders a sidebar item for the daily weather forecast.
	 */
	let { active, code, name, description, temp } = $props<{
		/** Indicates if this item is currently selected. */
		active: boolean;
		/** WMO weather interpretation code. */
		code: number;
		/** Name of the day. */
		name: string;
		/** Descriptive weather condition. */
		description: string;
		/** Temperature value in Celsius. */
		temp: number;
	}>();
</script>

<div class="sidebar-item" class:active>
	<div class="day-icon">
		<WeatherIcon {code} size={20} />
	</div>
	<div class="day-info">
		<div class="day-name">{name}</div>
		<div class="day-desc">{description}</div>
	</div>
	<div class="day-temp">{temp}°</div>
</div>

<style>
	.sidebar-item {
		display: flex;
		align-items: center;
		padding: 18px 30px;
		gap: 20px;
		transition: all 0.3s;
		opacity: 0.6;
	}

	.sidebar-item.active {
		opacity: 1;
		position: relative;
	}

	.sidebar-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4px;
		height: 24px;
		background-color: var(--accent);
		border-radius: 0 4px 4px 0;
	}

	.day-name {
		font-size: 16px;
		font-weight: 500;
	}

	.day-desc {
		font-size: 12px;
		color: var(--text-muted);
	}

	.day-temp {
		margin-left: auto;
		font-weight: 400;
		font-size: 16px;
	}
</style>
