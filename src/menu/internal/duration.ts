import humanizeDuration from 'humanize-duration'

export const duration = humanizeDuration.humanizer({
  units: ['s'],
  maxDecimalPoints: 2,
  language: 'short',
  spacer: '',
  languages: {
    short: {
      s: () => 's',
    },
  },
})
