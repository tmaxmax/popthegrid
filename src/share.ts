import { getCodeFromPath, storageKey, GameRecord } from '$edge/share'

export const getSharedRecord = (): GameRecord | undefined => {
  const code = getCodeFromPath(location.pathname)
  if (!code) {
    return
  }

  const data = sessionStorage.getItem(storageKey)
  if (!data) {
    return
  }

  return JSON.parse(data)
}

export const clearSharedRecord = () => {
  const code = getCodeFromPath(location.pathname)
  if (!code) {
    return
  }

  sessionStorage.removeItem(storageKey)
}
