# Audio startup that survives iOS

Everything here presents the same way to a user: "it works on my laptop but not on the
iPhone." They are different faults with different fixes, so identify which one you have
before changing code.

| Symptom on iPhone | Almost always |
|---|---|
| Splash dismisses, every tap silent | Activation never granted, or the silent switch |
| Stuck forever on the loading state | An unbounded `await` in the startup path |
| Works, then silent after a phone call or app switch | Context interrupted and never resumed |
| Blank white screen | Not audio at all — see `pwa-deploy.md` |

## 1. Unlock from a click, never from `pointerdown`

WebKit grants user activation when the finger **lifts**. `pointerdown` comes from
`touchstart` and does not qualify. `AudioContext.resume()` called without activation
does not reject — it stays pending — so the app hangs rather than erroring.

`preventDefault()` on that handler compounds it by suppressing the synthesized click
that would otherwise have granted activation.

```ts
// The unlock gate — click, and no preventDefault.
<button onClick={handleStart}>…</button>
```

Everything else should stay on `pointerdown`, because latency between finger and sound
is what makes an instrument feel real. That is safe: activation is only needed for the
initial resume, and by then it has happened.

Chromium and Firefox are far more permissive, so no browser you have in CI reproduces
this. That asymmetry is why a source-level test guarding the unlock handler earns its
keep — see the main SKILL.md.

## 2. The ring/silent switch mutes Web Audio

iOS runs Web Audio through the `ambient` audio session, which the physical mute switch
silences. HTML `<audio>` is exempt; Web Audio is not. A phone on silent plays nothing no
matter how correct the code is.

```ts
// Safari 16.4+. Absent elsewhere, so feature-detect and move on.
if (navigator.audioSession) {
  navigator.audioSession.type = 'playback'
}
```

Set it **before** starting the context. Below 16.4 there is no API fix; the switch has
to be flipped by hand, which is worth telling the user rather than debugging for an
hour.

`navigator.audioSession` is not in `lib.dom` yet, so declare it:

```ts
interface AudioSession {
  type: 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'
}
declare global {
  interface Navigator { audioSession?: AudioSession }
}
```

## 3. Bound every await, and say what failed

Audio libraries construct their `AudioContext` at import time, before any gesture
exists. On iOS, resuming such a context can stay pending indefinitely. Awaiting it
unconditionally is a trap, and the user sees a loading animation forever.

```ts
function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ])
}
```

Apply it to context start, to the resume nudge, and to sample loading. Treat a context
that will not start as **survivable**: load the samples anyway and let the user in, since
a later tap often resumes it and a visible app beats a spinner.

Then nudge the raw context directly while the activation is still live, because
`start()` can resolve with the context still parked:

```ts
if (context.state !== 'running') {
  await withTimeout(Promise.resolve(context.rawContext.resume?.()), 4000, 'Resuming').catch(
    () => undefined,
  )
}
```

## 4. Load samples yourself rather than through a library callback

Sampler helpers usually report load failures through an `onload`/`onerror` pair. If
neither fires, the caller waits forever. Fetching and decoding by hand costs a few lines
and buys an error message naming the file and status code — the difference between a
fixable bug report and an infinite spinner on someone else's phone.

```ts
const response = await withTimeout(fetch(url), 25_000, file)
if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
const buffer = await decodeAudio(await response.arrayBuffer())
```

Safari shipped promise-based `decodeAudioData` late and still honours the callback form,
so support both instead of betting on which one the phone has:

```ts
function decodeAudio(bytes: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const maybe = rawContext.decodeAudioData(bytes, resolve, reject) as
      | Promise<AudioBuffer>
      | undefined
    if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject)
  })
}
```

## 5. Make the phone tell you what broke

You are debugging on a device with no console attached, usually via a family member
reading a screen to you. Put the failure on screen: the message, the URL that failed,
and the audio context state. One round trip instead of five.

Let a failed attempt be retried — don't cache the rejection as the permanent answer, or
"tap to try again" does nothing.

## 6. Latency

Fire notes on `pointerdown`, drop the library's scheduling lookahead near zero, and set
`touch-action: manipulation` plus `user-select: none` to kill the 300ms tap delay and
long-press selection. Decode every sample before dismissing the splash so the first tap
is instant.

For sequenced playback, schedule the **audio** on the transport and the **visual**
highlight through the library's draw scheduler. `setInterval` drifts away from the sound
within a few bars, and for this kind of app the sound/sight correspondence is the entire
product.

## 7. Let taps interrupt playback

If the app plays a prompt and locks input until it finishes, an eight-note prompt is
four seconds of taps doing nothing — indistinguishable from a hang to a child. Stop the
playback and accept the input instead.
