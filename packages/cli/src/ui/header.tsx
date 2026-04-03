import type { FC } from 'react'
import { Box, Text } from 'ink'

declare const __PACKAGE_VERSION__: string

export const Header: FC = () => (
  <Box flexDirection="column" paddingLeft={1}>
    <Box>
      <Text bold color="cyan">
        ⚡ route-auditor
      </Text>
      <Text dimColor> v{__PACKAGE_VERSION__}</Text>
    </Box>
    <Text dimColor>Audit Next.js routes for security issues.</Text>
  </Box>
)
