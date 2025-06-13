export const statusText = ref('')

export function statusMessage(status: string) {
  statusText.value = status
}
