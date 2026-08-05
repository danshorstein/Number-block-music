/**
 * Optional spoken labels (D3). The requirements deferred this "unless cheap" — the Web
 * Speech API is free and about a line, so it ships, but it stays off by default: a
 * spoken "three" competes for attention with the note it is naming.
 */

const NUMBER_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakDegree(degree: number): void {
  speak(NUMBER_WORDS[degree] ?? String(degree))
}

export function speakLetter(letter: string): void {
  // "C." reads better than "C", which some voices render as a word.
  speak(`${letter}.`)
}

function speak(text: string): void {
  if (!isSpeechAvailable()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1.3
  window.speechSynthesis.speak(utterance)
}
