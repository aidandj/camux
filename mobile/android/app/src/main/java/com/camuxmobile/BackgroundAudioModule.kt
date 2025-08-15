package com.camuxmobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class BackgroundAudioModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "BackgroundAudioModule"
    }
    
    @ReactMethod
    fun startBackgroundAudio(promise: Promise) {
        try {
            val context = reactApplicationContext
            BackgroundAudioService.startService(context)
            promise.resolve("Background audio service started")
        } catch (e: Exception) {
            promise.reject("START_ERROR", "Failed to start background audio service", e)
        }
    }
    
    @ReactMethod
    fun stopBackgroundAudio(promise: Promise) {
        try {
            val context = reactApplicationContext
            BackgroundAudioService.stopService(context)
            promise.resolve("Background audio service stopped")
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop background audio service", e)
        }
    }
}