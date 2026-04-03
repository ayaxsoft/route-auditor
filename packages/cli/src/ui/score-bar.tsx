import type { FC } from 'react'
import { Box, Text } from 'ink'
import { SCORE_BAR_WIDTH } from '../constants'

const BAR_FILLED = '█'
const BAR_EMPTY = '░'

interface ScoreLabel {
  text: string
  color: string
  bold: boolean
}

const resolveScoreLabel = (score: number): ScoreLabel => {
  if (score >= 80) return { text: 'Good', color: 'green', bold: true }
  if (score >= 60) return { text: 'Medium', color: 'yellow', bold: true }
  if (score >= 40) return { text: 'High', color: 'red', bold: false }
  return { text: 'Critical', color: 'red', bold: true }
}

interface ScoreBarProps {
  score: number
}

export const ScoreBar: FC<ScoreBarProps> = ({ score }) => {
  const filledCount = Math.round((score / 100) * SCORE_BAR_WIDTH)
  const emptyCount = SCORE_BAR_WIDTH - filledCount
  const { text, color, bold } = resolveScoreLabel(score)

  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Box>
        <Text bold>{score}</Text>
        <Text dimColor> / 100 </Text>
        <Text color={color} bold={bold}>
          {text}
        </Text>
      </Box>
      <Box>
        <Text color={color}>{BAR_FILLED.repeat(filledCount)}</Text>
        <Text dimColor>{BAR_EMPTY.repeat(emptyCount)}</Text>
      </Box>
    </Box>
  )
}
