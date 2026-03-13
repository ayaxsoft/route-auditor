import { DynamicSegments } from '@route-auditor/shared'

export const extractDynamicSegments = (routePath: string): DynamicSegments => {
  const segments = routePath.split('/').filter(Boolean)

  const dynamicSegments: string[] = []
  let hasCatchAll = false
  let hasOptionalCatchAll = false

  for (const segment of segments) {
    if (segment.startsWith('[[...') && segment.endsWith(']]')) {
      hasOptionalCatchAll = true
      dynamicSegments.push(segment.slice('[[...'.length, -']]'.length))
    } else if (segment.startsWith('[...') && segment.endsWith(']')) {
      hasCatchAll = true
      dynamicSegments.push(segment.slice('[...'.length, -']'.length))
    } else if (segment.startsWith('[') && segment.endsWith(']')) {
      dynamicSegments.push(segment.slice('['.length, -']'.length))
    }
  }

  return {
    isDynamic: dynamicSegments.length > 0,
    dynamicSegments,
    hasCatchAll,
    hasOptionalCatchAll,
  }
}
