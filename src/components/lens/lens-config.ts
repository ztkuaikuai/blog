export interface LensSettings {
	lensSize: number
	lensDistortion: number
	rgbShiftR: number
	rgbShiftG: number
	rgbShiftB: number
	waveFrequency: number
	waveStrength: number
	waveSpeed: number
	randomFrequency: number
	randomStrength: number
	randomSpeed: number
	pointerEase: number
}

export const defaultLensSettings: LensSettings = {
	lensSize: 0.34,
	lensDistortion: 1.65,
	rgbShiftR: 0.012,
	rgbShiftG: 0,
	rgbShiftB: -0.012,
	waveFrequency: 10,
	waveStrength: 0.008,
	waveSpeed: 1,
	randomFrequency: 1,
	randomStrength: 0.018,
	randomSpeed: 0.2,
	pointerEase: 0.09
}

interface LensControl {
	label: string
	setting: keyof LensSettings
	min: number
	max: number
	step: number
}

interface LensControlGroup {
	label: string
	controls: LensControl[]
}

export const lensControlGroups: LensControlGroup[] = [
	{
		label: '透镜',
		controls: [
			{ label: '尺寸', setting: 'lensSize', min: 0.16, max: 0.52, step: 0.01 },
			{ label: '折射强度', setting: 'lensDistortion', min: -1, max: 3, step: 0.05 }
		]
	},
	{
		label: '色彩偏移',
		controls: [
			{ label: '红色', setting: 'rgbShiftR', min: -0.03, max: 0.03, step: 0.001 },
			{ label: '绿色', setting: 'rgbShiftG', min: -0.03, max: 0.03, step: 0.001 },
			{ label: '蓝色', setting: 'rgbShiftB', min: -0.03, max: 0.03, step: 0.001 }
		]
	},
	{
		label: '背景波纹',
		controls: [
			{ label: '频率', setting: 'waveFrequency', min: 0, max: 30, step: 1 },
			{ label: '强度', setting: 'waveStrength', min: 0, max: 0.025, step: 0.001 },
			{ label: '速度', setting: 'waveSpeed', min: 0, max: 3, step: 0.05 }
		]
	},
	{
		label: '随机扰动',
		controls: [
			{ label: '频率', setting: 'randomFrequency', min: 0.1, max: 8, step: 0.1 },
			{ label: '强度', setting: 'randomStrength', min: 0, max: 0.05, step: 0.001 },
			{ label: '速度', setting: 'randomSpeed', min: 0, max: 1, step: 0.05 }
		]
	},
	{
		label: '指针',
		controls: [{ label: '跟随速度', setting: 'pointerEase', min: 0.02, max: 0.3, step: 0.01 }]
	}
]
