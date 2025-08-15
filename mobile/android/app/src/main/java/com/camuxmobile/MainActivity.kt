package com.camuxmobile

import android.media.AudioManager
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "CamuxMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Configure audio for media playback instead of phone calls
    val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
    
    // Set to normal mode (not phone call mode)
    audioManager.mode = AudioManager.MODE_NORMAL
    
    // Route audio to speakers by default
    audioManager.isSpeakerphoneOn = true
    
    // Set volume control to media volume
    volumeControlStream = AudioManager.STREAM_MUSIC
    
    // Request audio focus for media playback
    val result = audioManager.requestAudioFocus(
      null, // AudioManager.OnAudioFocusChangeListener
      AudioManager.STREAM_MUSIC,
      AudioManager.AUDIOFOCUS_GAIN
    )
    
    if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      // Audio focus granted, good to proceed
    }
  }
}
